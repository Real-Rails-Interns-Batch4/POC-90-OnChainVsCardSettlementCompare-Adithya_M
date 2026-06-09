# Verification and Validation (V&V) Report

This document reports the verification and validation findings for the **On-Chain vs Card Settlement Compare** platform.

---

## 1. Scope & Objectives
The objective of this verification and validation phase is to confirm that both the frontend dashboard and backend API conform to system requirements and perform correct fee/finality calculations across legacy card networks and cryptocurrency protocols.

*   **Verification**: Ensuring the codebase is built correctly, calculations are mathematically accurate, local calculations match backend outputs, and endpoints return expected schemas.
*   **Validation**: Confirming the system meets the core requirements of a transaction settlement comparison dashboard, incorporating real-time blockchain stats and providing a robust offline mode.

---

## 2. Test Environment
*   **Operating System**: Windows 11
*   **Backend Runtime**: Python v3.11+
*   **Frontend Runtime**: Node.js v18.0+ / npm v10.0+
*   **Local Backend Server**: FastAPI (localhost:8000)
*   **Local Frontend Server**: Next.js (localhost:8080)

---

## 3. Verification Activities & Results

### 3.1 Automated Backend Tests
Automated verification is configured via `backend/test_api.py`. The script tests endpoints directly using FastAPI's `TestClient` to verify status codes, payload structures, and headers.

**Run Command:**
```powershell
python backend/test_api.py
```

**Results Log:**
```text
Starting FastAPI Local Tests...
Mempool Stats: {'sat_per_vbyte': 25, 'btc_price_usd': 68250.0, 'is_live': True, 'error': None}
Compare Retail: Retail Purchase Amount: 35.0
Export CSV success, headers: Headers({'content-disposition': 'attachment; filename=settlement_compare_retail.csv', 'content-type': 'text/csv; charset=utf-8'})

SUCCESS: All backend tests passed successfully!
```

---

### 3.2 Manual & Failover Verification Cases

| Test ID | Test Category | Description | Verification Method | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | API Integration | Fetch live BTC price and gas rates from external networks. | Trigger `/api/mempool` API. | Return integer `sat_per_vbyte` and float `btc_price_usd` with `is_live=true`. | **PASS** |
| **TC-02** | Projections | Calculate card rail fees proportionally (interchange, acquirer, network fees). | Query `/api/compare` with amount = $100.00. | Total fee matches flat rates + percentages ($1.80 + $0.15 + $0.35 + $0.10 = $2.40). | **PASS** |
| **TC-03** | Projections | Calculate Bitcoin miner fees independent of transaction amount. | Query `/api/compare` for amount = $10.00 vs amount = $10,000.00 under same sat rate. | On-Chain fee remains identical in dollar terms (only dependent on sat rate and vBytes). | **PASS** |
| **TC-04** | Failover | Disconnect backend server and verify UI. | Stop FastAPI server and refresh dashboard. | Dashboard loads, displays fallback indicators, and local calculations compute matching values. | **PASS** |
| **TC-05** | UI Components | Dynamic coordinate routing for Intermediary charts. | Switch between "Card Network" and "On-Chain Bitcoin" tabs. | ReactFlow re-renders correct node count (6 nodes for Cards, 3 nodes for On-chain). | **PASS** |
| **TC-06** | Data Export | Export transaction data matrix. | Click "Download Sample Data" button. | CSV file downloads with parameters matching the active transaction scenario. | **PASS** |

---

## 4. Requirement Validation

*   **Requirement: Side-by-side comparison**
    *   *Validation*: Dashboard renders Card Settlement and On-Chain Bitcoin side-by-side with clear sections for fee breakdowns, clearing speeds, and risk governance.
*   **Requirement: Interactive variables overrides**
    *   *Validation*: User input forms for Custom Amount overrides and Custom Sat Rate overrides directly hook into state listeners, recalculating all metrics within milliseconds.
*   **Requirement: Federal Reserve contexts**
    *   *Validation*: Dashboard footer imports and displays US transaction fraud averages (12.5 bps), chargeback rates (0.15%), and total volumes ($9.4T) matching mock specs.
*   **Requirement: L2 Lightning recommendations**
    *   *Validation*: Systems check triggers alert warnings for sub-dollar micropayment scenarios recommending L2 Lightning Network alternative, noting instant finality and nominal fees.

---

## 5. Summary
All verification tests passed successfully, and validation confirms the POC meets the business goals of comparing the legacy payment rails to cryptocurrency networks with real-time accuracy and resilient local-first performance.
