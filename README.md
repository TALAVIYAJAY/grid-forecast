# 🌐 GridForecast

> **Renewable Wind Generation Day-Ahead Forecast & Quantitative Error Analytics Platform**  
> Built for UK Wholesale Electricity Procurement & Day-Ahead Trading Desks.  
> Powered by **FastAPI**, **SQLite**, **React 18**, **TypeScript**, **Tailwind CSS**, and **Google Gemini AI**.

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-9%20Passing-brightgreen.svg)]()
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](Dockerfile)
[![AI Integration](https://img.shields.io/badge/AI-Gemini%203.6%20Flash-orange.svg)]()

---

## 🎬 10-Minute Video Walkthrough
* **Unlisted YouTube Video Link:** *[Insert Your Video URL Here]*  
* **Demonstration Breakdown:**
  * **Part 1 (0:00 – 4:30):** Customer Pitch & Trading Console Demonstration (presented to the utility procurement desk).
  * **Part 2 (4:30 – 9:30):** Technical Architecture, Data Pipeline, Math Formulas, and Code Review (presented to the Tech Lead).

---

## 📖 Overview & Business Problem

In the UK wholesale power market, utilities must purchase electricity across **48 half-hour settlement periods** each day. To cover anticipated consumer demand, trading desks place binding financial bids on the **Day-Ahead Auction** (EPEX SPOT / Nord Pool).

Because wind power is weather-dependent, purchase decisions on Day $D-1$ rely heavily on wind generation forecasts:
1. **Auction Gate Closure:** Bids close at **11:00 GMT on D-1**. Any forecast issued after that cutoff could not have been used for the Day-Ahead auction.
2. **Under-Forecasting Risk:** If the forecast under-estimates wind, the utility over-procures expensive thermal (gas/coal) plants unnecessarily.
3. **Over-Forecasting Risk:** If the forecast over-estimates wind, the utility faces a severe supply deficit in real-time, resulting in punitive imbalance cash-out penalties.

**GridForecast** provides an operational trading console and quantitative error benchmark for national wind power across all of **January 2026** using real data from **Elexon BMRS**.

---

## 🚀 Quickstart Guide

### Option 1: One-Command Launch (Recommended)
Run the entire application (Backend + Pre-built React Frontend) with a single command:

```bash
# 1. Clone repository
git clone <repo-url>
cd <repo-folder>

# 2. Setup virtual environment & dependencies
python -m venv backend/venv

# Activate on Windows (PowerShell):
.\backend\venv\Scripts\Activate.ps1
# Or on Linux / macOS:
# source backend/venv/bin/activate

pip install -r backend/requirements.txt

# 3. Launch the all-in-one server
python run.py
```
> **Your browser will automatically open to:** `http://localhost:8000`  
> **Interactive Swagger API Docs:** `http://localhost:8000/docs`

---

### Option 2: Docker / Docker Compose
```bash
docker compose up --build
```
> Access the web dashboard at `http://localhost:8000`.

---

### Option 3: Separate Development Servers (Hot Reloading)

1. **Start Backend (FastAPI on port 8000):**
   ```bash
   .\backend\venv\Scripts\Activate.ps1
   uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

2. **Start Frontend (Vite on port 3000):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   > Access the live UI at `http://localhost:3000`.

---

## 📁 Repository Structure & Directory Map

```
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI application entry & static files mount
│   │   ├── config.py                # App configuration, settings, and env variables
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes.py            # REST endpoints (/evaluation, /dates, /copilot, /export-csv)
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── data_fetcher.py      # Elexon BMRS ingestion service (FUELHH actuals & WINDFOR forecasts)
│   │   │   ├── day_ahead_service.py # D-1 cutoff enforcement & SQL window-function alignment
│   │   │   ├── metrics_engine.py    # Math engine (MAE, RMSE, wMAPE, Mean Bias, Max Deficit)
│   │   │   └── ai_copilot.py        # Gemini 2.5 Flash trading advisory (with rule-based fallback)
│   │   ├── data/
│   │   │   └── grid_forecast.db     # SQLite database with 1,489 actuals & 19,272 forecasts
│   │   └── tests/
│   │       ├── __init__.py
│   │       ├── test_metrics.py      # Unit tests for statistical formulas and zero-error conditions
│   │       └── test_api.py          # API route tests, data assertions, and CSV stream verification
│   └── requirements.txt             # Python backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx           # Brand header, date picker, D-1 gate cutoff selector, tab toggle
│   │   │   ├── MetricCards.tsx      # 6 instant KPI cards (MAE, RMSE, wMAPE, Bias, Deficit, Volume)
│   │   │   ├── ForecastChart.tsx    # 48 settlement periods time-series chart (Actual vs Forecast)
│   │   │   ├── ErrorAnalysisChart.tsx # Error delta distribution chart ((Forecast - Actual) in MW)
│   │   │   ├── DayAheadCopilot.tsx  # Gemini AI Commercial Bidding Memo card
│   │   │   ├── SettlementTable.tsx  # 48 settlement periods data table with status filtering
│   │   │   └── MonthlyBenchmarkView.tsx # Full month January 2026 31-day macro benchmark view
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript interfaces for API contracts
│   │   ├── App.tsx                  # Root React application coordinating state and data fetching
│   │   ├── main.tsx                 # React DOM mount point
│   │   └── index.css                # Tailwind CSS imports & dark-theme styling
│   ├── package.json                 # Frontend dependencies & build scripts
│   ├── vite.config.ts               # Vite configuration with API proxy
│   ├── tailwind.config.js           # Tailwind dark palette styling
│   └── tsconfig.json                # TypeScript strict configuration
├── Dockerfile                       # Multi-stage production build (Node 20 + Python 3.10)
├── docker-compose.yml               # Container deployment configuration
├── run.py                           # Single-command launcher
├── .env.example                     # Environment variables template
├── .gitignore                       # Git exclusions for secrets, venv, node_modules, and cache
├── DOCUMENTATION.md                 # In-depth architectural, mathematical, and domain specification
└── README.md                        # Master project documentation
```

---

## 📊 Quantitative Metrics Formulations

Let $y_i$ be actual delivered wind power and $\hat{y}_i$ be the day-ahead forecast for settlement period $i \in \{1, \dots, N\}$.

| Metric | Formula | Purpose in Power Trading |
| :--- | :--- | :--- |
| **MAE** | $\frac{1}{N}\sum |y_i - \hat{y}_i|$ | Average expected deviation magnitude (MW). |
| **RMSE** | $\sqrt{\frac{1}{N}\sum (y_i - \hat{y}_i)^2}$ | Penalizes large outlier deviations during storm fronts. |
| **wMAPE** | $\frac{\sum |y_i - \hat{y}_i|}{\sum y_i} \times 100\%$ | **Volume-Weighted MAPE:** Standard unweighted MAPE explodes during calm wind periods (division by near-zero). wMAPE provides contractual percentage accuracy. |
| **Forecast Bias** | $\frac{1}{N}\sum (\hat{y}_i - y_i)$ | Identifies structural over-estimation ($>0$) vs under-estimation ($<0$). |

---

## 🤖 Explicit AI Tools Disclosure

As required by the assignment guidelines:
* **AI Coding Assistance:** Google Antigravity (powered by Gemini) was utilized to assist with scaffolding, boilerplate generation, documentation formatting, and unit test structuring.
* **In-App AI Integration:** Google Gemini 3.6 Flash is integrated inside the application via [`backend/app/services/ai_copilot.py`](backend/app/services/ai_copilot.py) to provide automated Day-Ahead trading advisory memos. A deterministic local rules engine is also built-in as an offline fallback.

---

## 🧪 Automated Test Suite

Run the complete test suite:
```bash
python -m pytest backend/app/tests -v
```
**Results:** `9 passed in ~1.6s` (covers mathematical boundary conditions, low-wind wMAPE protection, database integrity, and REST endpoints).

---

## ☁️ Live Cloud Deployment
* **Live Web Application:** *[Insert your Vercel or Render live URL here]*
