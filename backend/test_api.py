import sys
import os

# Add backend folder to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import main
from fastapi.testclient import TestClient

client = TestClient(main.app)

def test_mempool():
    response = client.get("/api/mempool")
    assert response.status_code == 200
    data = response.json()
    print("Mempool Stats:", data)
    assert "sat_per_vbyte" in data
    assert "btc_price_usd" in data

def test_compare():
    response = client.get("/api/compare?use_case=retail")
    assert response.status_code == 200
    data = response.json()
    print("Compare Retail:", data["scenario_name"], "Amount:", data["amount"])
    assert data["scenario_id"] == "retail"
    assert "card_rail" in data
    assert "on_chain_rail" in data

def test_export():
    response = client.get("/api/export?use_case=retail")
    assert response.status_code == 200
    assert response.headers["Content-Disposition"].startswith("attachment")
    print("Export CSV success, headers:", response.headers)

if __name__ == "__main__":
    print("Starting FastAPI Local Tests...")
    try:
        test_mempool()
        test_compare()
        test_export()
        print("\nSUCCESS: All backend tests passed successfully!")
    except Exception as e:
        print("\nFAILURE: Backend test failed!", str(e))
        sys.exit(1)
