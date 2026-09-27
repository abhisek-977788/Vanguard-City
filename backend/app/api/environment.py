"""
Vanguard City — Environmental & Earth Observation API Router
Exposes live telemetry and analytics from:
  1. Copernicus / Sentinel Hub (Sentinel-2 satellite imagery, change detection, reservoir NDWI)
  2. OpenAQ (Ambient particulate matter & AQI)
  3. OpenWeather (Meteorological conditions, rainfall & storm risk)
"""

from fastapi import APIRouter
from app.services.sentinel_service import get_sentinel_service
from app.services.openaq_service import get_openaq_service
from app.services.weather_service import get_weather_service

router = APIRouter()

@router.get("/weather")
async def get_weather():
    """
    Returns real-time meteorological conditions from Open-Meteo & OpenWeather.
    Used for water demand forecasting, rainfall tracking, and power storm exposure.
    """
    svc = get_weather_service()
    return svc.get_current_weather()

@router.get("/weather/forecast")
async def get_weather_forecast(days: int = 7):
    """
    Returns 7-day multi-day weather forecast from Open-Meteo.
    """
    svc = get_weather_service()
    return svc.get_forecast(days=days)

@router.get("/air-quality")
async def get_air_quality():
    """
    Returns ambient air quality metrics and Indian National AQI from OpenAQ v3 API.
    """
    svc = get_openaq_service()
    return svc.get_air_quality_summary()

@router.get("/satellite/scenes")
async def get_satellite_scenes(days_back: int = 14):
    """
    Returns recent Sentinel-2 L2A optical acquisitions over the municipal area from Copernicus Data Space.
    """
    svc = get_sentinel_service()
    return svc.search_recent_acquisitions(days_back=days_back)

@router.get("/satellite/construction-changes")
async def get_satellite_construction_changes():
    """
    Returns optical surface change detections from Sentinel-2 MSI multi-spectral passes.
    Flags potential unauthorized construction for field officer verification.
    """
    svc = get_sentinel_service()
    return {
        "provider": "Copernicus Sentinel-2 Optical Change Detection",
        "detections": svc.detect_surface_changes(),
        "disclaimer": "AI/Satellite detection indicates Potential Unauthorized Activity only. Requires human verification before statutory enforcement."
    }

@router.get("/satellite/reservoirs")
async def get_satellite_reservoirs():
    """
    Returns NDWI surface water extent analysis for municipal reservoirs from Sentinel-2.
    """
    svc = get_sentinel_service()
    return svc.monitor_reservoir_capacity()
