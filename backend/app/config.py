import os
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv

# Locate directories relative to this file
APP_DIR = Path(__file__).resolve().parent
DATA_DIR = APP_DIR / "data"
DB_PATH = DATA_DIR / "grid_forecast.db"

# Load .env if present from project root, backend folder, or current working directory
load_dotenv(APP_DIR.parent.parent / ".env")
load_dotenv(APP_DIR.parent / ".env")
load_dotenv(APP_DIR / ".env")
load_dotenv()

class Settings(BaseModel):
    app_name: str = "GridForecast API"
    app_version: str = "1.0.0"
    debug: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "yes")
    
    # Elexon BMRS endpoint
    elexon_base_url: str = os.getenv(
        "ELEXON_BASE_URL", 
        "https://data.elexon.co.uk/bmrs/api/v1/datasets"
    )
    
    # Database
    db_path: str = os.getenv("DB_PATH", str(DB_PATH))
    
    # Default UK Day-Ahead Auction Gate Closure (11:00 GMT on D-1)
    default_gate_closure_hour: int = int(os.getenv("DEFAULT_GATE_CLOSURE_HOUR", "11"))
    
    # AI Copilot configuration
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    
    # CORS
    cors_origins: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*"
    ]

settings = Settings()
