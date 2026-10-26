#!/usr/bin/env python3
"""
GridForecast Master Application Runner
Single-command launch for the entire application (Backend + Built Frontend).
"""

import sys
import os
import webbrowser
from pathlib import Path

# Ensure UTF-8 console output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import uvicorn

BASE_DIR = Path(__file__).resolve().parent
DB_FILE = BASE_DIR / "backend" / "app" / "data" / "grid_forecast.db"

def main():
    print("=" * 70)
    print("  GRIDFORECAST: Day-Ahead Wind Forecast & Quantitative Analytics")
    print("  UK Elexon BMRS Benchmark | January 2026")
    print("=" * 70)

    # Ensure database is present
    if not DB_FILE.exists():
        print("[!] Database not detected. Initializing data ingestion...")
        from backend.app.services.data_fetcher import fetch_all_january_2026
        fetch_all_january_2026(str(DB_FILE))
    else:
        print(f"[✓] Database verified: {DB_FILE}")

    print("\n[+] Starting FastAPI Web Application on http://localhost:8000 ...")
    print("[+] Interactive Swagger Docs: http://localhost:8000/docs")
    print("[+] Press Ctrl+C to terminate.\n")

    # Optionally open browser
    try:
        webbrowser.open("http://localhost:8000")
    except Exception:
        pass

    # Run Uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=False)

if __name__ == "__main__":
    main()
