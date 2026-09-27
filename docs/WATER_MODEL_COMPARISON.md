# Vanguard City — Water Demand Prediction Model Benchmark: XGBoost vs LSTM

**Evaluation Date**: 2026-09-27 07:48 UTC  
**Dataset**: 730 Consecutive Days of Municipal Water Demand, Temperature, Rainfall, and Lagged Consumption  
**Split Protocol**: Strict Chronological Split (80% Train, 20% Test) — Zero Shuffling / Zero Data Leakage  

---

## 1. Benchmark Results

| Model | MAE (MLD) | RMSE (MLD) | MAPE (%) | Training Time | Inference Latency | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **XGBoost Regressor** | **5.22** | **6.74** | **1.61%** | **0.56s** | **0.0098 ms/sample** | **✅ Deployed in Production** |
| **PyTorch LSTM** | 6.38 | 8.26 | 1.97% | 13.801s | 0.0285 ms/sample | Evaluated Experimental |

---

## 2. Architectural Analysis & Deployment Decision

1. **Accuracy Comparison**:
   - **XGBoost achieved 1.61% MAPE** vs **LSTM's 1.97% MAPE**.
   - With engineered rolling statistics (7-day moving averages and lag-1 consumption), gradient-boosted decision trees capture sharp non-linear responses to summer heat spikes (+2.5 MLD/°C above 25°C) and monsoon onset without requiring complex recurrent state tracking.

2. **Computational Efficiency & Latency**:
   - XGBoost trains in **0.56 seconds** vs **13.801 seconds** for LSTM on CPU.
   - XGBoost inference latency is **0.0098 ms**, enabling instant municipal dashboard updates and real-time scenario simulation.

3. **Explainability & Governance**:
   - Municipal engineers require transparent feature attribution for water allocation. XGBoost natively provides Gini gain feature importances (`temperature`, `demand_lag1`, `rainfall`, `supply`), whereas LSTM hidden states act as black-boxes.

4. **Official Recommendation**:
   - **XGBoost remains the deployed production model** for Vanguard City.
   - The trained weights are serialized at `models/water/xgboost_water.json` and served by `POST /api/predictions` and `GET /api/water`.
