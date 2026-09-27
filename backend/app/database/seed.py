"""
Database seeding script.
Populates tables with realistic municipal data for Vanguard City.
Runs synchronously or asynchronously during backend initialization.
"""
import asyncio
from datetime import datetime, timedelta, date
import random
from sqlalchemy import select
from app.database.session import AsyncSessionLocal, async_engine, Base
from app.models.models import (
    User, Ward, Road, RoadSegment, InfrastructureAsset,
    WaterAsset, PowerAsset, Complaint, Weather, Rainfall,
    WaterConsumption, ConstructionRecord, Detection, RiskScore, Alert
)

WARD_DEFINITIONS = [
    {"num": 1, "name": "Ward 1 - Old Town", "zone": "South Zone", "pop": 42000, "area": 8.2, "lat": 20.2435, "lng": 85.8312, "base_risk": 45.0},
    {"num": 2, "name": "Ward 2 - Railway Colony", "zone": "Central Zone", "pop": 58000, "area": 11.4, "lat": 20.2678, "lng": 85.8421, "base_risk": 67.0},
    {"num": 3, "name": "Ward 3 - Market Complex", "zone": "Central Zone", "pop": 71000, "area": 9.8, "lat": 20.2890, "lng": 85.8350, "base_risk": 82.0},
    {"num": 4, "name": "Ward 4 - Green Hills", "zone": "North Zone", "pop": 33000, "area": 7.1, "lat": 20.3150, "lng": 85.8120, "base_risk": 38.0},
    {"num": 5, "name": "Ward 5 - Industrial Estate", "zone": "East Zone", "pop": 89000, "area": 14.2, "lat": 20.2875, "lng": 85.8601, "base_risk": 91.0},
    {"num": 6, "name": "Ward 6 - University Enclave", "zone": "North Zone", "pop": 51000, "area": 10.3, "lat": 20.3012, "lng": 85.8190, "base_risk": 56.0},
    {"num": 7, "name": "Ward 7 - Riverside East", "zone": "East Zone", "pop": 63000, "area": 12.1, "lat": 20.2740, "lng": 85.8710, "base_risk": 74.0},
    {"num": 8, "name": "Ward 8 - Forest Colony", "zone": "West Zone", "pop": 28000, "area": 6.4, "lat": 20.2520, "lng": 85.7950, "base_risk": 29.0},
    {"num": 9, "name": "Ward 9 - Commercial Hub", "zone": "Central Zone", "pop": 95000, "area": 15.7, "lat": 20.2961, "lng": 85.8245, "base_risk": 88.0},
    {"num": 10, "name": "Ward 10 - Tech Park", "zone": "North Zone", "pop": 47000, "area": 9.2, "lat": 20.3280, "lng": 85.8050, "base_risk": 61.0},
    {"num": 11, "name": "Ward 11 - Suburb North", "zone": "North Zone", "pop": 38000, "area": 8.0, "lat": 20.3420, "lng": 85.8200, "base_risk": 43.0},
    {"num": 12, "name": "Ward 12 - Airport Zone", "zone": "West Zone", "pop": 72000, "area": 13.5, "lat": 20.2580, "lng": 85.8150, "base_risk": 77.0},
    {"num": 13, "name": "Ward 13 - Port Colony", "zone": "South Zone", "pop": 49000, "area": 9.9, "lat": 20.2310, "lng": 85.8450, "base_risk": 55.0},
    {"num": 14, "name": "Ward 14 - School District", "zone": "Central Zone", "pop": 83000, "area": 14.8, "lat": 20.3145, "lng": 85.8340, "base_risk": 87.0},
    {"num": 15, "name": "Ward 15 - Eco Reserve Buffer", "zone": "West Zone", "pop": 31000, "area": 7.6, "lat": 20.2650, "lng": 85.7820, "base_risk": 33.0},
]

