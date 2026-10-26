import sys
import os
from pathlib import Path

# Add project root to sys.path so backend imports work seamlessly on Vercel
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

# Ensure database path is absolute
os.environ.setdefault("DB_PATH", str(ROOT_DIR / "backend" / "app" / "data" / "grid_forecast.db"))

from backend.app.main import app
