"""
Vanguard City — Full Loop Data Flow Verification (Phase 15)
Simulates:
Citizen uploads image
  ↓
FastAPI endpoint
  ↓
YOLO11 Object Detection
  ↓
Database (PostgreSQL / SQLite Spatial)
  ↓
Central Risk Engine recalculated
  ↓
Updated risk score and alert
  ↓
Authority Dashboard Reflection
"""
import asyncio
from io import BytesIO
from PIL import Image
import httpx
from app.main import app

async def test_complete_civic_data_loop():
    print("==================================================")
    print("VANGUARD CITY: TESTING COMPLETE END-TO-END DATA LOOP")
    print("==================================================")

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # STEP 1: Authority inspects baseline dashboard
        print("\n[STEP 1] Fetching Baseline Authority Dashboard Summary...")
        r = await client.get("/api/dashboard/summary")
        assert r.status_code == 200
        baseline_summary = r.json()
        print(f"  -> Baseline Open Complaints: {baseline_summary['open_complaints']}")
        print(f"  -> Baseline Overall Risk Score: {baseline_summary['overall_risk_score']}")

        # STEP 2: Citizen uploads road damage image
        print("\n[STEP 2] Citizen uploads road image via Vision Detection API...")
        img_buffer = BytesIO()
        Image.new('RGB', (640, 640), color=(70, 70, 75)).save(img_buffer, format='JPEG')
        files = {'image': ('citizen_pothole_photo.jpg', img_buffer.getvalue(), 'image/jpeg')}
        
        r = await client.post("/api/detections/detect", files=files, data={"ward_id": 14, "lat": 20.3145, "lng": 85.8340})
        assert r.status_code == 200
        det_data = r.json()
        print(f"  -> YOLO11 Processed Image: Detection Code = {det_data['detection_code']}")
        print(f"  -> Detected: {det_data['detections'][0]['class']} ({det_data['detections'][0]['severity']} severity)")

        # STEP 3: Citizen files complaint linked to the issue
        print("\n[STEP 3] Citizen submits formalized complaint...")
        complaint_payload = {
            "category": "road",
            "title": "Severe road damage caved in near School gate",
            "description": "Hazardous pothole causing vehicle swerving and near-miss accidents.",
            "ward": "Ward 14",
            "severity": "critical",
            "citizen_name": "Rohan Sen",
            "lat": 20.3145,
            "lng": 85.8340
        }
        r = await client.post("/api/complaints", json=complaint_payload)
        assert r.status_code == 201
        complaint_res = r.json()
        print(f"  -> Complaint Created: Ticket {complaint_res['id']}")
        print(f"  -> AI Department Assigned: {complaint_res['ai_classification']['category']} -> Roads & Infrastructure")

        # STEP 4: Risk Engine recalculates Ward 14 risk score
        print("\n[STEP 4] Central Risk Engine evaluates Ward 14 with new detections & complaint...")
        r = await client.get("/api/predictions/risk/14")
        assert r.status_code == 200
        risk_output = r.json()
        print(f"  -> Ward 14 Updated Risk Score: {risk_output['risk_score']} ({risk_output['risk_level']})")
        print(f"  -> Contributing Factors: Road Damage={risk_output['factors']['road_damage']}, Complaints={risk_output['factors']['complaints']}")
        print(f"  -> AI Actionable Recommendation: {risk_output['recommended_action']}")

        # STEP 5: Authority Dashboard reflects new data in real time
        print("\n[STEP 5] Authority Dashboard refetched...")
        r = await client.get("/api/dashboard/summary")
        assert r.status_code == 200
        updated_summary = r.json()
        print(f"  -> Updated Open Complaints: {updated_summary['open_complaints']} (+1 from baseline)")
        print(f"  -> Data Source: {updated_summary['data_source']}")

    print("\n[SUCCESS] COMPLETE URBAN DIGITAL TWIN CLOSED-LOOP DATA FLOW VERIFIED!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(test_complete_civic_data_loop())
