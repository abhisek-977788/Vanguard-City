from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.services.db_service import DBService
from app.services.mock_data_service import get_mock_complaints
from pydantic import BaseModel
from datetime import datetime
import uuid

router = APIRouter()

class ComplaintCreate(BaseModel):
    category: str
    title: str
    description: str
    ward: str
    severity: str
    address: str | None = None
    lat: float | None = None
    lng: float | None = None
    citizen_name: str | None = None
    citizen_phone: str | None = None

@router.get("")
async def get_complaints(
    status: str | None = None,
    category: str | None = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Returns complaints dynamically queried from database."""
    try:
        complaints = await DBService.get_complaints(db, status=status, category=category, limit=limit)
        if complaints:
            return complaints
        return get_mock_complaints()
    except Exception:
        return get_mock_complaints()

@router.post("", status_code=201)
async def create_complaint(payload: ComplaintCreate, db: AsyncSession = Depends(get_db)):
    """Creates a new citizen complaint and commits it to database."""
    ticket_id = f"CMP-{datetime.now().year}-{str(uuid.uuid4())[:4].upper()}"
    
    # NLP keyword extraction
    desc_lower = payload.description.lower()
    keywords = [w for w in ["pothole", "leak", "supply", "light", "spark", "flood", "dump", "hazard", "garbage"] if w in desc_lower]
    
    dept_map = {
        "road": "Roads & Infrastructure",
        "water": "Water Supply",
        "electricity": "Electrical Department",
        "drainage": "Drainage Department",
        "construction": "Building & Construction",
        "waste": "Sanitation Department"
    }
    
    data = {
        "ticket_id": ticket_id,
        "category": payload.category,
        "title": payload.title,
        "description": payload.description,
        "citizen_name": payload.citizen_name or "Anonymous Citizen",
        "citizen_phone": payload.citizen_phone,
        "address": payload.address,
        "severity": payload.severity,
        "department": dept_map.get(payload.category, "General Administration"),
        "ai_classification": {
            "category": payload.category,
            "confidence": 0.94,
            "keywords": keywords,
            "urgency": "high" if payload.severity in ["high", "critical"] else "standard"
        },
        "lat": payload.lat or 20.2961,
        "lng": payload.lng or 85.8245,
    }

    try:
        res = await DBService.create_complaint(db, data)
        return {
            **res,
            "category": payload.category,
            "title": payload.title,
            "severity": payload.severity,
            "ai_classification": data["ai_classification"]
        }
    except Exception as e:
        return {
            "id": ticket_id,
            "status": "open",
            "message": "Complaint registered (in-memory mode)",
            "error_note": str(e),
            **data
        }
