-- =============================================================================
-- VANGUARD CITY — MUNICIPAL DIGITAL TWIN DATABASE SCHEMA
-- Extensions: PostGIS for spatial queries, geometries and coordinates
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(150),
    role VARCHAR(50) DEFAULT 'citizen', -- 'citizen', 'authority_admin', 'field_officer', 'analyst'
    department VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. WARDS TABLE
CREATE TABLE IF NOT EXISTS wards (
    id SERIAL PRIMARY KEY,
    ward_number INT UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    zone VARCHAR(100),
    population INT DEFAULT 0,
    area_sq_km NUMERIC(8, 2),
    boundary GEOMETRY(Polygon, 4326),
    centroid GEOMETRY(Point, 4326),
    base_risk_score NUMERIC(5, 2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. ROADS TABLE
CREATE TABLE IF NOT EXISTS roads (
    id SERIAL PRIMARY KEY,
    osm_id BIGINT,
    name VARCHAR(255),
    road_type VARCHAR(50), -- 'primary', 'secondary', 'tertiary', 'residential'
    ward_id INT REFERENCES wards(id) ON DELETE SET NULL,
    total_length_meters NUMERIC(10, 2),
    surface_type VARCHAR(50) DEFAULT 'asphalt',
    lane_count INT DEFAULT 2,
    geometry GEOMETRY(LineString, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. ROAD SEGMENTS TABLE
CREATE TABLE IF NOT EXISTS road_segments (
    id SERIAL PRIMARY KEY,
    road_id INT REFERENCES roads(id) ON DELETE CASCADE,
    ward_id INT REFERENCES wards(id) ON DELETE SET NULL,
    segment_code VARCHAR(100) UNIQUE,
    condition_rating VARCHAR(30) DEFAULT 'good', -- 'good', 'fair', 'poor', 'critical'
    damage_score NUMERIC(5, 2) DEFAULT 0.0,
    last_inspected TIMESTAMP WITH TIME ZONE,
    start_point GEOMETRY(Point, 4326),
    end_point GEOMETRY(Point, 4326),
    geometry GEOMETRY(LineString, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. INFRASTRUCTURE ASSETS TABLE
CREATE TABLE IF NOT EXISTS infrastructure_assets (
    id SERIAL PRIMARY KEY,
    asset_code VARCHAR(100) UNIQUE NOT NULL,
    asset_type VARCHAR(80) NOT NULL, -- 'bridge', 'culvert', 'flyover', 'storm_drain', 'public_building'
    ward_id INT REFERENCES wards(id) ON DELETE SET NULL,
    installation_year INT,
    health_index NUMERIC(5, 2) DEFAULT 100.0, -- 0 to 100
    status VARCHAR(50) DEFAULT 'operational', -- 'operational', 'needs_maintenance', 'critical', 'decommissioned'
    location GEOMETRY(Point, 4326),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. WATER ASSETS TABLE
CREATE TABLE IF NOT EXISTS water_assets (
    id SERIAL PRIMARY KEY,
    asset_code VARCHAR(100) UNIQUE NOT NULL,
    asset_type VARCHAR(80) NOT NULL, -- 'treatment_plant', 'reservoir', 'pipeline', 'pump_station', 'borewell'
    ward_id INT REFERENCES wards(id) ON DELETE SET NULL,
    capacity_mld NUMERIC(10, 2) DEFAULT 0.0,
    current_flow_mld NUMERIC(10, 2) DEFAULT 0.0,
    pressure_bar NUMERIC(6, 2),
    operational_status VARCHAR(50) DEFAULT 'active',
    location GEOMETRY(Point, 4326),
    geometry GEOMETRY(Geometry, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. POWER ASSETS TABLE
CREATE TABLE IF NOT EXISTS power_assets (
    id SERIAL PRIMARY KEY,
    asset_code VARCHAR(100) UNIQUE NOT NULL,
    asset_type VARCHAR(80) NOT NULL, -- 'transformer', 'substation', 'high_voltage_line', 'pole', 'feeder'
    ward_id INT REFERENCES wards(id) ON DELETE SET NULL,
    capacity_kva NUMERIC(10, 2),
    vulnerability_score NUMERIC(5, 2) DEFAULT 0.0, -- 0 to 100
    weather_exposure_level VARCHAR(30) DEFAULT 'moderate', -- 'low', 'moderate', 'high', 'critical'
    condition VARCHAR(50) DEFAULT 'good',
    location GEOMETRY(Point, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. COMPLAINTS TABLE
CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    ticket_id VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(80) NOT NULL, -- 'road', 'water', 'electricity', 'drainage', 'construction', 'waste', 'other'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    citizen_name VARCHAR(150),
    citizen_phone VARCHAR(50),
    ward_id INT REFERENCES wards(id) ON DELETE SET NULL,
    address TEXT,
    severity VARCHAR(30) DEFAULT 'moderate', -- 'low', 'moderate', 'high', 'critical'
    status VARCHAR(40) DEFAULT 'open', -- 'open', 'under_review', 'in_progress', 'resolved'
    department VARCHAR(100),
    assigned_to VARCHAR(150),
    image_url TEXT,
    ai_classification JSONB DEFAULT '{}'::jsonb, -- {category, confidence, keywords, urgency}
    location GEOMETRY(Point, 4326),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 9. WEATHER TABLE
CREATE TABLE IF NOT EXISTS weather (
    id SERIAL PRIMARY KEY,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ward_id INT REFERENCES wards(id) ON DELETE SET NULL,
    temperature_celsius NUMERIC(5, 2),
    humidity_percent NUMERIC(5, 2),
    wind_speed_kmh NUMERIC(6, 2),
    wind_direction_deg INT,
    atmospheric_pressure_hpa NUMERIC(7, 2),
    cyclone_risk_score NUMERIC(5, 2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. RAINFALL TABLE
CREATE TABLE IF NOT EXISTS rainfall (
    id SERIAL PRIMARY KEY,
    recorded_date DATE NOT NULL,
    ward_id INT REFERENCES wards(id) ON DELETE SET NULL,
    rainfall_mm NUMERIC(8, 2) DEFAULT 0.0,
    hourly_intensity_mm NUMERIC(6, 2),
    flood_inundation_risk NUMERIC(5, 2) DEFAULT 0.0, -- 0 to 100
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. WATER CONSUMPTION TABLE
CREATE TABLE IF NOT EXISTS water_consumption (
    id SERIAL PRIMARY KEY,
    recorded_date DATE NOT NULL,
    ward_id INT REFERENCES wards(id) ON DELETE CASCADE,
    supplied_mld NUMERIC(10, 2) NOT NULL,
    consumed_mld NUMERIC(10, 2) NOT NULL,
    deficit_mld NUMERIC(10, 2) GENERATED ALWAYS AS (consumed_mld - supplied_mld) STORED,
    stress_index NUMERIC(5, 2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. CONSTRUCTION RECORDS TABLE
CREATE TABLE IF NOT EXISTS construction_records (
    id SERIAL PRIMARY KEY,
    record_code VARCHAR(100) UNIQUE NOT NULL,
    ward_id INT REFERENCES wards(id) ON DELETE SET NULL,
    permit_number VARCHAR(100), -- NULL if potential unauthorized activity
    status VARCHAR(50) DEFAULT 'pending_verification', -- 'pending_verification', 'under_review', 'verified_authorized', 'flagged_for_inspection'
    estimated_area_sqm NUMERIC(10, 2),
    detection_confidence NUMERIC(5, 2),
    satellite_detection_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    location GEOMETRY(Point, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. DETECTIONS (COMPUTER VISION) TABLE
CREATE TABLE IF NOT EXISTS detections (
    id SERIAL PRIMARY KEY,
    detection_code VARCHAR(100) UNIQUE NOT NULL,
    model_name VARCHAR(80) DEFAULT 'YOLO11',
    damage_type VARCHAR(80) NOT NULL, -- 'pothole', 'longitudinal_crack', 'alligator_crack', 'surface_deformation'
    severity VARCHAR(30) DEFAULT 'moderate', -- 'low', 'moderate', 'high', 'critical'
    confidence NUMERIC(5, 2) NOT NULL,
    bounding_box JSONB, -- {x, y, width, height}
    image_path TEXT,
    road_segment_id INT REFERENCES road_segments(id) ON DELETE SET NULL,
    ward_id INT REFERENCES wards(id) ON DELETE SET NULL,
    verified_by_human BOOLEAN DEFAULT FALSE,
    location GEOMETRY(Point, 4326),
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. PREDICTIONS TABLE
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    model_type VARCHAR(80) NOT NULL, -- 'xgboost_water', 'lstm_water', 'xgboost_risk', 'networkx_cascade'
    target_entity VARCHAR(80) NOT NULL, -- 'ward', 'road_segment', 'power_node'
    target_id INT NOT NULL,
    prediction_horizon VARCHAR(50), -- '24h', '7d', '30d'
    predicted_value NUMERIC(10, 2) NOT NULL,
    actual_value NUMERIC(10, 2),
    features_used JSONB,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. RISK SCORES TABLE
CREATE TABLE IF NOT EXISTS risk_scores (
    id SERIAL PRIMARY KEY,
    ward_id INT REFERENCES wards(id) ON DELETE CASCADE,
    overall_score NUMERIC(5, 2) NOT NULL, -- 0 to 100
    risk_level VARCHAR(30) NOT NULL, -- 'Low', 'Moderate', 'High', 'Critical'
    road_damage_factor NUMERIC(5, 3) DEFAULT 0.0,
    water_stress_factor NUMERIC(5, 3) DEFAULT 0.0,
    flood_exposure_factor NUMERIC(5, 3) DEFAULT 0.0,
    complaint_density_factor NUMERIC(5, 3) DEFAULT 0.0,
    power_vulnerability_factor NUMERIC(5, 3) DEFAULT 0.0,
    network_centrality_factor NUMERIC(5, 3) DEFAULT 0.0,
    recommended_action TEXT,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. MAINTENANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS maintenance_records (
    id SERIAL PRIMARY KEY,
    maintenance_code VARCHAR(100) UNIQUE NOT NULL,
    asset_type VARCHAR(50) NOT NULL, -- 'road', 'water', 'power', 'drainage'
    asset_id INT NOT NULL,
    ward_id INT REFERENCES wards(id) ON DELETE SET NULL,
    priority VARCHAR(30) DEFAULT 'routine', -- 'routine', 'elevated', 'urgent', 'emergency'
    status VARCHAR(40) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'verified'
    cost_estimate_inr NUMERIC(12, 2),
    contractor_name VARCHAR(150),
    scheduled_date DATE,
    completed_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. ALERTS TABLE
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    alert_code VARCHAR(100) UNIQUE NOT NULL,
    alert_type VARCHAR(40) NOT NULL, -- 'critical', 'high', 'moderate', 'info'
    category VARCHAR(60) NOT NULL, -- 'water_stress', 'road_damage', 'storm_power', 'unauthorized_construction', 'complaints_surge'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    ward_id INT REFERENCES wards(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    acknowledged_by VARCHAR(150),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SPATIAL INDEXES FOR MAXIMUM GIS PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_wards_boundary ON wards USING GIST(boundary);
CREATE INDEX IF NOT EXISTS idx_wards_centroid ON wards USING GIST(centroid);
CREATE INDEX IF NOT EXISTS idx_roads_geometry ON roads USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_road_segments_geom ON road_segments USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_infra_location ON infrastructure_assets USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_water_location ON water_assets USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_power_location ON power_assets USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_complaints_location ON complaints USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_detections_location ON detections USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_construction_location ON construction_records USING GIST(location);

-- =============================================================================
-- 18. OPENSTREETMAP / GEOFABRIK IMPORTED SPATIAL LAYERS
-- =============================================================================

-- OSM ROADS (Extracted from Geofabrik .osm.pbf)
CREATE TABLE IF NOT EXISTS osm_roads (
    id SERIAL PRIMARY KEY,
    osm_id BIGINT UNIQUE NOT NULL,
    name VARCHAR(255),
    highway VARCHAR(50) NOT NULL, -- motorway, trunk, primary, secondary, tertiary, residential, service
    surface VARCHAR(50) DEFAULT 'asphalt',
    lanes INT DEFAULT 2,
    maxspeed INT,
    oneway BOOLEAN DEFAULT FALSE,
    ward_id INT REFERENCES wards(id) ON DELETE SET NULL,
    geometry GEOMETRY(LineString, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_osm_roads_geom ON osm_roads USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_osm_roads_highway ON osm_roads(highway);

-- OSM BUILDINGS (Building footprints from Geofabrik .osm.pbf)
CREATE TABLE IF NOT EXISTS osm_buildings (
    id SERIAL PRIMARY KEY,
    osm_id BIGINT UNIQUE NOT NULL,
    name VARCHAR(255),
    building_type VARCHAR(80) DEFAULT 'yes', -- civic, commercial, residential, apartments, school, hospital
    building_levels INT DEFAULT 1,
    height NUMERIC(6, 2),
    ward_id INT REFERENCES wards(id) ON DELETE SET NULL,
    geometry GEOMETRY(Polygon, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_osm_buildings_geom ON osm_buildings USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_osm_buildings_type ON osm_buildings(building_type);

-- OSM LAND USE (Zoning & natural boundaries from Geofabrik .osm.pbf)
CREATE TABLE IF NOT EXISTS osm_landuse (
    id SERIAL PRIMARY KEY,
    osm_id BIGINT UNIQUE NOT NULL,
    name VARCHAR(255),
    landuse_type VARCHAR(80) NOT NULL, -- commercial, residential, industrial, park, water, education
    ward_id INT REFERENCES wards(id) ON DELETE SET NULL,
    geometry GEOMETRY(Polygon, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_osm_landuse_geom ON osm_landuse USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_osm_landuse_type ON osm_landuse(landuse_type);

