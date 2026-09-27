from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def get_roads():
    return {"message": "Roads endpoint — Phase 4 DB integration pending", "total_length_km": 1247}


@router.get("/segments")
async def get_road_segments():
    return {"segments": [], "note": "Phase 4 — will return PostGIS road segment data"}
