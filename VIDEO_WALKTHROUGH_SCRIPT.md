# 🎬 Video Demo Walkthrough Script (Max 10 Minutes)

> **Challenge Requirement:** A 2-part unlisted YouTube video (max 10 minutes total).  
> **Evaluation Priority:** *"Our evaluation will start with the video. Hence, please don’t submit without this video."*

---

## ⏱️ Video Structure Overview

| Segment | Audience | Target Duration | Focus |
| :--- | :--- | :--- | :--- |
| **Part 1** | **The Utility Client** (Power Procurement / Trading Desk) | **4:30 mins** | Business value, decision clarity, live dashboard tour, risk mitigation, and commercial ROI. |
| **Part 2** | **The Technical Lead / CTO** (Engineering Review) | **4:30 mins** | Architecture, data pipeline, cutoff logic, metrics math, Gemini AI, testing, and Docker. |
| **Wrap-Up** | Both / Summary | **0:30 min** | Final takeaways and submission links. |

---

# 🎙️ PART 1: Customer Presentation & Product Pitch (0:00 – 4:30)

> **Your Persona:** Lead Product Engineer presenting the pilot outcome to the UK Energy Utility Trading Desk.  
> **Screen to Share:** Browser open at `http://localhost:8000` (GridForecast Trading Console).

---

### [0:00 – 0:45] The Hook & The Problem Context
* **What you say:**
  > *"Hello everyone! Today, I am excited to present the pilot release of **GridForecast**—a customized decision-intelligence console built specifically for your day-ahead power procurement desk.*  
  > 
  > *As a UK energy utility, your team faces a daily financial dilemma: you must purchase wholesale electricity from the day-ahead auction (such as EPEX SPOT) to meet customer demand for all 48 half-hour settlement periods tomorrow. Because renewable wind generation is weather-dependent, your day-ahead bids rely entirely on wind forecasts.  
  > 
  > *If the forecast over-estimates wind output, you under-procure in the day-ahead market and face punishing cash-out penalties in the Balancing Mechanism. If it under-estimates wind, you commit expensive thermal plants unnecessarily. GridForecast was designed to solve this exact problem: giving your traders crystal-clear visibility into day-ahead forecasts at the exact auction gate closure, and quantitatively benchmarking forecast errors so you can place risk-adjusted bids with confidence."*

---

### [0:45 – 2:00] Live Walkthrough: Day-Ahead Operational Console
* **Screen Action:** Show the top header. Select `2026-01-15` from the date picker. Point to the `11:00 GMT` gate closure cutoff.
* **What you say:**
  > *"Let's look at the live portal. Up top, we can navigate through all 31 delivery days of **January 2026**.  
  > 
  > *Notice our **D-1 Gate Closure selector**. In the UK market, day-ahead auction bids close at **11:00 GMT on D-1**. GridForecast strictly filters out any forecast published after that cutoff, ensuring your traders see the exact data that was available when decisions were legally committed.  
  > 
  > *Immediately below, your desk has **6 instant KPI cards**:  
  > 1. **MAE (Mean Absolute Error):** 1,110 MW for January 15th—showing your expected deviation per settlement period.  
  > 2. **RMSE:** 1,229 MW—measuring volatility and penalizing large swings.  
  > 3. **Volume wMAPE:** 10.5%—a high-accuracy day well within commercial tolerances.  
  > 4. **Forecast Bias:** -561 MW. Notice the status badge: **UNDER-ESTIMATING**. The forecast systematically predicted less wind than was delivered, warning your team not to over-commit thermal baseload.  
  > 5. **Peak Deficit Risk:** Highlights the largest single-period shortfall (1,794 MW) so you know your maximum exposure.  
  > 6. **Delivered Volume:** Comparing 293 GWh actual delivered against 266 GWh forecasted."*

---

