"""
Vanguard City — Nominatim Geocoding Service Export
Delegates to app.services.nominatim_service
"""
from app.services.nominatim_service import NominatimService, get_nominatim_service

__all__ = ["NominatimService", "get_nominatim_service"]
