"""
SQLAlchemy ORM Models for Vanguard City
Covers all 17 core municipal and spatial tables.
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Numeric, Boolean,
    DateTime, Date, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.database.session import Base

# 1. Users
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150))
    role = Column(String(50), default="citizen")  # citizen, authority_admin, field_officer, analyst
    department = Column(String(100))
    phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# 2. Wards
class Ward(Base):
    __tablename__ = "wards"

    id = Column(Integer, primary_key=True, index=True)
    ward_number = Column(Integer, unique=True, nullable=False)
    name = Column(String(100), nullable=False, index=True)
    zone = Column(String(100))
    population = Column(Integer, default=0)
    area_sq_km = Column(Numeric(8, 2))
    base_risk_score = Column(Numeric(5, 2), default=0.0)
    lat = Column(Numeric(10, 6))
    lng = Column(Numeric(10, 6))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    complaints = relationship("Complaint", back_populates="ward")
    roads = relationship("Road", back_populates="ward")
    risk_scores = relationship("RiskScore", back_populates="ward")


# 3. Roads
class Road(Base):
    __tablename__ = "roads"

    id = Column(Integer, primary_key=True, index=True)
    osm_id = Column(Integer, nullable=True)
    name = Column(String(255), nullable=False)
    road_type = Column(String(50), default="residential")
    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="SET NULL"), nullable=True)
    total_length_meters = Column(Numeric(10, 2))
    surface_type = Column(String(50), default="asphalt")
    lane_count = Column(Integer, default=2)
    created_at = Column(DateTime, default=datetime.utcnow)

    ward = relationship("Ward", back_populates="roads")
    segments = relationship("RoadSegment", back_populates="road", cascade="all, delete-orphan")


# 4. Road Segments
class RoadSegment(Base):
    __tablename__ = "road_segments"

    id = Column(Integer, primary_key=True, index=True)
    road_id = Column(Integer, ForeignKey("roads.id", ondelete="CASCADE"), nullable=False)
    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="SET NULL"), nullable=True)
    segment_code = Column(String(100), unique=True, nullable=False)
    condition_rating = Column(String(30), default="good")  # good, fair, poor, critical
    damage_score = Column(Numeric(5, 2), default=0.0)
    last_inspected = Column(DateTime, nullable=True)
    start_lat = Column(Numeric(10, 6))
    start_lng = Column(Numeric(10, 6))
    end_lat = Column(Numeric(10, 6))
    end_lng = Column(Numeric(10, 6))
    created_at = Column(DateTime, default=datetime.utcnow)

    road = relationship("Road", back_populates="segments")
    detections = relationship("Detection", back_populates="road_segment")


# 5. Infrastructure Assets
class InfrastructureAsset(Base):
    __tablename__ = "infrastructure_assets"

    id = Column(Integer, primary_key=True, index=True)
    asset_code = Column(String(100), unique=True, nullable=False)
    asset_type = Column(String(80), nullable=False)  # bridge, culvert, flyover, storm_drain
    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="SET NULL"), nullable=True)
    installation_year = Column(Integer)
    health_index = Column(Numeric(5, 2), default=100.0)
    status = Column(String(50), default="operational")
    lat = Column(Numeric(10, 6))
    lng = Column(Numeric(10, 6))
    metadata_info = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)


# 6. Water Assets
class WaterAsset(Base):
    __tablename__ = "water_assets"

    id = Column(Integer, primary_key=True, index=True)
    asset_code = Column(String(100), unique=True, nullable=False)
    asset_type = Column(String(80), nullable=False)  # reservoir, pipeline, treatment_plant, pump_station
    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="SET NULL"), nullable=True)
    capacity_mld = Column(Numeric(10, 2), default=0.0)
    current_flow_mld = Column(Numeric(10, 2), default=0.0)
    pressure_bar = Column(Numeric(6, 2))
    operational_status = Column(String(50), default="active")
    lat = Column(Numeric(10, 6))
    lng = Column(Numeric(10, 6))
    created_at = Column(DateTime, default=datetime.utcnow)


# 7. Power Assets
class PowerAsset(Base):
    __tablename__ = "power_assets"

    id = Column(Integer, primary_key=True, index=True)
    asset_code = Column(String(100), unique=True, nullable=False)
    asset_type = Column(String(80), nullable=False)  # transformer, substation, pole
    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="SET NULL"), nullable=True)
    capacity_kva = Column(Numeric(10, 2))
    vulnerability_score = Column(Numeric(5, 2), default=0.0)
    weather_exposure_level = Column(String(30), default="moderate")
    condition = Column(String(50), default="good")
    lat = Column(Numeric(10, 6))
    lng = Column(Numeric(10, 6))
    created_at = Column(DateTime, default=datetime.utcnow)


# 8. Complaints
class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(String(50), unique=True, nullable=False, index=True)
    category = Column(String(80), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    citizen_name = Column(String(150))
    citizen_phone = Column(String(50))
    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="SET NULL"), nullable=True)
    address = Column(Text)
    severity = Column(String(30), default="moderate")
    status = Column(String(40), default="open", index=True)
    department = Column(String(100))
    assigned_to = Column(String(150))
    image_url = Column(Text)
    ai_classification = Column(JSON, default=dict)
    lat = Column(Numeric(10, 6))
    lng = Column(Numeric(10, 6))
    submitted_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    ward = relationship("Ward", back_populates="complaints")


# 9. Weather
class Weather(Base):
    __tablename__ = "weather"

    id = Column(Integer, primary_key=True, index=True)
    recorded_at = Column(DateTime, default=datetime.utcnow, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="SET NULL"), nullable=True)
    temperature_celsius = Column(Numeric(5, 2))
    humidity_percent = Column(Numeric(5, 2))
    wind_speed_kmh = Column(Numeric(6, 2))
    wind_direction_deg = Column(Integer)
    atmospheric_pressure_hpa = Column(Numeric(7, 2))
    cyclone_risk_score = Column(Numeric(5, 2), default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)


# 10. Rainfall
class Rainfall(Base):
    __tablename__ = "rainfall"

    id = Column(Integer, primary_key=True, index=True)
    recorded_date = Column(Date, nullable=False, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="SET NULL"), nullable=True)
    rainfall_mm = Column(Numeric(8, 2), default=0.0)
    hourly_intensity_mm = Column(Numeric(6, 2))
    flood_inundation_risk = Column(Numeric(5, 2), default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)


# 11. Water Consumption
class WaterConsumption(Base):
    __tablename__ = "water_consumption"

    id = Column(Integer, primary_key=True, index=True)
    recorded_date = Column(Date, nullable=False, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="CASCADE"), nullable=False)
    supplied_mld = Column(Numeric(10, 2), nullable=False)
    consumed_mld = Column(Numeric(10, 2), nullable=False)
    deficit_mld = Column(Numeric(10, 2), default=0.0)
    stress_index = Column(Numeric(5, 2), default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)


# 12. Construction Records
class ConstructionRecord(Base):
    __tablename__ = "construction_records"

    id = Column(Integer, primary_key=True, index=True)
    record_code = Column(String(100), unique=True, nullable=False)
    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="SET NULL"), nullable=True)
    permit_number = Column(String(100), nullable=True)  # NULL if potential unauthorized activity
    status = Column(String(50), default="pending_verification")
    estimated_area_sqm = Column(Numeric(10, 2))
    detection_confidence = Column(Numeric(5, 2))
    satellite_detection_date = Column(DateTime, nullable=True)
    notes = Column(Text)
    lat = Column(Numeric(10, 6))
    lng = Column(Numeric(10, 6))
    created_at = Column(DateTime, default=datetime.utcnow)


# 13. Detections (YOLO11 Computer Vision)
class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    detection_code = Column(String(100), unique=True, nullable=False, index=True)
    model_name = Column(String(80), default="YOLO11")
    damage_type = Column(String(80), nullable=False)  # pothole, crack, surface_damage
    severity = Column(String(30), default="moderate")
    confidence = Column(Numeric(5, 2), nullable=False)
    bounding_box = Column(JSON, nullable=True)
    image_path = Column(Text, nullable=True)
    road_segment_id = Column(Integer, ForeignKey("road_segments.id", ondelete="SET NULL"), nullable=True)
    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="SET NULL"), nullable=True)
    verified_by_human = Column(Boolean, default=False)
    lat = Column(Numeric(10, 6))
    lng = Column(Numeric(10, 6))
    detected_at = Column(DateTime, default=datetime.utcnow)

    road_segment = relationship("RoadSegment", back_populates="detections")


# 14. Predictions
class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    model_type = Column(String(80), nullable=False)  # xgboost_water, lstm_water, xgboost_risk
    target_entity = Column(String(80), nullable=False)  # ward, road_segment, asset
    target_id = Column(Integer, nullable=False)
    prediction_horizon = Column(String(50))  # 24h, 7d, 30d
    predicted_value = Column(Numeric(10, 2), nullable=False)
    actual_value = Column(Numeric(10, 2), nullable=True)
    features_used = Column(JSON, nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow)


# 15. Risk Scores
class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="CASCADE"), nullable=False)
    overall_score = Column(Numeric(5, 2), nullable=False)
    risk_level = Column(String(30), nullable=False)
    road_damage_factor = Column(Numeric(5, 3), default=0.0)
    water_stress_factor = Column(Numeric(5, 3), default=0.0)
    flood_exposure_factor = Column(Numeric(5, 3), default=0.0)
    complaint_density_factor = Column(Numeric(5, 3), default=0.0)
    power_vulnerability_factor = Column(Numeric(5, 3), default=0.0)
    network_centrality_factor = Column(Numeric(5, 3), default=0.0)
    recommended_action = Column(Text)
    calculated_at = Column(DateTime, default=datetime.utcnow)

    ward = relationship("Ward", back_populates="risk_scores")


# 16. Maintenance Records
class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, index=True)
    maintenance_code = Column(String(100), unique=True, nullable=False)
    asset_type = Column(String(50), nullable=False)  # road, water, power, drainage
    asset_id = Column(Integer, nullable=False)
    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="SET NULL"), nullable=True)
    priority = Column(String(30), default="routine")  # routine, elevated, urgent, emergency
    status = Column(String(40), default="scheduled")  # scheduled, in_progress, completed
    cost_estimate_inr = Column(Numeric(12, 2))
    contractor_name = Column(String(150))
    scheduled_date = Column(Date)
    completed_date = Column(Date, nullable=True)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


# 17. Alerts
class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_code = Column(String(100), unique=True, nullable=False)
    alert_type = Column(String(40), nullable=False)  # critical, high, moderate, info
    category = Column(String(60), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True)
    acknowledged_by = Column(String(150), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# 18. OSM Roads (Imported from Geofabrik .osm.pbf)
class OSMRoad(Base):
    __tablename__ = "osm_roads"

    id = Column(Integer, primary_key=True, index=True)
    osm_id = Column(Integer, unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=True)
    highway = Column(String(50), nullable=False, index=True)  # primary, secondary, residential, etc.
    surface = Column(String(50), default="asphalt")
    lanes = Column(Integer, default=2)
    maxspeed = Column(Integer, nullable=True)
    oneway = Column(Boolean, default=False)
    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="SET NULL"), nullable=True)
    coordinates = Column(JSON, nullable=True)  # LineString coordinates [[lon, lat], ...]
    created_at = Column(DateTime, default=datetime.utcnow)


# 19. OSM Buildings (Imported from Geofabrik .osm.pbf)
class OSMBuilding(Base):
    __tablename__ = "osm_buildings"

    id = Column(Integer, primary_key=True, index=True)
    osm_id = Column(Integer, unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=True)
    building_type = Column(String(80), default="yes", index=True)  # civic, commercial, residential, school, etc.
    building_levels = Column(Integer, default=1)
    height = Column(Numeric(6, 2), nullable=True)
    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="SET NULL"), nullable=True)
    coordinates = Column(JSON, nullable=True)  # Polygon coordinates [[[lon, lat], ...]]
    created_at = Column(DateTime, default=datetime.utcnow)


# 20. OSM Land Use (Imported from Geofabrik .osm.pbf)
class OSMLanduse(Base):
    __tablename__ = "osm_landuse"

    id = Column(Integer, primary_key=True, index=True)
    osm_id = Column(Integer, unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=True)
    landuse_type = Column(String(80), nullable=False, index=True)  # commercial, residential, park, water, etc.
    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="SET NULL"), nullable=True)
    coordinates = Column(JSON, nullable=True)  # Polygon coordinates [[[lon, lat], ...]]
    created_at = Column(DateTime, default=datetime.utcnow)

