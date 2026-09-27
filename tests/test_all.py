"""
Vanguard City — Comprehensive System Test Runner (Phase 17)
Executes all verification suites across:
1. API Endpoints (FastAPI + Database)
2. Closed-Loop Civic Data Flow
3. ML Vision YOLO11 Pipeline
4. ML Water Demand XGBoost Model
5. GIS Infrastructure Graph & Centrality
6. RAG Civic Assistant
"""
import sys
import os
import unittest
import asyncio

# Ensure paths
backend_dir = os.path.abspath("backend")
root_dir = os.path.abspath(".")
for p in [backend_dir, root_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.tests.test_api_endpoints import test_all_endpoints
from backend.tests.test_data_flow import test_complete_civic_data_loop
from ml.water.water_predictor import WaterPredictionEngine
from gis.infrastructure_graph import CityInfrastructureGraph
from ml.risk.risk_engine import CentralRiskEngine
from backend.app.services.rag_civic_service import RAGCivicAssistant

class VanguardCityFullTestSuite(unittest.TestCase):

    def test_01_fastapi_endpoints(self):
        """Validates all REST API endpoints with DB persistence."""
        asyncio.run(test_all_endpoints())

    def test_02_closed_loop_data_flow(self):
        """Validates full citizen-upload to dashboard feedback loop."""
        asyncio.run(test_complete_civic_data_loop())

    def test_03_water_xgboost_model(self):
        """Validates XGBoost water demand forecasting and metrics."""
        engine = WaterPredictionEngine()
        metrics = engine.train_and_evaluate()
        self.assertLess(metrics["MAPE_percent"], 5.0)
        self.assertIn("MAE_MLD", metrics)

    def test_04_infrastructure_graph(self):
        """Validates NetworkX topological centrality and cascade failures."""
        graph = CityInfrastructureGraph()
        metrics = graph.calculate_centrality_metrics()
        self.assertGreater(metrics["total_nodes"], 20)
        self.assertGreater(metrics["total_edges"], 25)

    def test_05_central_risk_engine(self):
        """Validates multi-factor risk scoring and factor attribution."""
        engine = CentralRiskEngine()
        res = engine.compute_ward_risk("Ward 14", 80.0, 60.0, 40.0, 15.0, 0.2, 85000)
        self.assertIn("risk_score", res)
        self.assertIn("factors", res)
        self.assertEqual(res["dominant_factor"], "road_damage")

    def test_06_rag_civic_assistant(self):
        """Validates grounded retrieval from approved municipal documents."""
        rag = RAGCivicAssistant()
        res = rag.answer_query("building permit procedures and required documents")
        self.assertTrue(res["is_official_guidance"])
        self.assertIn("BP-01", res["answer"])

    def test_07_geofabrik_osm_pipeline(self):
        """Validates Geofabrik OpenStreetMap import and FastAPI endpoints."""
        from gis.geofabrik_importer import GeofabrikImporter
        import httpx
        from backend.app.main import app

        importer = GeofabrikImporter()
        res = importer.generate_high_fidelity_sample_extract()
        self.assertTrue(os.path.exists(res["roads"]))
        self.assertTrue(os.path.exists(res["buildings"]))
        self.assertTrue(os.path.exists(res["landuse"]))

        # Test FastAPI endpoints
        async def verify_endpoints():
            transport = httpx.ASGITransport(app=app)
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
                r_stats = await client.get("/api/gis/osm/stats")
                self.assertEqual(r_stats.status_code, 200)
                self.assertFalse(r_stats.json()["api_key_required"])

                r_roads = await client.get("/api/gis/osm/roads")
                self.assertEqual(r_roads.status_code, 200)
                self.assertGreater(r_roads.json()["total_count"], 0)

                r_bldgs = await client.get("/api/gis/osm/buildings")
                self.assertEqual(r_bldgs.status_code, 200)
                self.assertGreater(r_bldgs.json()["total_count"], 0)

                r_land = await client.get("/api/gis/osm/landuse")
                self.assertEqual(r_land.status_code, 200)
                self.assertGreater(r_land.json()["total_count"], 0)

        asyncio.run(verify_endpoints())

    def test_08_environment_and_satellite_apis(self):
        """Validates Copernicus Sentinel Hub, OpenAQ, and OpenWeather endpoints."""
        import httpx
        from backend.app.main import app

        async def verify_env():
            transport = httpx.ASGITransport(app=app)
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
                # 1. Weather (OpenWeather)
                r_w = await client.get("/api/environment/weather")
                self.assertEqual(r_w.status_code, 200)
                self.assertIn("temperature_celsius", r_w.json())
                self.assertIn("rainfall_mm_1h", r_w.json())

                # 2. Air Quality (OpenAQ)
                r_aq = await client.get("/api/environment/air-quality")
                self.assertEqual(r_aq.status_code, 200)
                self.assertIn("overall_aqi", r_aq.json())
                self.assertIn("pollutants", r_aq.json())

                # 3. Copernicus Sentinel-2 Satellite Scenes
                r_sat = await client.get("/api/environment/satellite/scenes")
                self.assertEqual(r_sat.status_code, 200)
                self.assertIn("acquisitions_count", r_sat.json())

                # 4. Satellite Surface Construction Changes
                r_con = await client.get("/api/environment/satellite/construction-changes")
                self.assertEqual(r_con.status_code, 200)
                self.assertGreater(len(r_con.json()["detections"]), 0)

                # 5. Satellite Reservoir NDWI
                r_res = await client.get("/api/environment/satellite/reservoirs")
                self.assertEqual(r_res.status_code, 200)
                self.assertGreater(len(r_res.json()["reservoirs"]), 0)

        asyncio.run(verify_env())

    def test_09_nominatim_geocoding(self):
        """Validates OpenStreetMap Nominatim forward search and reverse geocoding endpoints."""
        import httpx
        from backend.app.main import app

        async def verify_geocoding():
            transport = httpx.ASGITransport(app=app)
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
                # 1. Forward Geocoding Search
                r_search = await client.get("/api/geocoding/search", params={"q": "Patia, Bhubaneswar", "limit": 3})
                self.assertEqual(r_search.status_code, 200)
                data_search = r_search.json()
                self.assertIsInstance(data_search, list)
                self.assertGreater(len(data_search), 0)
                first = data_search[0]
                self.assertIn("display_name", first)
                self.assertIn("latitude", first)
                self.assertIn("longitude", first)
                self.assertIn("type", first)
                self.assertIn("osm_id", first)
                self.assertIn("osm_type", first)

                # 2. Reverse Geocoding
                r_rev = await client.get("/api/geocoding/reverse", params={"latitude": 20.2961, "longitude": 85.8245})
                self.assertEqual(r_rev.status_code, 200)
                data_rev = r_rev.json()
                self.assertIn("display_name", data_rev)
                self.assertIn("latitude", data_rev)
                self.assertIn("longitude", data_rev)
                self.assertIn("address", data_rev)
                addr = data_rev["address"]
                for key in ["road", "city", "district", "state", "country"]:
                    self.assertIn(key, addr)

                # 3. Input Validation (Out of bound coordinates)
                r_invalid = await client.get("/api/geocoding/reverse", params={"latitude": 999.0, "longitude": 85.8245})
                self.assertEqual(r_invalid.status_code, 422)

                # 4. Short Query Validation
                r_short = await client.get("/api/geocoding/search", params={"q": "a"})
                self.assertEqual(r_short.status_code, 422)

        asyncio.run(verify_geocoding())

    def test_10_jwt_authentication_and_rbac(self):
        """Validates JWT registration, authentication, token decoding, and RBAC role checks."""
        import httpx
        import uuid
        from backend.app.main import app

        async def verify_auth():
            transport = httpx.ASGITransport(app=app)
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
                # 1. Admin login
                r_login = await client.post("/api/auth/login", json={"username": "admin", "password": "Admin@1234"})
                self.assertEqual(r_login.status_code, 200)
                data = r_login.json()
                self.assertIn("access_token", data)
                self.assertEqual(data["user"]["role"], "authority_admin")
                token = data["access_token"]

                # 2. Token-authenticated profile request
                r_me = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
                self.assertEqual(r_me.status_code, 200)
                self.assertEqual(r_me.json()["username"], "admin")

                # 3. Bad credentials
                r_bad = await client.post("/api/auth/login", json={"username": "admin", "password": "WrongPassword"})
                self.assertEqual(r_bad.status_code, 401)

                # 4. User registration
                unique_user = f"citizen_{uuid.uuid4().hex[:6]}"
                r_reg = await client.post("/api/auth/register", json={
                    "username": unique_user,
                    "email": f"{unique_user}@vanguardcity.gov",
                    "password": "Password@1234",
                    "full_name": "Test Citizen",
                    "role": "citizen"
                })
                self.assertEqual(r_reg.status_code, 201)
                self.assertEqual(r_reg.json()["user"]["role"], "citizen")

        asyncio.run(verify_auth())

if __name__ == "__main__":
    unittest.main()
