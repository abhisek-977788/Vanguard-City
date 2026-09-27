# 🏙️ Vanguard City — Urban Digital Twin

> **AI-Driven Municipal Intelligence Platform (India-Focused)**

Vanguard City is a full-stack production-style prototype that combines Computer Vision, Predictive Analytics, Geospatial Intelligence, Infrastructure Graph Analytics, and Generative AI to transform disconnected civic data into a unified urban digital twin.

---

## ⚠️ Important Disclaimer

All predictions, risk scores, and AI-generated recommendations in this system are **AI-generated prioritization tools only**. They do **not** represent official government decisions, verified infrastructure assessments, or legal determinations. Municipal authorities must independently verify all AI outputs before taking action.

---

## 🏗️ Architecture Overview

```
                      ┌───────────────────────────────────────┐
                      │   React 18 Frontend (Vite + TS)      │
                      │  Authority Command & Citizen Portal   │
                      └──────────────────┬────────────────────┘
                                         │ HTTP / REST / JWT
                                         ▼
                      ┌───────────────────────────────────────┐
                      │        FastAPI Backend (:8000)        │
                      │   Auth | GIS | ML | RAG | Telemetry   │
                      └──────────────────┬────────────────────┘
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 ▼                       ▼                       ▼
      ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
      │   PostgreSQL/PostGIS │ │   ML Model Engines  │ │ Open Data Telemetry │
      │   or SQLite Fallback │ │  YOLO11 (Vision)    │ │ Open-Meteo Weather  │
      │   17 Tables Seeded   │ │  XGBoost (Water)    │ │ OpenAQ Air Quality  │
      │   Spatial Queries    │ │  NetworkX (Graph)   │ │ Copernicus Sentinel │
      └─────────────────────┘ │  RAG Assistant (NLP)│ │ Nominatim Geocoding │
                              └─────────────────────┘ └─────────────────────┘
```

---

## 🚀 System Status & Features

| Phase / Feature | Status | Details |
|---|:---:|---|
| **Authority Command Dashboard** | ✅ COMPLETE | 10 pages: Command Overview, Risk Map, Water Intelligence, Infrastructure, Power Network, Construction, Complaints, Insights, Reports, Settings |
| **Citizen Portal** | ✅ COMPLETE | Report Issue (photo upload + AI detection), Track Complaint (real-time timeline), Civic Services directory, RAG Civic AI Assistant |
| **JWT Authentication & RBAC** | ✅ COMPLETE | Roles: `authority_admin`, `field_officer`, `citizen` with bcrypt hashing and token verification |
| **YOLO11 Road Damage Vision** | ✅ COMPLETE | Trained weights saved at `models/vision/best.pt` (5.5 MB), detects potholes/cracks with confidence >0.90 |
| **XGBoost Water Demand & LSTM** | ✅ COMPLETE | Model serialized at `models/water/xgboost_water.json` (MAE 5.22 MLD, MAPE 1.61%), benchmarked against PyTorch LSTM |
| **Geospatial & OSM Integration** | ✅ COMPLETE | Leaflet OSM tiles, Geofabrik .osm.pbf pipeline, Nominatim forward/reverse geocoding |
| **Open Data APIs** | ✅ COMPLETE | Open-Meteo (zero key required), OpenWeather, OpenAQ, Copernicus Data Space Sentinel Hub |
| **Automated Test Suite** | ✅ COMPLETE | 10/10 regression suites passing in `tests/test_all.py` |
| **Production Deployment** | ✅ COMPLETE | Docker compose, multi-stage Dockerfiles, Vercel config, Render blueprint |

---

## 🔑 Demo Accounts & Credentials

| Role | Username | Password | Access Level |
|---|---|---|---|
| **Authority Admin** | `admin` | `Admin@1234` | Full access to all municipal intelligence modules and settings |
| **Field Officer** | `officer_patnaik` | `Officer@1234` | Inspections, complaint updates, detection verifications |
| **Citizen** | `priya_citizen` | `Citizen@1234` | Issue submission, complaint tracking, civic services |

---

## ⚙️ Quick Start (Local Development)

### 1. Backend (FastAPI)
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
* API Documentation: `http://localhost:8000/docs`
* Health Check: `http://localhost:8000/api/health`

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
* App URL: `http://localhost:3000`
* Authority Dashboard: `http://localhost:3000/authority`
* Citizen Portal: `http://localhost:3000/citizen`

### 3. Run Automated Tests
```bash
python tests/test_all.py
```

---

## 🐳 Docker & Cloud Deployment

### Docker Compose
```bash
docker-compose -f docker/docker-compose.yml up --build
```

### Vercel (Frontend)
Deploy directly using `frontend/vercel.json`:
```bash
cd frontend
vercel deploy
```

### Render (Backend & Database)
Deploy the infrastructure blueprint using `render.yaml`.

---

## 📄 License & Attribution

* Map Data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
* Open Data: Open-Meteo, OpenAQ, Copernicus Data Space Ecosystem.
* Research & Civic Prototype. AI outputs are advisory only and must be verified by certified municipal engineers.
