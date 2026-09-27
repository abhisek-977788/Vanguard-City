# Vanguard City — Security Architecture & Governance

> **Phase 19 Security & Compliance Specification**

---

## 1. Security Overview

Vanguard City processes civic infrastructure data, citizen complaints, and municipal assets. A defense-in-depth architecture ensures system integrity, citizen privacy, and protection against unauthorized tampering.

---

## 2. Core Security Controls

### A. Authentication & Role-Based Access Control (RBAC)
- **Password Security**: Passwords hashed using `bcrypt` (12 rounds) via `passlib`.
- **JWT Tokens**: Short-lived JSON Web Tokens (`HS256`, 60-minute expiry) issued on `/api/auth/token`.
- **User Roles**:
  - `citizen`: Can report issues, track their own complaints, query Civic AI.
  - `authority_admin`: Full access to command dashboard, alerts, ward configuration.
  - `field_officer`: Inspection verification, update complaint status, verify construction.
  - `analyst`: Read-only access to GIS layers, ML predictions, and export reports.

### B. Input & File Upload Validation
- **MIME Type Whitelisting**: Strict verification of uploaded image headers (`image/jpeg`, `image/png`, `image/webp`).
- **File Size Ceiling**: Hard limit of 10MB per image upload to prevent Denial of Service (DoS) and disk exhaustion.
- **Randomized File Storage**: Uploaded files renamed with cryptographic UUIDs to prevent directory traversal and overwrite attacks.

### C. Network & API Protection
- **CORS Configuration**: Restricts API calls to authorized dashboard origins (`http://localhost:3000`, municipal intranet domains).
- **Pydantic Validation**: All incoming JSON payloads parsed and sanitized via strict Pydantic v2 schemas.
- **SQL Injection Prevention**: Parameterized queries enforced across all SQLAlchemy ORM models and raw query bindings.

### D. Secret Management
- **Environment Isolation**: All database credentials, JWT keys, and Gemini API keys stored strictly in `.env` files.
- **Zero-Secret Policy**: `.env` is explicitly added to `.gitignore`. An `.env.example` template provides onboarding schema without live secrets.

---

## 3. Civic AI Anti-Hallucination & Legal Safeguards
- **RAG Grounding**: The civic assistant responds exclusively using approved municipal SOPs (`DOC-WATER-01`, `DOC-BUILDING-02`, `DOC-COMPLAINTS-03`, `DOC-TAX-04`).
- **Refusal on Ambiguity**: When an approved document cannot be verified, the assistant explicitly declines to invent procedures, fees, or timelines.
- **Prominent Disclaimers**: Every response carries mandatory notices that AI outputs are advisory and not statutory determinations.
