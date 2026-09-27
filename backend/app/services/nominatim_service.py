"""
Vanguard City — Nominatim Geocoding Service
Official public endpoint: https://nominatim.openstreetmap.org

CRITICAL REQUIREMENTS:
- Nominatim does NOT require an API key. Do NOT create NOMINATIM_API_KEY.
- Public policy compliance: identifying User-Agent, max 1 req/sec rate limiting, in-memory caching.
- Forward Geocoding (search location by query string).
- Reverse Geocoding (get address details by latitude & longitude).
"""

import os
import time
import asyncio
from typing import Dict, Any, List, Optional
import httpx

class NominatimService:
    def __init__(self):
        self.base_url = os.getenv("NOMINATIM_BASE_URL", "https://nominatim.openstreetmap.org").rstrip("/")
        self.user_agent = os.getenv("NOMINATIM_USER_AGENT", "Vanguard/1.0 (contact: admin@vanguardcity.gov)")
        
        # Policy enforcement: Max 1 request per second to public Nominatim
        self._lock = asyncio.Lock()
        self._last_request_time: float = 0.0
        self._min_interval: float = 1.0  # seconds

        # In-memory TTL cache (key -> (timestamp, data))
        self._cache: Dict[str, tuple[float, Any]] = {}
        self._cache_ttl: float = 3600.0  # 1 hour cache

    def _get_headers(self) -> Dict[str, str]:
        return {
            "User-Agent": self.user_agent,
            "Accept-Language": "en",
            "Accept": "application/json"
        }

    def _get_from_cache(self, cache_key: str) -> Optional[Any]:
        if cache_key in self._cache:
            ts, val = self._cache[cache_key]
            if time.time() - ts < self._cache_ttl:
                return val
            else:
                del self._cache[cache_key]
        return None

    def _save_to_cache(self, cache_key: str, val: Any):
        # Keep cache bounded to 1000 items
        if len(self._cache) > 1000:
            oldest_key = min(self._cache.keys(), key=lambda k: self._cache[k][0])
            del self._cache[oldest_key]
        self._cache[cache_key] = (time.time(), val)

    async def _rate_limit_throttle(self):
        """Ensures at least 1.0s gap between outbound calls to respect Nominatim usage policy."""
        async with self._lock:
            elapsed = time.time() - self._last_request_time
            if elapsed < self._min_interval:
                await asyncio.sleep(self._min_interval - elapsed)
            self._last_request_time = time.time()

    async def search(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Forward geocoding: search location text and return coordinates and metadata.
        """
        query = query.strip()
        if not query or len(query) < 2:
            return []

        cache_key = f"search:{query.lower()}:{limit}"
        cached = self._get_from_cache(cache_key)
        if cached is not None:
            return cached

        await self._rate_limit_throttle()

        url = f"{self.base_url}/search"
        params = {
            "q": query,
            "format": "jsonv2",
            "addressdetails": 1,
            "limit": limit
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params, headers=self._get_headers())

                if resp.status_code == 429:
                    raise httpx.HTTPStatusError("Nominatim rate limit reached. Please wait a moment.", request=resp.request, response=resp)
                if resp.status_code != 200:
                    raise httpx.HTTPStatusError(f"Nominatim returned HTTP {resp.status_code}", request=resp.request, response=resp)

                data = resp.json()
                results = []
                for item in data:
                    try:
                        results.append({
                            "display_name": item.get("display_name", ""),
                            "latitude": float(item.get("lat", 0.0)),
                            "longitude": float(item.get("lon", 0.0)),
                            "type": item.get("type", "unknown"),
                            "osm_id": str(item.get("osm_id", "")),
                            "osm_type": item.get("osm_type", ""),
                            "address": item.get("address", {})
                        })
                    except (ValueError, TypeError):
                        continue

                self._save_to_cache(cache_key, results)
                return results

        except httpx.TimeoutException:
            raise TimeoutError("Nominatim search request timed out.")
        except httpx.HTTPStatusError:
            raise
        except Exception as e:
            raise RuntimeError(f"Nominatim search error: {str(e)}")

    async def reverse(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Reverse geocoding: resolve latitude and longitude to street address and municipal hierarchy.
        """
        # Coordinate validation
        if not (-90.0 <= latitude <= 90.0) or not (-180.0 <= longitude <= 180.0):
            raise ValueError(f"Invalid coordinates: lat={latitude}, lng={longitude}")

        # Round to 5 decimal places for caching (~1.1 meter precision)
        rounded_lat = round(latitude, 5)
        rounded_lon = round(longitude, 5)
        cache_key = f"rev:{rounded_lat}:{rounded_lon}"

        cached = self._get_from_cache(cache_key)
        if cached is not None:
            return cached

        await self._rate_limit_throttle()

        url = f"{self.base_url}/reverse"
        params = {
            "lat": rounded_lat,
            "lon": rounded_lon,
            "format": "jsonv2",
            "addressdetails": 1
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params, headers=self._get_headers())

                if resp.status_code == 429:
                    raise httpx.HTTPStatusError("Nominatim rate limit reached. Please wait a moment.", request=resp.request, response=resp)
                if resp.status_code != 200:
                    raise httpx.HTTPStatusError(f"Nominatim returned HTTP {resp.status_code}", request=resp.request, response=resp)

                data = resp.json()
                addr = data.get("address", {})

                # Extract standardized address fields
                road = (
                    addr.get("road") or 
                    addr.get("pedestrian") or 
                    addr.get("path") or 
                    addr.get("footway") or 
                    addr.get("suburb") or 
                    ""
                )
                city = (
                    addr.get("city") or 
                    addr.get("town") or 
                    addr.get("village") or 
                    addr.get("municipality") or 
                    addr.get("county") or 
                    ""
                )
                district = addr.get("state_district") or addr.get("county") or ""
                state = addr.get("state") or ""
                country = addr.get("country") or "India"

                result = {
                    "display_name": data.get("display_name", f"Location at ({latitude}, {longitude})"),
                    "latitude": float(latitude),
                    "longitude": float(longitude),
                    "address": {
                        "road": road,
                        "city": city,
                        "district": district,
                        "state": state,
                        "country": country
                    }
                }

                self._save_to_cache(cache_key, result)
                return result

        except httpx.TimeoutException:
            raise TimeoutError("Nominatim reverse geocoding timed out.")
        except httpx.HTTPStatusError:
            raise
        except Exception as e:
            raise RuntimeError(f"Nominatim reverse geocoding error: {str(e)}")

# Global singleton
_nominatim_service: Optional[NominatimService] = None

def get_nominatim_service() -> NominatimService:
    global _nominatim_service
    if _nominatim_service is None:
        _nominatim_service = NominatimService()
    return _nominatim_service