### [2:00 – 3:15] Time Series Overlay & Error Delta Visualizer
* **Screen Action:** Hover over the main **Forecast vs Actual** chart, showing the tooltip values. Then scroll down to the **Error Distribution Bar Chart**.
* **What you say:**
  > *"Next, we have the interactive **48 Half-Hourly Settlement Periods Chart**.  
  > The solid cyan line represents ground-truth actual wind generation delivered to the UK grid from Elexon BMRS. The dashed amber line is the day-ahead forecast locked in at gate closure.  
  > 
  > *Traders can hover over any settlement period—for instance, Settlement Period 24 at 11:30 UTC—to instantly inspect the exact actual generation, day-ahead forecast, and the error delta. We also provide one-click visibility toggles to isolate actuals or forecasts.  
  > 
  > *Below this, our **Error Distribution Chart** isolates the delta: $(Forecast - Actual)$. Amber bars show surplus forecasts, while red bars show deficit risks. On this day, 37 out of 48 periods were under-forecasted, giving traders immediate visual confirmation of the day's structural bias."*

---

### [3:15 – 4:00] AI Day-Ahead Trading Copilot
* **Screen Action:** Point to the **AI Day-Ahead Procurement Advisory** card with the Gemini AI badge.
* **What you say:**
  > *"One of our flagship capabilities is the **AI Day-Ahead Bidding Copilot**, powered by Google Gemini 2.5 Flash. Rather than expecting a trader to manually compute statistical distributions, our AI analyzes the metrics, identifies the highest-risk settlement periods, and provides an executive trading memo:  
  > 
  > *Here, it flags a **MODERATE RISK**, highlights that actual generation exceeded day-ahead predictions, and gives actionable bidding advice: shave conservative safety margins and retain flexible peaking reserves rather than locking in expensive thermal baseload on day-ahead.  
  > 
  > *Finally, clicking the **48 Settlement Periods Ledger** opens the complete tabular audit trail, complete with a one-click **Export CSV** button for your quantitative modeling pipelines."*

---

### [4:00 – 4:30] January 2026 Monthly Benchmark View
* **Screen Action:** Click the **January 2026 Benchmark** tab in the header. Show the 31-day bar chart.
* **What you say:**
  > *"For executive leadership and risk committees, switching to the **January 2026 Benchmark** tab presents the whole-month evaluation. Across all 1,488 settlement periods in January, national wind delivered a monthly MAE of 2,126 MW and an aggregate wMAPE of 18.4%.  
  > 
  > *Traders can immediately spot anomalous weather days—like storm deviations on high-wind days—and click any bar to drill right down into that day's 48 settlement periods.  
  > 
  > *This concludes our customer presentation. GridForecast turns volatile weather forecasts into clear, profitable day-ahead trading decisions."*

---

# 🛠️ PART 2: Technical Lead Architecture & Codebase Review (4:30 – 9:30)

> **Your Persona:** Lead Software Engineer explaining the architecture, code structure, mathematics, and design practices to the internal Tech Lead / CTO.  
> **Screen to Share:** VS Code / Codebase + Terminal.

---

### [4:30 – 5:30] System Architecture & Directory Organization
* **Screen Action:** Show project directory tree in terminal or editor.
* **What you say:**
  > *"Now switching gears to the technical review. Let's walk through the architecture, design choices, data pipeline, and software engineering practices.  
  > 
  > *The codebase follows a modular clean-architecture pattern:  
  > * In `backend/`: We built a high-performance **FastAPI** service in Python 3.10. We chose FastAPI for its asynchronous I/O, automatic Pydantic data validation, high throughput, and automatic Swagger OpenAPI documentation at `/docs`.  
  > * In `frontend/`: We built a single-page application using **React 18, TypeScript, and Vite**, styled with **Tailwind CSS**, and utilizing **Recharts** for responsive time-series visualization.  
  > * Persistence: We use an indexed **SQLite** database storing raw actuals and forecasts, allowing the entire application to run self-contained without requiring heavy external database services."*

---

