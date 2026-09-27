"""
Vanguard City — GIS & OpenStreetMap / Geofabrik API Routes
Serves OpenStreetMap spatial layers (roads, buildings, landuse) imported from Geofabrik.
All responses follow standard GeoJSON format (RFC 7946) ready for Leaflet consumption.
"""

import os
import json
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any, Optional, List

from app.database.session import get_db
from app.models.models import OSMRoad, OSMBuilding, OSMLanduse

router = APIRouter()

PROCESSED_OSM_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/processed/osm"))

def _load_geojson_file(filename: str) -> Dict[str, Any]:
    path = os.path.join(PROCESSED_OSM_DIR, filename)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"type": "FeatureCollection", "features": []}

@router.get("/osm/stats")
async def get_osm_stats(db: AsyncSession = Depends(get_db)):
    """
    Returns summary metrics, bounding box, and provenance attribution
    for OpenStreetMap data imported via Geofabrik.
    """
    meta_path = os.path.join(PROCESSED_OSM_DIR, "import_metadata.json")
    if os.path.exists(meta_path):
        with open(meta_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)
    else:
        metadata = {
            "source": "https://download.geofabrik.de/",
            "region": "India / Eastern Zone",
            "counts": {"roads": 12, "buildings": 10, "landuse": 6},
            "attribution": "© OpenStreetMap contributors, Data provided by Geofabrik"
        }

    return {
        "status": "ready",
        "data_provider": "Geofabrik (https://download.geofabrik.de/)",
        "base_map": "OpenStreetMap",
        "attribution": "© OpenStreetMap contributors, Data provided by Geofabrik",
        "api_key_required": False,
        "note": "Free public extract without API key requirement",
        "metadata": metadata
    }

@router.get("/osm/roads")
async def get_osm_roads(
    highway: Optional[str] = Query(None, description="Filter by highway type (e.g. primary, secondary, residential)"),
    ward_id: Optional[int] = Query(None, description="Filter by ward ID"),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns GeoJSON FeatureCollection of roads extracted from Geofabrik .osm.pbf.
    Used for Leaflet road network layer overlay.
    """
    geojson = _load_geojson_file("osm_roads.geojson")
    features = geojson.get("features", [])

    if highway:
        features = [f for f in features if f.get("properties", {}).get("highway") == highway]
    if ward_id:
        features = [f for f in features if f.get("properties", {}).get("ward_id") == ward_id]

    return {
        "type": "FeatureCollection",
        "attribution": "© OpenStreetMap contributors, Data provided by Geofabrik",
        "total_count": len(features),
        "features": features
    }

@router.get("/osm/buildings")
async def get_osm_buildings(
    building_type: Optional[str] = Query(None, description="Filter by building category (commercial, residential, civic, hospital, school)"),
    ward_id: Optional[int] = Query(None, description="Filter by ward ID"),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns GeoJSON FeatureCollection of building footprints extracted from Geofabrik .osm.pbf.
    Used for 2D/3D building layer overlay in Leaflet.
    """
    geojson = _load_geojson_file("osm_buildings.geojson")
    features = geojson.get("features", [])

    if building_type:
        features = [f for f in features if f.get("properties", {}).get("building") == building_type]
    if ward_id:
        features = [f for f in features if f.get("properties", {}).get("ward_id") == ward_id]

    return {
        "type": "FeatureCollection",
        "attribution": "© OpenStreetMap contributors, Data provided by Geofabrik",
        "total_count": len(features),
        "features": features
    }

@router.get("/osm/landuse")
async def get_osm_landuse(
    landuse_type: Optional[str] = Query(None, description="Filter by land use type (commercial, residential, park, water, industrial)"),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns GeoJSON FeatureCollection of land use zoning and environmental features from Geofabrik .osm.pbf.
    """
    geojson = _load_geojson_file("osm_landuse.geojson")
    features = geojson.get("features", [])

    if landuse_type:
        features = [f for f in features if f.get("properties", {}).get("landuse") == landuse_type]

    return {
        "type": "FeatureCollection",
        "attribution": "© OpenStreetMap contributors, Data provided by Geofabrik",
        "total_count": len(features),
        "features": features
    }

@router.post("/osm/import")
async def trigger_geofabrik_import(
    region: str = Query("eastern-zone", description="Geofabrik extract region"),
    download_live: bool = Query(False, description="Whether to stream download from Geofabrik server")
):
    """
    Executes the repeatable Geofabrik .osm.pbf import workflow:
    Geofabrik .osm.pbf → OSM processing → PostGIS → FastAPI → Frontend
    """
    try:
        from gis.geofabrik_importer import run_import_workflow
        result = run_import_workflow(region=region, download=download_live)
        return {
            "status": "success",
            "message": "Geofabrik OpenStreetMap import workflow completed successfully",
            "imported_features": result,
            "attribution": "© OpenStreetMap contributors, Data provided by Geofabrik"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
