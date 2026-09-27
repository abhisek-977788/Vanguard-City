# Vanguard City — OpenStreetMap & Geofabrik Integration Guide

> **Spatial Data Pipeline & PostGIS Ingestion Runbook**  
> *Data Source: Geofabrik (`https://download.geofabrik.de/`) | Base Map: OpenStreetMap*

---

## 1. Architectural Principles

1. **OpenStreetMap Base Layer**:
   - Leaflet.js renders standard OpenStreetMap tiles (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`).
   - Mandatory attribution displayed: `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors`.
   - **Zero API Key Requirement**: No OSM API key is created, configured, or requested for tile rendering.

2. **Geofabrik as Data Extract Provider**:
   - Geofabrik (`https://download.geofabrik.de/`) provides pre-packaged, daily OSM `.osm.pbf` extracts for regions and countries.
   - **Zero API Key Requirement**: Geofabrik extracts are public and require no `GEOFABRIK_API_KEY`.
   - **Local Caching & Repeatability**: Raw `.osm.pbf` files are cached in `data/raw/osm/`. The application never downloads heavy files automatically on startup.

---

## 2. End-to-End Data Workflow

```
 Geofabrik Server (download.geofabrik.de)
                 ↓  (Manual or on-demand curl/python download)
   Cached Extract: data/raw/osm/eastern-zone-latest.osm.pbf
                 ↓
      gis/geofabrik_importer.py  (Spatial Bounding Box Filter)
                 ↓
    Processed GeoJSON: data/processed/osm/
      - osm_roads.geojson
      - osm_buildings.geojson
      - osm_landuse.geojson
                 ↓
   PostgreSQL 15 + PostGIS Tables
      - osm_roads (LineString + GiST index)
      - osm_buildings (Polygon + GiST index)
      - osm_landuse (Polygon + GiST index)
                 ↓
   FastAPI Endpoints (/api/gis/osm/*)
                 ↓
   Vanguard City Frontend (Leaflet.js Map)
```

---

## 3. PostGIS Spatial Schema

The following tables store the imported OpenStreetMap features:

```sql
-- 1. OSM Roads
CREATE TABLE IF NOT EXISTS osm_roads (
    id SERIAL PRIMARY KEY,
    osm_id BIGINT UNIQUE NOT NULL,
    name VARCHAR(255),
    highway VARCHAR(50) NOT NULL, -- motorway, trunk, primary, secondary, residential, service
    surface VARCHAR(50) DEFAULT 'asphalt',
    lanes INT DEFAULT 2,
    maxspeed INT,
    oneway BOOLEAN DEFAULT FALSE,
    ward_id INT REFERENCES wards(id) ON DELETE SET NULL,
    geometry GEOMETRY(LineString, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_osm_roads_geom ON osm_roads USING GIST(geometry);

-- 2. OSM Buildings
CREATE TABLE IF NOT EXISTS osm_buildings (
    id SERIAL PRIMARY KEY,
    osm_id BIGINT UNIQUE NOT NULL,
    name VARCHAR(255),
    building_type VARCHAR(80) DEFAULT 'yes',
    building_levels INT DEFAULT 1,
    height NUMERIC(6, 2),
    ward_id INT REFERENCES wards(id) ON DELETE SET NULL,
    geometry GEOMETRY(Polygon, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_osm_buildings_geom ON osm_buildings USING GIST(geometry);

-- 3. OSM Land Use
CREATE TABLE IF NOT EXISTS osm_landuse (
    id SERIAL PRIMARY KEY,
    osm_id BIGINT UNIQUE NOT NULL,
    name VARCHAR(255),
    landuse_type VARCHAR(80) NOT NULL, -- commercial, residential, park, water, industrial
    ward_id INT REFERENCES wards(id) ON DELETE SET NULL,
    geometry GEOMETRY(Polygon, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_osm_landuse_geom ON osm_landuse USING GIST(geometry);
```

---

## 4. How to Execute the Repeatable Import Workflow

### Option A: Standard Offline / Quick Verification (Recommended for Development)
Generates high-fidelity municipal extract directly into `data/processed/osm/`:
```powershell
cd d:\Abhisek\Vangaurd\vanguard-city
.\backend\venv\Scripts\python.exe gis\geofabrik_importer.py
```

### Option B: Download Live Extract from Geofabrik
Streams the latest regional `.osm.pbf` extract from Geofabrik:
```powershell
cd d:\Abhisek\Vangaurd\vanguard-city
.\backend\venv\Scripts\python.exe gis\geofabrik_importer.py --region eastern-zone --download
```
*Note: Available regions include `india`, `eastern-zone`, `southern-zone`, `western-zone`, `northern-zone`.*

### Option C: Manual Download via Browser / cURL
1. Visit [https://download.geofabrik.de/asia/india.html](https://download.geofabrik.de/asia/india.html).
2. Download the `.osm.pbf` file for your target region (e.g. `eastern-zone-latest.osm.pbf`).
3. Place the downloaded file into `data/raw/osm/`.
4. Run the importer:
   ```powershell
   .\backend\venv\Scripts\python.exe gis\geofabrik_importer.py
   ```

---

## 5. FastAPI Endpoints Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/gis/osm/stats` | `GET` | Provenance metadata, feature counts, and OSM attribution |
| `/api/gis/osm/roads` | `GET` | GeoJSON FeatureCollection of roads (filters: `highway`, `ward_id`) |
| `/api/gis/osm/buildings` | `GET` | GeoJSON FeatureCollection of buildings (filters: `building_type`) |
| `/api/gis/osm/landuse` | `GET` | GeoJSON FeatureCollection of zoning & land use |
| `/api/gis/osm/import` | `POST` | Triggers repeatable import workflow |

---

## 6. Leaflet.js Frontend Features

- **Base Layer**: Standard OpenStreetMap tiles loaded over HTTPS with zero API tokens.
- **Dark Theme Toggle**: Switch seamlessly between standard OSM and Carto Dark OSM tiles.
- **OSM Vector Overlays**:
  - 🟡 **OSM Roads**: Color-coded by hierarchy (Primary Gold, Trunk Amber, Secondary Sky Blue, Residential Slate) with popup showing lanes, speed limits, and highway types.
  - 🟣 **OSM Buildings**: Footprints color-coded by use (Civic Indigo, Hospital Red, Commercial Violet) with levels and height.
  - 🟢 **OSM Land Use**: Zoned polygons for commercial districts, parks, reservoirs, and industrial zones.
