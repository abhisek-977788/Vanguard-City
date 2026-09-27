from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def get_infrastructure():
    return {
        "summary": {
            "total_road_length_km": 1247,
            "damaged_segments": 89,
            "critical_segments": 23,
            "assets_requiring_maintenance": 156,
            "infrastructure_health_percent": 64,
        },
        "note": "Phase 4 — will return PostGIS infrastructure data",
    }
