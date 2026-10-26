"""
Elexon BMRS Data Fetcher & Ingestion Service
Fetches Actual Wind Generation (FUELHH) and Forecasted Wind Generation (WINDFOR)
for January 2026 and stores them in SQLite with high-performance indices.
"""

import os
import sys
import json
import sqlite3
import logging
from datetime import datetime, timedelta, timezone
import urllib.request
import urllib.error

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_PATH = os.path.join(DATA_DIR, "grid_forecast.db")

ELEXON_BASE = "https://data.elexon.co.uk/bmrs/api/v1/datasets"

def init_db(db_path: str = DB_PATH):
    """Initialize the SQLite database schema with indexes."""
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS actual_generation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        start_time TEXT NOT NULL,
        publish_time TEXT,
        settlement_date TEXT NOT NULL,
        settlement_period INTEGER NOT NULL,
        generation REAL NOT NULL,
        UNIQUE(start_time, settlement_period)
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS forecast_generation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        start_time TEXT NOT NULL,
        publish_time TEXT NOT NULL,
        generation REAL NOT NULL,
        UNIQUE(start_time, publish_time)
    )
    """)

    cur.execute("CREATE INDEX IF NOT EXISTS idx_actual_start ON actual_generation(start_time)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_actual_date ON actual_generation(settlement_date)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_forecast_start ON forecast_generation(start_time)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_forecast_pub ON forecast_generation(publish_time)")

    conn.commit()
    conn.close()
    logger.info("Initialized database schema at %s", db_path)

def fetch_json(url: str, timeout: int = 30):
    """Fetch JSON from URL with User-Agent header and retries."""
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    req = urllib.request.Request(url, headers=headers)
    for attempt in range(1, 4):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = resp.read().decode("utf-8")
                return json.loads(data)
        except Exception as e:
            logger.warning("Attempt %d failed for %s: %s", attempt, url, e)
            if attempt == 3:
                raise

def ingest_actuals_chunk(start_dt: datetime, end_dt: datetime, conn: sqlite3.Connection):
    """Fetch and ingest actuals (FUELHH for WIND) between start_dt and end_dt."""
    from_str = start_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    to_str = end_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    url = f"{ELEXON_BASE}/FUELHH/stream?publishDateTimeFrom={from_str}&publishDateTimeTo={to_str}"
    
    logger.info("Fetching FUELHH from %s to %s...", from_str, to_str)
    records = fetch_json(url)
    
    wind_records = [r for r in records if r.get("fuelType") == "WIND"]
    cur = conn.cursor()
    inserted = 0
    for r in wind_records:
        start_time = r.get("startTime")
        publish_time = r.get("publishTime")
        settlement_date = r.get("settlementDate")
        settlement_period = r.get("settlementPeriod")
        gen = float(r.get("generation", 0))

        cur.execute("""
        INSERT INTO actual_generation (start_time, publish_time, settlement_date, settlement_period, generation)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(start_time, settlement_period) DO UPDATE SET
            generation = excluded.generation,
            publish_time = excluded.publish_time
        """, (start_time, publish_time, settlement_date, settlement_period, gen))
        inserted += 1

    conn.commit()
    logger.info("Ingested %d actual WIND records (total FUELHH returned: %d)", inserted, len(records))
    return inserted

def ingest_forecasts_chunk(start_dt: datetime, end_dt: datetime, conn: sqlite3.Connection):
    """Fetch and ingest forecasts (WINDFOR) between start_dt and end_dt."""
    from_str = start_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    to_str = end_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    url = f"{ELEXON_BASE}/WINDFOR/stream?publishDateTimeFrom={from_str}&publishDateTimeTo={to_str}"
    
    logger.info("Fetching WINDFOR from %s to %s...", from_str, to_str)
    records = fetch_json(url)
    cur = conn.cursor()
    inserted = 0
    for r in records:
        start_time = r.get("startTime")
        publish_time = r.get("publishTime")
        gen = float(r.get("generation", 0))

        cur.execute("""
        INSERT INTO forecast_generation (start_time, publish_time, generation)
        VALUES (?, ?, ?)
        ON CONFLICT(start_time, publish_time) DO UPDATE SET
            generation = excluded.generation
        """, (start_time, publish_time, gen))
        inserted += 1

    conn.commit()
    logger.info("Ingested %d WINDFOR records", inserted)
    return inserted

def fetch_all_january_2026(db_path: str = DB_PATH):
    """Fetch all actuals and forecasts relevant to January 2026."""
    init_db(db_path)
    conn = sqlite3.connect(db_path)

    # 1. Fetch Actuals from 2026-01-01 to 2026-02-01 in 3-day steps
    start = datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
    end = datetime(2026, 2, 1, 0, 0, 0, tzinfo=timezone.utc)
    step = timedelta(days=3)

    curr = start
    while curr < end:
        next_curr = min(curr + step, end)
        ingest_actuals_chunk(curr, next_curr, conn)
        curr = next_curr

    # 2. Fetch Forecasts from 2025-12-30 to 2026-02-01 in 2-day steps
    # (To include Day-Ahead forecasts published on Dec 30 & 31 for Jan 1st)
    f_start = datetime(2025, 12, 30, 0, 0, 0, tzinfo=timezone.utc)
    f_end = datetime(2026, 2, 1, 0, 0, 0, tzinfo=timezone.utc)
    f_step = timedelta(days=2)

    curr = f_start
    while curr < f_end:
        next_curr = min(curr + f_step, f_end)
        ingest_forecasts_chunk(curr, next_curr, conn)
        curr = next_curr

    # Count totals
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM actual_generation")
    actuals_cnt = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM forecast_generation")
    forecasts_cnt = cur.fetchone()[0]
    conn.close()

    logger.info("DATA INGESTION COMPLETE! Total Actuals: %d, Total Forecasts: %d", actuals_cnt, forecasts_cnt)

if __name__ == "__main__":
    fetch_all_january_2026()
