# User Acceptance Testing (UAT) Checklist

This checklist is designed for stakeholders to test and sign off on the features, calculations, usability, and robustness of the **On-Chain vs Card Settlement Compare** dashboard.

---

## 📋 How to Conduct UAT

1.  Start the FastAPI backend (`python main.py` in `backend` folder).
2.  Start the Next.js development server (`npm run dev` in `frontend` folder).
3.  Open the web application at `http://localhost:8080` in your browser.
4.  Follow the verification checklist below, checking off items as they pass.

---

## 🔍 Acceptance Criteria Checklist

### 1. Visual Design & Dashboard Layout
| Check | Component / Goal | Test Instructions | Expected Behavior | Status |
| :---: | :--- | :--- | :--- | :---: |
| [x] | **Dark Theme & Layout** | Open dashboard, inspect style. | Dashboard uses premium dark cyber theme (background `#030712`, clean borders, and cyan/indigo color highlights). | paddd |
| [x] | **Responsive Viewports** | Resize browser window to mobile width. | Sidebar floats gracefully, grids adapt, charts resize without breaking page overflow rules. | paddd |
| [x] | **Live Blockchain Indicators** | View top-right header and sidebar live stats. | BTC Price and live recommended gas fee metrics are displayed and load from mempool network data. | paddd |
| [x] | **Federal Reserve Context** | Scroll to dashboard footer. | Context footer displays average card fraud rate, total card volume ($9.4T), and clearing ratios. | paddd |

### 2. Interactive Overrides & Projections
| Check | Component / Goal | Test Instructions | Expected Behavior | Status |
| :---: | :--- | :--- | :--- | :---: |
| [x] | **Scenario Selection** | Select B2B, Cross-Border, and Micropayments in the dropdown. | Selecting scenarios modifies transaction amount default values, titles, descriptions, and fee outcomes instantly. | paddd |
| [x] | **Amount Override** | Input custom amount (e.g. `500.00`) in the "Override Amount ($)" field. | Card and On-Chain total fees, effective fee rates (%), and savings calculations update immediately. | paddd |
| [x] | **Bitcoin Gas Override** | Input custom gas fee (e.g. `100`) in the "Bitcoin gas rate" field. | On-Chain Total Fee increases proportionately, while Card Rail fees remain completely unchanged. | paddd |
| [x] | **L2 Lightning Recommendation** | Select the "Micropayment" scenario. | System highlights Lightning Network L2 alternative card, demonstrating sub-second finality and low fees. | paddd |

### 3. Visual Intermediary Graphs (ReactFlow)
| Check | Component / Goal | Test Instructions | Expected Behavior | Status |
| :---: | :--- | :--- | :--- | :---: |
| [x] | **Dynamic Nodes Rendering** | Toggle between "Card Network" and "On-Chain Bitcoin" tabs above canvas. | Canvas dynamically renders the corresponding payment routing diagram (6 nodes for cards, 3 nodes for bitcoin). | paddd |
| [x] | **Interactive Canvas** | Click and drag nodes, zoom in and out of the flowchart. | Flowchart nodes are draggable; canvas pans and zooms smoothly via scroll wheel/trackpad. | paddd |
| [x] | **Animated Connectors** | Inspect edge paths on the active diagram. | Connectors feature subtle animations demonstrating the direction of cash/value movement. | paddd |

### 4. Data Export
| Check | Component / Goal | Test Instructions | Expected Behavior | Status |
| :---: | :--- | :--- | :--- | :---: |
| [x] | **CSV Download** | Click the "Download Sample Data (CSV)" button at the bottom of the sidebar. | Browser downloads a `.csv` file (e.g. `settlement_compare_retail.csv`) containing matching parameters. | paddd |
| [x] | **CSV Content Integrity** | Open downloaded CSV in a spreadsheet viewer. | CSV includes columns for `Parameter`, `Card Settlement`, and `Bitcoin On-Chain` with correct cost values. | paddd |

### 5. Resiliency & Failover (Offline Mode)
| Check | Component / Goal | Test Instructions | Expected Behavior | Status |
| :---: | :--- | :--- | :--- | :---: |
| [x] | **Backend Offline Safe Load** | Shut down FastAPI backend process (`Ctrl+C` in backend terminal). Refresh page. | Next.js dashboard loads fully, showing a warn flag/log warning, but UI elements remain functional. | paddd |
| [x] | **Offline Calculations** | With backend offline, update Custom Amount & Sat Rate overrides. | Dashboard successfully performs accurate calculations locally in the browser. | paddd |
| [x] | **Offline CSV Generation** | With backend offline, click the "Download Sample Data" button. | Browser generates and triggers a client-side CSV download (`settlement_compare_retail_fallback.csv`) automatically. | paddd |