async def seed_database():
    """Initializes schema and seeds baseline data."""
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Check if already seeded
        result = await session.execute(select(Ward))
        if result.scalars().first():
            print("Database already contains records. Skipping seed.")
            return

        print("Seeding Vanguard City database...")

        # 1. Seed Wards
        wards_objs = []
        for w in WARD_DEFINITIONS:
            ward = Ward(
                ward_number=w["num"],
                name=w["name"],
                zone=w["zone"],
                population=w["pop"],
                area_sq_km=w["area"],
                lat=w["lat"],
                lng=w["lng"],
                base_risk_score=w["base_risk"]
            )
            session.add(ward)
            wards_objs.append(ward)

        await session.flush()

        # 2. Seed Roads and Segments
        road_types = ["primary", "secondary", "residential", "tertiary"]
        road_names = ["Janpath Blvd", "MG Road", "Station Avenue", "Ring Road", "Airport Way", "Tech Corridor", "River View Road", "Gandhi Marg"]
        for i, name in enumerate(road_names):
            ward = wards_objs[i % len(wards_objs)]
            road = Road(
                osm_id=100000 + i,
                name=name,
                road_type=road_types[i % len(road_types)],
                ward_id=ward.id,
                total_length_meters=random.randint(1200, 6500),
                lane_count=random.choice([2, 4, 6])
            )
            session.add(road)
            await session.flush()

            for s in range(3):
                cond = random.choice(["good", "good", "fair", "poor", "critical"])
                damage = 85.0 if cond == "critical" else (65.0 if cond == "poor" else (35.0 if cond == "fair" else 10.0))
                segment = RoadSegment(
                    road_id=road.id,
                    ward_id=ward.id,
                    segment_code=f"SEG-{road.id:03d}-{s+1}",
                    condition_rating=cond,
                    damage_score=damage,
                    last_inspected=datetime.utcnow() - timedelta(days=random.randint(5, 60)),
                    start_lat=ward.lat + (s * 0.002),
                    start_lng=ward.lng + (s * 0.002),
                    end_lat=ward.lat + ((s+1) * 0.002),
                    end_lng=ward.lng + ((s+1) * 0.002),
                )
                session.add(segment)

        # 3. Seed Water Assets
        water_types = ["treatment_plant", "reservoir", "pump_station", "borewell"]
        for i in range(12):
            ward = wards_objs[i % len(wards_objs)]
            w_asset = WaterAsset(
                asset_code=f"WTR-{i+1:03d}",
                asset_type=water_types[i % len(water_types)],
                ward_id=ward.id,
                capacity_mld=round(random.uniform(15.0, 75.0), 1),
                current_flow_mld=round(random.uniform(10.0, 60.0), 1),
                pressure_bar=round(random.uniform(2.5, 6.0), 1),
                operational_status="active" if i % 5 != 0 else "maintenance",
                lat=ward.lat + 0.001,
                lng=ward.lng + 0.001
            )
            session.add(w_asset)

        # 4. Seed Power Assets
        power_types = ["transformer", "substation", "high_voltage_line", "pole"]
        for i in range(15):
            ward = wards_objs[i % len(wards_objs)]
            vuln = 85.0 if i in [3, 7, 13] else random.uniform(15.0, 60.0)
            p_asset = PowerAsset(
                asset_code=f"PWR-{i+1:03d}",
                asset_type=power_types[i % len(power_types)],
                ward_id=ward.id,
                capacity_kva=random.choice([250, 500, 1000, 2500]),
                vulnerability_score=round(vuln, 1),
                weather_exposure_level="critical" if vuln > 80 else ("high" if vuln > 60 else "moderate"),
                condition="poor" if vuln > 75 else "good",
                lat=ward.lat - 0.001,
                lng=ward.lng - 0.001
            )
            session.add(p_asset)

        # 5. Seed Complaints
        complaints_data = [
            ("road", "Large dangerous pothole near Government School", "High-traffic school zone road surface caved in. Vehicles swerving into oncoming lane.", "Ward 14 - School District", "critical", "in_progress", "Roads & Infrastructure"),
            ("water", "Severe drinking water shortage for 4 consecutive days", "Pipeline pressure dropped to zero. Colony residents rely on tankers.", "Ward 9 - Commercial Hub", "critical", "open", "Water Supply"),
            ("electricity", "High voltage transformer sparking near residential block", "Transformer T-45 showing intermittent sparking and buzzing sound during peak evening hours.", "Ward 5 - Industrial Estate", "high", "under_review", "Electrical Department"),
            ("drainage", "Stormwater channel clogged with construction debris, flooding road", "Monsoon drain overflowing onto arterial road causing 1-foot waterlogging.", "Ward 5 - Industrial Estate", "high", "open", "Drainage Department"),
            ("construction", "Unpermitted multi-storey structural expansion on public easement", "Excavation and column work initiated without municipal building permit display.", "Ward 12 - Airport Zone", "moderate", "under_review", "Building & Construction"),
            ("waste", "Solid waste dump accumulating near primary health center", "Commercial waste collection skipped for one week. Posing hygiene risk.", "Ward 3 - Market Complex", "moderate", "resolved", "Sanitation Department"),
        ]

        for i, (cat, title, desc, w_name, sev, status, dept) in enumerate(complaints_data):
            target_ward = next((w for w in wards_objs if w.name.startswith(w_name.split()[0])), wards_objs[0])
            complaint = Complaint(
                ticket_id=f"CMP-2024-{i+842:04d}",
                category=cat,
                title=title,
                description=desc,
                citizen_name=f"Citizen {i+1}",
                citizen_phone="9876543210",
                ward_id=target_ward.id,
                address=f"Sector {i+1}, {target_ward.name}",
                severity=sev,
                status=status,
                department=dept,
                assigned_to="Municipal Officer" if status != "open" else None,
                ai_classification={
                    "category": cat,
                    "confidence": round(random.uniform(0.88, 0.97), 2),
                    "keywords": [cat, "emergency", "maintenance"]
                },
                lat=target_ward.lat + 0.001,
                lng=target_ward.lng + 0.001,
                submitted_at=datetime.utcnow() - timedelta(hours=random.randint(2, 48))
            )
            session.add(complaint)

        # 6. Seed YOLO11 Detections
        det_data = [
            ("DET-001", "pothole", "high", 0.94, "Ward 14 - School District"),
            ("DET-002", "crack", "moderate", 0.87, "Ward 9 - Commercial Hub"),
            ("DET-003", "pothole", "critical", 0.96, "Ward 5 - Industrial Estate"),
            ("DET-004", "road_damage", "moderate", 0.79, "Ward 12 - Airport Zone"),
            ("DET-005", "pothole", "high", 0.91, "Ward 3 - Market Complex"),
        ]
        for code, dtype, sev, conf, w_name in det_data:
            target_ward = next((w for w in wards_objs if w.name.startswith(w_name.split()[0])), wards_objs[0])
            det = Detection(
                detection_code=code,
                model_name="YOLO11",
                damage_type=dtype,
                severity=sev,
                confidence=conf,
                bounding_box={"x": 140, "y": 95, "w": 210, "h": 150},
                ward_id=target_ward.id,
                lat=target_ward.lat + 0.001,
                lng=target_ward.lng + 0.001,
                detected_at=datetime.utcnow() - timedelta(hours=random.randint(1, 24))
            )
            session.add(det)

        # 7. Seed Construction Records
        const_records = [
            ("CON-001", "Ward 12", None, "pending_verification", 420.0, 0.87, "Large structural work in buffer zone. Human inspection required."),
            ("CON-002", "Ward 5", None, "under_review", 180.0, 0.72, "Materials dumped near green corridor. Permit search negative."),
            ("CON-003", "Ward 9", "BP-2023-4521", "verified_authorized", 650.0, 0.91, "Permitted residential redevelopment. Verified."),
            ("CON-004", "Ward 3", None, "pending_verification", 290.0, 0.83, "Activity adjacent to flood boundary. Field verification required."),
        ]
        for code, w_prefix, permit, status, area, conf, notes in const_records:
            target_ward = next((w for w in wards_objs if w.name.startswith(w_prefix)), wards_objs[0])
            crecord = ConstructionRecord(
                record_code=code,
                ward_id=target_ward.id,
                permit_number=permit,
                status=status,
                estimated_area_sqm=area,
                detection_confidence=conf,
                notes=notes,
                lat=target_ward.lat,
                lng=target_ward.lng,
                satellite_detection_date=datetime.utcnow() - timedelta(days=random.randint(1, 7))
            )
            session.add(crecord)

        # 8. Seed Risk Scores
        for ward in wards_objs:
            r_score = RiskScore(
                ward_id=ward.id,
                overall_score=ward.base_risk_score,
                risk_level="Critical" if ward.base_risk_score >= 76 else ("High" if ward.base_risk_score >= 51 else ("Moderate" if ward.base_risk_score >= 26 else "Low")),
                road_damage_factor=round(random.uniform(0.15, 0.35), 3),
                water_stress_factor=round(random.uniform(0.15, 0.35), 3),
                flood_exposure_factor=round(random.uniform(0.10, 0.25), 3),
                complaint_density_factor=round(random.uniform(0.10, 0.25), 3),
                power_vulnerability_factor=round(random.uniform(0.05, 0.15), 3),
                network_centrality_factor=round(random.uniform(0.05, 0.15), 3),
                recommended_action=f"AI Recommendation: Prioritize infrastructure inspection and water supply monitoring for {ward.name}."
            )
            session.add(r_score)

        # 9. Seed Alerts
        alerts_data = [
            ("ALT-001", "critical", "water_stress", "HIGH WATER STRESS — Ward 5 & Ward 9", "AI-predicted water deficit exceeds 35% in 2 wards. Supply augmentation recommended."),
            ("ALT-002", "high", "road_damage", "ROAD DAMAGE DETECTED — Ward 14", "YOLO11 detected multiple pothole clusters near school corridor."),
            ("ALT-003", "high", "risk_surge", "RISK SCORE ELEVATION — Ward 9", "Ward 9 risk score increased to 88 due to rainfall, complaints, and deficit."),
            ("ALT-004", "moderate", "unauthorized_construction", "POTENTIAL UNAUTHORIZED ACTIVITY — Ward 12", "Satellite analysis flagged structural activity. Human inspection required."),
            ("ALT-005", "moderate", "storm_power", "POWER VULNERABILITY ADVISORY", "Impending storm alert. 14 distribution assets in high-wind zones flagged."),
        ]
        for code, atype, cat, title, msg in alerts_data:
            alert = Alert(
                alert_code=code,
                alert_type=atype,
                category=cat,
                title=title,
                message=msg,
                is_active=True
            )
            session.add(alert)

        await session.commit()
        print("Database seeding completed successfully with 15 wards, roads, complaints, detections, and alerts.")

if __name__ == "__main__":
    asyncio.run(seed_database())
