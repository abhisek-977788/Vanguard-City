from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.services.db_service import DBService
from app.services.mock_data_service import get_mock_dashboard_summary

router = APIRouter()

@router.get("/summary")
async def get_dashboard_summary(db: AsyncSession = Depends(get_db)):
    """Returns dynamic KPI summary queried directly from the database."""
    try:
        return await DBService.get_dashboard_summary(db)
    except Exception as e:
        # Fallback if DB session encountered unexpected state
        fallback = get_mock_dashboard_summary()
        fallback["error_fallback"] = str(e)
        return fallback
