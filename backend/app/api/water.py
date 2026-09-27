from fastapi import APIRouter
from ml.water.water_predictor import WaterPredictionEngine
from app.services.mock_data_service import get_mock_water_data

router = APIRouter()
_water_engine = WaterPredictionEngine()

@router.get("")
async def get_water_intelligence():
    """
    Returns AI-predicted water demand vs available supply and ward deficit metrics.
    """
    stress_calc = _water_engine.calculate_water_stress(predicted_demand=342.0, available_supply=285.0)
    mock = get_mock_water_data()
    return {
        "summary": {
            "total_supply_mld": stress_calc["available_supply_mld"],
            "predicted_demand_mld": stress_calc["predicted_demand_mld"],
            "deficit_mld": stress_calc["deficit_mld"],
            "deficit_percent": stress_calc["deficit_percent"],
            "water_stress_score": stress_calc["water_stress_score"],
            "stress_level": stress_calc["stress_level"],
            "high_stress_wards": 4,
            "critical_wards": 2,
        },
        "ward_water_status": mock["ward_water_status"],
        "recommended_action": stress_calc["recommended_action"],
        "thresholds": stress_calc["thresholds_used"],
        "model": "XGBoost Regressor (Water Demand)",
        "disclaimer": "AI-predicted estimates. Not official municipal supply statements."
    }

@router.get("/risk")
async def get_water_risk():
    data = await get_water_intelligence()
    wards = sorted(data["ward_water_status"], key=lambda x: x["stress_score"], reverse=True)
    return {
        "high_stress_wards": [w for w in wards if w["stress_score"] > 75],
        "moderate_stress_wards": [w for w in wards if 50 < w["stress_score"] <= 75],
        "low_stress_wards": [w for w in wards if w["stress_score"] <= 50],
        "model": "XGBoost Water Engine"
    }
