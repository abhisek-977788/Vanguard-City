"""
Vanguard City — Geocoding API Routes (Nominatim OpenStreetMap)
Official public endpoint: https://nominatim.openstreetmap.org

Endpoints:
- GET /api/geocoding/search?q=...
- GET /api/geocoding/reverse?latitude=...&longitude=...

NOTE: Nominatim does NOT require an API key. No NOMINATIM_API_KEY is used.
All requests are routed through the backend to enforce rate limits, caching, and User-Agent policies.
"""

from fastapi import APIRouter, Query, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import httpx

from app.services.nominatim_service import get_nominatim_service

router = APIRouter()

class SearchResultItem(BaseModel):
    display_name: str
    latitude: float
    longitude: float
    type: str = "unknown"
    osm_id: str = ""
    osm_type: str = ""

class ReverseAddress(BaseModel):
    road: str = ""
    city: str = ""
    district: str = ""
    state: str = ""
    country: str = "India"

class ReverseResult(BaseModel):
    display_name: str
    latitude: float
    longitude: float
    address: ReverseAddress

@router.get("/search", response_model=List[SearchResultItem], summary="Forward Geocoding Search")
async def search_locations(
    q: str = Query(..., min_length=2, description="Location search query (e.g. 'Patia, Bhubaneswar')"),
    limit: int = Query(5, ge=1, le=20, description="Maximum number of search results to return")
):
    """
    Search for a location using OpenStreetMap Nominatim forward geocoding.
    Returns latitude, longitude, and OSM metadata.
    """
    service = get_nominatim_service()
    try:
        results = await service.search(query=q, limit=limit)
        return results
    except TimeoutError as e:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=str(e)
        )
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Nominatim rate limit reached. Please retry in a few seconds."
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Nominatim upstream error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Geocoding search failed: {str(e)}"
        )

@router.get("/reverse", response_model=ReverseResult, summary="Reverse Geocoding Coordinates")
async def reverse_geocode(
    latitude: float = Query(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees"),
    longitude: float = Query(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees")
):
    """
    Convert latitude and longitude coordinates into a structured postal address using Nominatim.
    Returns road, city, district, state, country, and display name.
    """
    service = get_nominatim_service()
    try:
        result = await service.reverse(latitude=latitude, longitude=longitude)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except TimeoutError as e:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=str(e)
        )
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Nominatim rate limit reached. Please retry in a few seconds."
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Nominatim upstream error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Reverse geocoding failed: {str(e)}"
        )
