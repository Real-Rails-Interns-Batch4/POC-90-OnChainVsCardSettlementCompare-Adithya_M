import os
import json
import time
import requests

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
SUMMARY_PATH = os.path.join(DATA_DIR, "ingested_data_summary.json")

def ensure_data_dir():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)

def load_json_file(file_path):
    try:
        if os.path.exists(file_path):
            with open(file_path, "r") as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
    return None

def fetch_mempool_live_data():
    """
    Fetches real-time recommended fees and block tips from mempool.space.
    Falls back to safe default metrics if external API is unreachable or times out.
    """
    stats = {
        "sat_per_vbyte_hour": 25,
        "sat_per_vbyte_half_hour": 28,
        "sat_per_vbyte_fastest": 35,
        "sat_per_vbyte_minimum": 10,
        "tip_block_height": 845000,
        "mempool_unconfirmed_tx_count": 185200,
        "is_live": False,
        "timestamp": int(time.time()),
        "error": None
    }
    
    # 1. Fetch recommended fees
    try:
        r = requests.get("https://mempool.space/api/v1/fees/recommended", timeout=3)
        if r.status_code == 200:
            fees = r.json()
            stats["sat_per_vbyte_hour"] = fees.get("hourFee", 25)
            stats["sat_per_vbyte_half_hour"] = fees.get("halfHourFee", 28)
            stats["sat_per_vbyte_fastest"] = fees.get("fastestFee", 35)
            stats["sat_per_vbyte_minimum"] = fees.get("minimumFee", 10)
            stats["is_live"] = True
    except Exception as e:
        stats["error"] = f"Mempool recommended fees API error: {str(e)}"
        
    # 2. Fetch block tip height
    try:
        r = requests.get("https://mempool.space/api/blocks/tip/height", timeout=3)
        if r.status_code == 200:
            stats["tip_block_height"] = int(r.text.strip())
            stats["is_live"] = stats["is_live"] and True
    except Exception as e:
        err_msg = f"Mempool block tip API error: {str(e)}"
        stats["error"] = (stats["error"] + " | " + err_msg) if stats["error"] else err_msg

    # 3. Fetch general mempool size statistics
    try:
        r = requests.get("https://mempool.space/api/mempool", timeout=3)
        if r.status_code == 200:
            mempool_info = r.json()
            stats["mempool_unconfirmed_tx_count"] = mempool_info.get("count", 185200)
            stats["is_live"] = stats["is_live"] and True
    except Exception as e:
        err_msg = f"Mempool queue stats API error: {str(e)}"
        stats["error"] = (stats["error"] + " | " + err_msg) if stats["error"] else err_msg
        
    return stats

def run_ingestion_pipeline():
    """
    Ingests and aggregates data from mempool.space, Federal Reserve Payments Study, and BIS Red Book.
    """
    ensure_data_dir()
    
    # 1. Ingest mempool.space data
    print("Ingesting mempool.space live stats...")
    mempool_data = fetch_mempool_live_data()
    
    # 2. Ingest Federal Reserve Payments Study data
    print("Ingesting Federal Reserve Payments Study database...")
    fed_path = os.path.join(DATA_DIR, "fed_payments_study.json")
    fed_data = load_json_file(fed_path)
    
    # 3. Ingest BIS CPMI / Red Book data
    print("Ingesting BIS CPMI Red Book database...")
    bis_path = os.path.join(DATA_DIR, "bis_cpmi_redbook.json")
    bis_data = load_json_file(bis_path)
    
    # Consolidated schema
    consolidated = {
        "mempool_stats": mempool_data,
        "federal_reserve_payments_study": fed_data,
        "bis_cpmi_redbook": bis_data,
        "last_ingested_timestamp": int(time.time())
    }
    
    # Save cache summary
    try:
        with open(SUMMARY_PATH, "w") as f:
            json.dump(consolidated, f, indent=2)
        print(f"Data ingestion pipeline completed. Consolidated file saved at: {SUMMARY_PATH}")
        return consolidated
    except Exception as e:
        print(f"Failed to write ingested data summary: {e}")
        return None

if __name__ == "__main__":
    run_ingestion_pipeline()
