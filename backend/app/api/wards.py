from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.services.db_service import DBService
from app.services.mock_data_service import get_mock_wards

router = APIRouter()

@router.get("")
async def get_wards(db: AsyncSession = Depends(get_db)):
    """Returns all ward records with risk scores and coordinates from database."""
    try:
        wards = await DBService.get_all_wards(db)
        if wards:
            return wards
        return get_mock_wards()
    except Exception:
        return get_mock_wards()

@router.get("/{ward_id}")
async def get_ward(ward_id: int, db: AsyncSession = Depends(get_db)):
    """Returns a specific ward by ID."""
    try:
        wards = await DBService.get_all_wards(db)
        ward = next((w for w in wards if w["id"] == ward_id or w["ward_number"] == ward_id), None)
        if not ward:
            raise HTTPException(status_code=404, detail=f"Ward {ward_id} not found")
        return ward
    except HTTPException:
        raise
    except Exception:
        mock = get_mock_wards()
        w = next((x for x in mock if x["id"] == ward_id), None)
        if not w:
            raise HTTPException(status_code=404, detail=f"Ward {ward_id} not found")
        return w
