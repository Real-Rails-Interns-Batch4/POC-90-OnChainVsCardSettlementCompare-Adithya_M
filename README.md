# Real Rails: On-Chain vs Card Settlement Intelligence (POC)

A high-performance visual dashboard and diagnostic terminal designed to compare the settlement mechanics, fees, clearing speeds, and intermediary flows of **On-Chain Bitcoin (and Layer-2 Lightning)** against legacy **Card Networks (Visa/Mastercard)**.

This Proof of Concept (POC) utilizes a Python FastAPI backend for live network pricing queries and data engineering projections (via Pandas), and a responsive Next.js frontend with ReactFlow visualization to map the complex intermediary routes of payment infrastructure.

---

## 🚀 Key Features

*   **Side-by-Side Settlement Analytics**: Compare total settlement fees, effective fee rates, clearing times, and counterparty risks across four custom scenarios:
    1.  **Retail Purchase**: Low ticket size (e.g., $35.00) comparing credit card interchange fees to on-chain Bitcoin.
    2.  **B2B Wholesale Payment**: Large ticket size (e.g., $12,500.00) showing how volume affects cost-effectiveness.
    3.  **Cross-Border Remittance**: High FX markups and correspondent bank routing compared to border-free blockchain settlement.
    4.  **Micropayment**: Sub-dollar transaction (e.g., $0.75) illustrating where credit card flat fees are cost-prohibitive and proposing a Layer-2 Lightning Network alternative.
