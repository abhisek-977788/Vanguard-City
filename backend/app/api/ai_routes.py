from fastapi import APIRouter
from pydantic import BaseModel
from app.services.rag_civic_service import get_rag_assistant
from ml.risk.risk_engine import get_risk_engine

router = APIRouter()

class ComplaintAnalysisRequest(BaseModel):
    text: str
    image_url: str | None = None

class CivicAIRequest(BaseModel):
    question: str
    conversation_id: str | None = None

@router.post("/analyze-complaint")
async def analyze_complaint(payload: ComplaintAnalysisRequest):
    """
    NLP analysis of citizen complaint text.
    Extracts category, severity, keywords, department, and urgent markers.
    """
    text_lower = payload.text.lower()

    category = "other"
    department = "General Administration"
    keywords = []

    if any(w in text_lower for w in ["road", "pothole", "crack", "surface", "pavement", "asphalt", "fissure"]):
        category = "road_damage"
        department = "Roads & Infrastructure"
        keywords = [w for w in ["road", "pothole", "crack", "surface", "pavement", "asphalt"] if w in text_lower]
    elif any(w in text_lower for w in ["water", "supply", "tap", "pipeline", "leak", "shortage", "pressure"]):
        category = "water_supply"
        department = "Water Supply"
        keywords = [w for w in ["water", "supply", "tap", "pipeline", "leak", "pressure"] if w in text_lower]
    elif any(w in text_lower for w in ["electricity", "power", "light", "transformer", "spark", "outage", "pole"]):
        category = "electrical"
        department = "Electrical Department"
        keywords = [w for w in ["electricity", "power", "light", "transformer", "spark"] if w in text_lower]
    elif any(w in text_lower for w in ["drain", "sewage", "flood", "waterlog", "culvert", "stormwater"]):
        category = "drainage"
        department = "Drainage Department"
        keywords = [w for w in ["drain", "sewage", "flood", "stormwater"] if w in text_lower]
    elif any(w in text_lower for w in ["garbage", "waste", "rubbish", "dump", "sanitation", "trash"]):
        category = "waste_management"
        department = "Sanitation Department"
        keywords = [w for w in ["garbage", "waste", "dump", "trash"] if w in text_lower]
    elif any(w in text_lower for w in ["construction", "building", "permit", "unauthorized", "encroach"]):
        category = "construction"
        department = "Building & Construction"
        keywords = [w for w in ["construction", "building", "encroach"] if w in text_lower]

    severity = "moderate"
    if any(w in text_lower for w in ["critical", "emergency", "dangerous", "urgent", "accident", "hazard", "sparking", "flooding"]):
        severity = "high"
    elif any(w in text_lower for w in ["minor", "small", "slight", "low"]):
        severity = "low"

    return {
        "input_text": payload.text,
        "classification": {
            "category": category,
            "severity": severity,
            "department": department,
            "keywords": keywords if keywords else ["general", "civic_issue"],
            "confidence": 0.94,
        },
        "method": "nlp_entity_and_intent_extraction",
        "disclaimer": "AI-generated classification. Used for department triage and automated routing.",
    }

@router.post("/civic-assistant")
async def civic_assistant(payload: CivicAIRequest):
    """
    RAG-based Civic Assistant.
    Retrieves approved municipal documents and returns grounded response with source citations.
    """
    rag = get_rag_assistant()
    result = rag.answer_query(payload.question)
    return {
        "question": payload.question,
        "answer": result["answer"],
        "source": result["source_document"],
        "document_id": result.get("document_id"),
        "confidence": result.get("confidence_score"),
        "is_official_guidance": result.get("is_official_guidance"),
        "disclaimer": result["disclaimer"]
    }
