"""
Mock data service — returns realistic data until Phase 4 (PostgreSQL integration)
All data here will be replaced by actual DB queries.
"""
import random
from datetime import datetime, timedelta
from typing import Any


def get_mock_wards() -> list[dict]:
    wards_data = [
        {"id": i, "name": f"Ward {i}", "risk_score": random.randint(25, 95),
         "population": random.randint(25000, 100000), "area_km2": round(random.uniform(6, 16), 1),
         "water_stress": random.choice(["low", "moderate", "high", "critical"]),
         "lat": 20.2961 + (i - 8) * 0.012, "lng": 85.8245 + (i - 8) * 0.010}
        for i in range(1, 16)
    ]
    # Set specific high-risk wards
    overrides = {5: 91, 9: 88, 14: 87, 12: 77, 7: 74}
    for i, score in overrides.items():
        wards_data[i - 1]["risk_score"] = score
    return wards_data


def get_mock_complaints() -> list[dict]:
    categories = ["road", "water", "electricity", "drainage", "construction", "waste"]
    statuses = ["open", "under_review", "in_progress", "resolved"]
    severities = ["low", "moderate", "high", "critical"]
    wards = [f"Ward {i}" for i in range(1, 16)]

    complaints = []
    for i in range(1, 21):
        cat = random.choice(categories)
        complaints.append({
            "id": f"CMP-2024-{i:04d}",
            "category": cat,
            "title": f"{cat.title()} issue in {random.choice(wards)}",
            "description": f"Reported {cat} issue requiring attention.",
            "ward": random.choice(wards),
            "severity": random.choice(severities),
            "status": random.choice(statuses),
            "department": f"{cat.title()} Department",
            "submitted_at": (datetime.now() - timedelta(days=random.randint(0, 30))).isoformat(),
            "ai_confidence": round(random.uniform(0.7, 0.98), 2),
        })
    return complaints


def get_mock_dashboard_summary() -> dict[str, Any]:
    return {
        "overall_risk_score": 72,
        "open_complaints": 847,
        "water_stress_wards": 6,
        "critical_road_segments": 23,
        "power_vulnerable_assets": 14,
        "potential_unauthorized_sites": 8,
        "active_alerts": 5,
        "resolved_today": 34,
        "data_source": "mock",
        "note": "Phase 2 mock data. Will be replaced by DB queries in Phase 4.",
    }


def get_mock_water_data() -> dict[str, Any]:
    return {
        "summary": {
            "total_supply_mld": 285,
            "predicted_demand_mld": 342,
            "deficit_mld": 57,
            "deficit_percent": 16.7,
            "high_stress_wards": 4,
            "critical_wards": 2,
        },
        "ward_water_status": [
            {"ward": f"Ward {i}", "supply": random.randint(15, 45),
             "demand": random.randint(18, 65), "stress_score": random.randint(5, 95)}
            for i in range(1, 11)
        ],
        "note": "AI-predicted values. Not official supply data.",
    }


def get_mock_detections() -> list[dict]:
    detection_types = ["pothole", "crack", "road_damage", "surface_deformation"]
    severities = ["low", "moderate", "high", "critical"]
    wards = [f"Ward {i}" for i in range(1, 16)]

    return [
        {
            "id": f"DET-{i:03d}",
            "type": random.choice(detection_types),
            "location": f"{random.choice(wards)}, Road Segment {i}",
            "confidence": round(random.uniform(0.70, 0.97), 2),
            "severity": random.choice(severities),
            "detected_at": (datetime.now() - timedelta(hours=random.randint(1, 72))).isoformat(),
            "model": "YOLO11",
            "note": "AI-generated detection. Requires human verification.",
        }
        for i in range(1, 11)
    ]