*   **Live Blockchain Metrics Integration**: Connects to the live [mempool.space API](https://mempool.space) to fetch recommended gas fees (sat/vB) and the [blockchain.info ticker](https://blockchain.info/ticker) for real-time BTC/USD exchange rates.
*   **Extreme Durability Failover (Local Calculations)**: Built-in frontend redundancy. If the FastAPI backend is offline or unreachable, the frontend automatically switches to a high-fidelity client-side calculations engine using offline parameters, ensuring 100% dashboard uptime.
*   **Interactive Parameters Panel**: Override transaction amounts and sat/vB fee rates in real time to instantly see the updated fee rates and cost comparisons.
*   **Intermediary Flow Visualization**: Built with **ReactFlow** to visually demonstrate the contrast between the highly intermediary-dependent Card Network path (Visa/MC, Acquirers, Issuers, Gateways) and the peer-to-peer Bitcoin protocol.
*   **Federal Reserve Payments Study Context**: Displays baseline data and fraud/chargeback insights sourced from the Fed Payments Study and BIS CPMI statistics.
*   **Data Export (CSV)**: Export the comparison matrices as a downloadable CSV from either the backend API or directly via client-side generation.

---

## 📸 Visual Previews & Demo Walkthrough

### 🖥️ Complete Dashboard Overview
Below is the full dashboard view showcasing the side-by-side transaction cost metrics and clearing parameters:
![Dashboard View](file:///c:/Users/Adithya%20M/Desktop/new/POC-90-OnChainVsCardSettlementCompare-Adithya_M/POC-90-OnChainVsCardSettlementCompare-Adithya_M/Screenshots/Dashboard_View.png)

### 👥 Intermediary Flow Route (ReactFlow Visualizer)
Interactive visual graph showing the 6 complex legacy rails vs. 3 peer-to-peer cryptocurrency nodes:
![Intermediary Flow Graph](file:///c:/Users/Adithya%20M/Desktop/new/POC-90-OnChainVsCardSettlementCompare-Adithya_M/POC-90-OnChainVsCardSettlementCompare-Adithya_M/Screenshots/Inetermediary_Count_and_Transition_Routing_Flow.png)

### 📊 Metric Analysis Views
Compare Card rails side-by-side with On-Chain metrics:
![Comparison Overview](file:///c:/Users/Adithya%20M/Desktop/new/POC-90-OnChainVsCardSettlementCompare-Adithya_M/POC-90-OnChainVsCardSettlementCompare-Adithya_M/Screenshots/On_Chain_VS_Card_Settlement_Compare.png)

### 📈 Settlement Finality & Comparison Ledger
Logarithmic time comparison of settlement speeds along with comparisons ledger:
![Settlement Finality Comparison](file:///c:/Users/Adithya%20M/Desktop/new/POC-90-OnChainVsCardSettlementCompare-Adithya_M/POC-90-OnChainVsCardSettlementCompare-Adithya_M/Screenshots/Settlement_Finality_Timeline_Comparison.png)
![Scenario Comparison Ledger](file:///c:/Users/Adithya%20M/Desktop/new/POC-90-OnChainVsCardSettlementCompare-Adithya_M/POC-90-OnChainVsCardSettlementCompare-Adithya_M/Screenshots/Scenario_Comparison_Ledger.png)

### ⚙️ Real-Time Intelligence & Parameters Override
Detailed metrics and live override forms on the sidebar:
![Real-Time Intelligence Sidebar](file:///c:/Users/Adithya%20M/Desktop/new/POC-90-OnChainVsCardSettlementCompare-Adithya_M/POC-90-OnChainVsCardSettlementCompare-Adithya_M/Screenshots/Intelligence_Sidebar.png)

### 🎥 Demo Video
A complete walkthrough video of the platform, showing all features, live mempool querying, parameter overrides, and CSV download functionality:
[Play Walkthrough Demo Video](file:///c:/Users/Adithya%20M/Desktop/new/POC-90-OnChainVsCardSettlementCompare-Adithya_M/POC-90-OnChainVsCardSettlementCompare-Adithya_M/Video(Demo)/-OnChain_Vs_Card_Settlement_Compare_DemoVideo.mp4)

---

## 🛠️ Technology Stack

### Backend
*   **Language**: Python 3.8+
*   **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Asynchronous, self-documenting REST API)
*   **Data Processing**: [Pandas](https://pandas.pydata.org/) (Data structures, projections, and CSV streaming)
*   **HTTP Client**: [Requests](https://requests.readthedocs.io/) (External API communications)
*   **Server**: [Uvicorn](https://www.uvicorn.org/) (ASGI web server)

### Frontend
*   **Framework**: [Next.js v16.2.7](https://nextjs.org/) (React 19, App Router)
*   **Language**: TypeScript
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
*   **Visualization**: [ReactFlow v11](https://reactflow.dev/) (Interactive node graphs)
*   **Icons**: [Lucide React](https://lucide.dev/)

### Database
*   **Type**: File-based NoSQL Mock Database
*   **File**: `backend/mock_data.json`
*   *Note: This architecture allows rapid prototyping and zero-dependency database installation, while maintaining scenario consistency.*

---

## 📁 Project Structure

```text
POC-90-OnChainVsCardSettlementCompare-Adithya_M/
├── backend/
│   ├── main.py            # FastAPI entry point & API endpoints
│   ├── mock_data.json     # Scenario structures, fees, and Fed context
│   ├── requirements.txt   # Python backend dependencies
│   ├── test_api.py        # Local API verification scripts
│   └── venv/              # Python virtual environment (ignored)
├── frontend/
│   ├── package.json       # Node scripts & dependencies (React 19, Next.js 16)
│   ├── postcss.config.mjs # CSS post-processing rules
│   ├── tsconfig.json      # TypeScript compiler configurations
│   ├── public/            # Core images & favicons
│   └── src/
│       └── app/
│           ├── globals.css # Custom themes & Tailwind imports
│           ├── layout.tsx  # Next.js root layout
│           └── page.tsx    # Dashboard core UI (ReactFlow, Fetchers, calculations)
└── README.md              # Project documentation (this file)
```

---

## ⚙️ Setup and Installation

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [Python](https://www.python.org/) (v3.8 or higher recommended)

---

### 1. Backend Setup & Run

Navigate to the `backend` directory, set up a virtual environment, and boot up the server:

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Windows (Command Prompt):
.\venv\Scripts\activate.bat
# On macOS / Linux:
source venv/bin/activate

# Install required packages
pip install -r requirements.txt

# Run the FastAPI server
python main.py
```

The FastAPI backend will start running locally at **`http://127.0.0.1:8000`**.

#### Verify Backend endpoints:
In a separate terminal (with virtual environment activated):
```bash
python test_api.py
```
This runs the local API test client and prints verification results for fee fetchers, comparison logic, and CSV exports.

---

### 2. Frontend Setup & Run

Open a new terminal window, navigate to the `frontend` directory, and start the development server:

```bash
# Navigate to the frontend directory
cd frontend

# Install package dependencies
npm install

# Start the development server (configured to port 8080)
npm run dev
```

Open your browser and navigate to **`http://localhost:8080`** to interact with the Real Rails Dashboard.

---

## 🔌 API Endpoints (Backend)

The backend provides the following JSON endpoints:

*   **`GET /api/mempool`**
    *   **Description**: Queries mempool.space for recommended BTC fees and blockchain.info for BTC price.
    *   **Sample Output**:
        ```json
        {
          "sat_per_vbyte": 25,
          "btc_price_usd": 68000.0,
          "is_live": true,
          "error": null
        }
        ```

*   **`GET /api/compare`**
    *   **Parameters**:
        *   `use_case` (string, optional - `retail`, `b2b`, `cross_border`, `micropayment`. Default: `retail`)
        *   `amount` (float, optional - transaction value in USD)
        *   `sat_rate` (int, optional - BTC fee rate in sat/vB)
    *   **Description**: Calculates comparison matrices, insights, savings, and table payloads.

*   **`GET /api/export`**
    *   **Parameters**: Same as `/api/compare`
    *   **Description**: Generates and streams a downloadable CSV of the comparison ledger.
