#!/usr/bin/env python3
"""
Backend-level convenience runner for GridForecast.
Enables running `python run.py` directly from inside the `backend/` directory.
"""

import sys
from pathlib import Path

# Add project root to Python module path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

import run

if __name__ == "__main__":
    run.main()