### [5:30 – 6:45] Data Ingestion & Day-Ahead Cutoff Engine
* **Screen Action:** Open [`backend/app/services/data_fetcher.py`](file:///D:/Django/FORECAST/backend/app/services/data_fetcher.py) and [`backend/app/services/day_ahead_service.py`](file:///D:/Django/FORECAST/backend/app/services/day_ahead_service.py).
* **What you say:**
  > *"Let's look at the data ingestion in `data_fetcher.py`. We stream data from two official Elexon BMRS endpoints:  
  > 1. `FUELHH/stream` for actual wind generation, filtering by `fuelType == 'WIND'`.  
  > 2. `WINDFOR/stream` for forecasted generation.  
  > 
  > *We indexed `startTime`, `publishTime`, and `settlementDate` in SQLite.  
  > 
  > *Now, the most critical domain design in `day_ahead_service.py`: **The Day-Ahead Cutoff Logic**.  
  > Multiple forecasts are published over time for any given settlement period. For delivery date $D$, day-ahead bids close on $D-1$ at gate closure (default 11:00 GMT). Any forecast published after 11:00 GMT was inaccessible to the trader.  
  > 
  > *To execute this at scale, we use a SQL Window Function:  
  > We query `forecast_generation` where `publish_time <= cutoff_iso`, partition by `start_time`, and use `ROW_NUMBER() OVER (ORDER BY publish_time DESC)` to pull the exact latest forecast available before cutoff in **under 5 milliseconds** across all 48 periods. We also handle resolution alignment, since Elexon WINDFOR forecasts are hourly while actuals are half-hourly."*

---

### [6:45 – 7:45] Quantitative Evaluation Mathematics
* **Screen Action:** Open [`backend/app/services/metrics_engine.py`](file:///D:/Django/FORECAST/backend/app/services/metrics_engine.py).
* **What you say:**
  > *"In `metrics_engine.py`, we implement the standard quantitative power market metrics:  
  > 
  > * **MAE and RMSE:** We calculate mean absolute error and root mean square error to track expected deviation and variance.  
  > * **Volume-Weighted MAPE (wMAPE):** In power systems, standard unweighted MAPE ($\sum |y - \hat{y}| / y$) is hazardous because during calm, low-wind periods where generation drops near zero, the percentage explodes toward infinity. We implemented **wMAPE**, defined as total absolute error divided by total actual energy generation. This provides a robust, volume-weighted percentage metric standard in utility contracts.  
  > * **Forecast Bias:** We calculate mean error $(Forecast - Actual)$. A positive bias represents systematic over-forecasting, while a negative bias indicates under-forecasting."*

---

### [7:45 – 8:45] AI Copilot & Resilient Fallback Architecture
* **Screen Action:** Open [`backend/app/services/ai_copilot.py`](file:///D:/Django/FORECAST/backend/app/services/ai_copilot.py).
* **What you say:**
  > *"For AI integration, we implemented `ai_copilot.py` using the official `google-genai` SDK with **Gemini 2.5 Flash**.  
  > 
  > *We provide strict prompt schemas requiring structured JSON outputs containing headline, risk tier, and commercial bidding guidance.  
  > 
  > *Crucially, we applied **defensive software engineering**: if the user does not have a Gemini API key or encounters network throttling, the system automatically falls back to an internal **Deterministic Power Rules Engine**. The frontend never crashes, never throws an unhandled error, and always receives valid data."*

---

### [8:45 – 9:30] Testing, Dockerization & Code Quality
* **Screen Action:** Run pytest in terminal: `python -m pytest backend/app/tests -v`. Show all 9 passing tests. Then briefly show `Dockerfile` and `docker-compose.yml`.
* **What you say:**
  > *"To ensure code quality and prevent regressions, we built an automated test suite with **pytest**. Running pytest shows all **9 tests passing in under 2 seconds**, covering boundary conditions, zero-error validation, calm-wind handling, and endpoint integrity.  
  > 
  > *For deployment, we created a **multi-stage Dockerfile**: Stage 1 compiles the React frontend assets with Node 20, and Stage 2 runs the lightweight Python 3.10 runtime serving both the API and frontend statically. A single `docker compose up --build` or `python run.py` launches the entire production application seamlessly.  
  > 
  > *The code is formatted cleanly, typed strictly with Pydantic and TypeScript, and ready for production deployment on Vercel or cloud containers."*

---

### [9:30 – 10:00] Closing & Summary (Both Audiences)
* **What you say:**
  > *"In summary, GridForecast bridges real-world power trading economics with production software engineering: resilient data pipelines, quantitative error metrics, AI-assisted decision support, and a high-performance modern UI.  
  > 
  > *Thank you for your time, and I look forward to your feedback and questions during the interview!*"*

---
*(End of Video)*
