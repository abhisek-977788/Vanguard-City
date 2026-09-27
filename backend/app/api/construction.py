from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def get_construction_activity():
    return {
        "detections": [
            {
                "id": f"CON-{i:03d}",
                "status": ["pending_verification", "under_review", "verified_authorized"][i % 3],
                "location": f"Ward {i * 2}, Plot {i * 10}",
                "confidence": round(0.72 + i * 0.03, 2),
                "area_sqm": i * 80 + 120,
                "detected_at": "2024-01-14",
                "notes": "Potential activity detected. Human verification required.",
                "disclaimer": "NOT a confirmed violation. AI detection only.",
            }
            for i in range(1, 6)
        ],
        "important_disclaimer": (
            "All construction detections indicate POTENTIAL UNAUTHORIZED ACTIVITY only. "
            "These are not confirmed violations. Require human verification before any enforcement action."
        ),
    }
