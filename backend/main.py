import os
import json
import pandas as pd
import requests
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import io

app = FastAPI(title="Real Rails: On-Chain vs Card Settlement Intelligence")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For POC, allow all. In production, restrict.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load base mock data
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MOCK_DATA_PATH = os.path.join(BASE_DIR, "mock_data.json")

def load_base_data():
    try:
        with open(MOCK_DATA_PATH, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading mock data: {e}")
        return {}

# Live API Fetch with Failover
def get_live_bitcoin_data():
    """
    Fetches recommended fee from mempool.space and BTC price from blockchain.info.
    Falls back to mock values if failure occurs.
    """
    data = {
        "sat_per_vbyte": 25,
        "btc_price_usd": 68000.0,
        "is_live": False,
        "error": None
    }
    
    # 1. Fetch fee rate from mempool.space
    try:
        fee_resp = requests.get("https://mempool.space/api/v1/fees/recommended", timeout=3)
        if fee_resp.status_code == 200:
            fee_data = fee_resp.json()
            # Use 'hourFee' (standard 1-block settlement) as our base
            data["sat_per_vbyte"] = fee_data.get("hourFee", 25)
            data["is_live"] = True
    except Exception as e:
        data["error"] = f"Mempool API error: {str(e)}"

    # 2. Fetch BTC price from blockchain.info
    try:
        price_resp = requests.get("https://blockchain.info/ticker", timeout=3)
        if price_resp.status_code == 200:
            price_data = price_resp.json()
            data["btc_price_usd"] = price_data.get("USD", {}).get("last", 68000.0)
            data["is_live"] = data["is_live"] and True
    except Exception as e:
        if data["error"]:
            data["error"] += f" | Price API error: {str(e)}"
        else:
            data["error"] = f"Price API error: {str(e)}"
            
    return data

def run_pandas_intelligence(use_case: str, amount: float, custom_sat_per_vbyte: int = None):
    """
    Performs data frame styling, projections, and calculations.
    """
    base_data = load_base_data()
    scenarios = base_data.get("scenarios", {})
    
    if use_case not in scenarios:
        use_case = "retail"
        
    scenario = scenarios[use_case]
    
    # Live stats
    live_btc = get_live_bitcoin_data()
    
    sat_rate = custom_sat_per_vbyte if custom_sat_per_vbyte is not None else live_btc["sat_per_vbyte"]
    btc_price = live_btc["btc_price_usd"]
    
    # Card Fee Calculation
    c_fee_struct = scenario["card_rail"]["fee_structure"]
    c_interchange = (c_fee_struct.get("interchange_pct", 0) / 100.0) * amount
    c_network = (c_fee_struct.get("network_pct", 0) / 100.0) * amount
    c_acquirer = (c_fee_struct.get("acquirer_pct", 0) / 100.0) * amount
    c_fx = (c_fee_struct.get("fx_markup_pct", 0) / 100.0) * amount
    c_flat = c_fee_struct.get("flat_fee", 0.0)
    
    total_card_fee = c_interchange + c_network + c_acquirer + c_fx + c_flat
    card_fee_pct = (total_card_fee / amount) * 100.0 if amount > 0 else 0.0

    # Bitcoin On-Chain Fee Calculation
    tx_size = scenario["on_chain_rail"]["fee_structure"]["tx_size_vbytes"]
    total_sats = sat_rate * tx_size
    total_btc_fee = (total_sats / 100000000.0) * btc_price
    btc_fee_pct = (total_btc_fee / amount) * 100.0 if amount > 0 else 0.0
    
    # Lightning Optimization Reference (Hypothetical for comparison)
    ln_fee = min(0.01 + (amount * 0.002), 2.50) if use_case == "micropayment" or use_case == "retail" else 0.05
    ln_fee_pct = (ln_fee / amount) * 100.0 if amount > 0 else 0.0

    # Assemble data points for Pandas Analysis
    df_compare = pd.DataFrame([
        {
            "Metric": "Transaction Amount ($)",
            "Card": amount,
            "On-Chain": amount
        },
        {
            "Metric": "Total Settlement Fee ($)",
            "Card": round(total_card_fee, 4),
            "On-Chain": round(total_btc_fee, 4)
        },
        {
            "Metric": "Effective Fee Rate (%)",
            "Card": round(card_fee_pct, 4),
            "On-Chain": round(btc_fee_pct, 4)
        },
        {
            "Metric": "Intermediaries Involved",
            "Card": len(scenario["card_rail"]["intermediaries"]),
            "On-Chain": len(scenario["on_chain_rail"]["intermediaries"])
        },
        {
            "Metric": "Settlement Finality Time (sec)",
            "Card": scenario["card_rail"]["finality_time_seconds"],
            "On-Chain": scenario["on_chain_rail"]["finality_time_seconds"]
        }
    ])
    
    # Insights derivation
    savings_dollars = total_card_fee - total_btc_fee
    is_onchain_cheaper = savings_dollars > 0
    pct_difference = abs(card_fee_pct - btc_fee_pct)
    
    if is_onchain_cheaper:
        cost_insight = f"On-Chain Bitcoin saves ${savings_dollars:,.2f} in fees compared to Card Settlement ({btc_fee_pct:.3f}% vs {card_fee_pct:.3f}%)."
    else:
        cost_insight = f"Card Rail is ${-savings_dollars:,.2f} cheaper than On-Chain due to high network fee rate relative to amount (Card: {card_fee_pct:.2f}% vs On-Chain: {btc_fee_pct:.2f}%). For sub-dollar scenarios, Layer-2 Lightning settlement is recommended."
        
    speed_insight = f"Bitcoin achieves final settlement in 1 hour (6 confirmations), whereas card network settlement carries 2-5 days clearing duration and up to 90 days chargeback/reversal risk."

    # Return response payload
    return {
        "scenario_id": scenario["id"],
        "scenario_name": scenario["name"],
        "scenario_description": scenario["description"],
        "amount": amount,
        "btc_price": btc_price,
        "sat_per_vbyte": sat_rate,
        "is_live_data": live_btc["is_live"],
        "price_source": "blockchain.info" if live_btc["is_live"] else "fallback",
        "card_rail": {
          "name": scenario["card_rail"]["name"],
          "intermediaries": scenario["card_rail"]["intermediaries"],
          "finality_time_seconds": scenario["card_rail"]["finality_time_seconds"],
          "finality_time_display": scenario["card_rail"]["finality_time_display"],
          "interchange_fee": round(c_interchange, 4),
          "network_fee": round(c_network, 4),
          "acquirer_fee": round(c_acquirer, 4),
          "fx_fee": round(c_fx, 4),
          "flat_fee": round(c_flat, 4),
          "total_fee": round(total_card_fee, 4),
          "fee_percentage": round(card_fee_pct, 4),
          "counterparty_risk": scenario["card_rail"]["counterparty_risk"],
          "governance": scenario["card_rail"]["governance"]
        },
        "on_chain_rail": {
          "name": scenario["on_chain_rail"]["name"],
          "intermediaries": scenario["on_chain_rail"]["intermediaries"],
          "finality_time_seconds": scenario["on_chain_rail"]["finality_time_seconds"],
          "finality_time_display": scenario["on_chain_rail"]["finality_time_display"],
          "sat_rate": sat_rate,
          "tx_size_vbytes": tx_size,
          "total_sats": total_sats,
          "total_fee": round(total_btc_fee, 4),
          "fee_percentage": round(btc_fee_pct, 4),
          "counterparty_risk": scenario["on_chain_rail"]["counterparty_risk"],
          "governance": scenario["on_chain_rail"]["governance"],
          "lightning_alternative": {
            "name": "Lightning Network (L2)",
            "fee": round(ln_fee, 4),
            "fee_percentage": round(ln_fee_pct, 4),
            "finality_time_display": "Instant (<1 sec)"
          }
        },
        "insights": {
          "cost_insight": cost_insight,
          "speed_insight": speed_insight,
          "savings_dollars": round(savings_dollars, 4),
          "fee_ratio": round(card_fee_pct / btc_fee_pct, 2) if btc_fee_pct > 0 else 0.0
        },
        "table_data": df_compare.to_dict(orient="records"),
        "fed_context": base_data.get("fed_study_context", {})
    }

@app.get("/api/mempool")
def read_mempool():
    """Retrieve recommended fees directly from mempool.space"""
    return get_live_bitcoin_data()

@app.get("/api/compare")
def compare_rails(
    use_case: str = Query("retail", description="Options: retail, b2b, cross_border, micropayment"),
    amount: float = Query(None, description="Custom transaction amount in USD"),
    sat_rate: int = Query(None, description="Custom sat/vbyte network rate")
):
    """Retrieve side-by-side comparison for specific use case"""
    base_data = load_base_data()
    scenarios = base_data.get("scenarios", {})
    
    if amount is None:
        amount = scenarios.get(use_case, {}).get("default_amount", 10.0)
        
    return run_pandas_intelligence(use_case, amount, sat_rate)

@app.get("/api/export")
def export_comparison_csv(
    use_case: str = Query("retail"),
    amount: float = Query(None),
    sat_rate: int = Query(None)
):
    """Generates comparison data formatted as CSV for download"""
    base_data = load_base_data()
    scenarios = base_data.get("scenarios", {})
    
    if amount is None:
        amount = scenarios.get(use_case, {}).get("default_amount", 10.0)
        
    res = run_pandas_intelligence(use_case, amount, sat_rate)
    
    # Create rows
    rows = [
        {"Parameter": "Scenario ID", "Card Settlement": res["scenario_id"], "Bitcoin On-Chain": res["scenario_id"]},
        {"Parameter": "Scenario Name", "Card Settlement": res["scenario_name"], "Bitcoin On-Chain": res["scenario_name"]},
        {"Parameter": "Transaction Amount ($)", "Card Settlement": res["amount"], "Bitcoin On-Chain": res["amount"]},
        {"Parameter": "Settlement Rail", "Card Settlement": res["card_rail"]["name"], "Bitcoin On-Chain": res["on_chain_rail"]["name"]},
        {"Parameter": "Total Settlement Fee ($)", "Card Settlement": res["card_rail"]["total_fee"], "Bitcoin On-Chain": res["on_chain_rail"]["total_fee"]},
        {"Parameter": "Effective Fee Rate (%)", "Card Settlement": res["card_rail"]["fee_percentage"], "Bitcoin On-Chain": res["on_chain_rail"]["fee_percentage"]},
        {"Parameter": "Finality Duration", "Card Settlement": res["card_rail"]["finality_time_display"], "Bitcoin On-Chain": res["on_chain_rail"]["finality_time_display"]},
        {"Parameter": "Intermediary Count", "Card Settlement": len(res["card_rail"]["intermediaries"]), "Bitcoin On-Chain": len(res["on_chain_rail"]["intermediaries"])},
        {"Parameter": "Intermediaries List", "Card Settlement": ", ".join(res["card_rail"]["intermediaries"]), "Bitcoin On-Chain": ", ".join(res["on_chain_rail"]["intermediaries"])},
        {"Parameter": "Counterparty Risk", "Card Settlement": res["card_rail"]["counterparty_risk"], "Bitcoin On-Chain": res["on_chain_rail"]["counterparty_risk"]},
        {"Parameter": "Governance / Gatekeepers", "Card Settlement": res["card_rail"]["governance"], "Bitcoin On-Chain": res["on_chain_rail"]["governance"]}
    ]
    
    # Convert to DataFrame
    df = pd.DataFrame(rows)
    
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    
    response = StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv"
    )
    response.headers["Content-Disposition"] = f"attachment; filename=settlement_compare_{use_case}.csv"
    return response

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
