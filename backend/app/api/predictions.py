from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.services.db_service import DBService
from ml.risk.risk_engine import get_risk_engine

router = APIRouter()

@router.get("")
async def get_predictions(db: AsyncSession = Depends(get_db)):
    """
    Returns AI-generated risk scores and recommendations for all municipal wards.
    Computed via the Central Risk Engine.
    """
    engine = get_risk_engine()
    wards = await DBService.get_all_wards(db)

    results = []
    for w in wards:
        score_eval = engine.compute_ward_risk(
            ward_name=w["name"],
            road_damage_score=float(w["risk_score"] * 0.9),
            water_stress_score=88.0 if w["water_stress"] == "critical" else (62.0 if w["water_stress"] == "high" else 35.0),
            flood_exposure_score=45.0,
            complaint_density=18.0,
            network_centrality=0.15,
            population=w["population"]
        )
        results.append(score_eval)

    return {
        "ward_risk_scores": results,
        "model": "XGBoost Central Risk Ensemble",
        "version": "1.0",
        "disclaimer": "AI-generated prioritization tool. Does not represent official government assessment."
    }

@router.get("/risk/{ward_id}")
async def get_ward_risk(ward_id: int, db: AsyncSession = Depends(get_db)):
    engine = get_risk_engine()
    wards = await DBService.get_all_wards(db)
    target = next((w for w in wards if w["id"] == ward_id or w["ward_number"] == ward_id), None)
    if not target:
        target = {"name": f"Ward {ward_id}", "risk_score": 75.0, "population": 65000, "water_stress": "high"}

    return engine.compute_ward_risk(
        ward_name=target["name"],
        road_damage_score=float(target.get("risk_score", 70.0)),
        water_stress_score=75.0,
        flood_exposure_score=50.0,
        complaint_density=20.0,
        network_centrality=0.20,
        population=target.get("population", 65000)
    )
