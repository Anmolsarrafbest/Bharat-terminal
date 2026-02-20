# ₹ BHARAT TERMINAL

A Bloomberg-style financial terminal for the Indian market. Track live stock prices, indices, commodities, and market-moving news — all in one dashboard.

![Dashboard](https://img.shields.io/badge/Status-Active-brightgreen) ![Python](https://img.shields.io/badge/Python-3.8+-blue) ![Node.js](https://img.shields.io/badge/Node.js-16+-green)

---

## Features

- **Live Market Data** — NIFTY 50, SENSEX, Bank Nifty, India VIX
- **58+ Stock Tracking** — Real-time prices with day-over-day gain/loss
- **Multi-Source Pipeline** — Groww → Upstox → Google Finance → yfinance
- **Market News** — RSS + web scraping from ET, Moneycontrol, Livemint
- **Portfolio Tracker** — Track your holdings, P&L, and sector allocation
- **Commodities & Forex** — Gold, Silver, Crude Oil, USD/INR, EUR/INR
- **FII/DII Activity** — Foreign & domestic institutional investor flows
- **Auto-Save Closes** — Persists daily closing prices for accurate tracking
- **Auto-Shutdown** — Server saves data and shuts down at 3:31 PM IST

---

## Project Structure

```
india-terminal/
├── app_server.py          ← Python backend entry point (port 5000)
├── server.js              ← Node.js proxy server (port 3000)
├── index.html             ← Main dashboard UI
├── app.js                 ← Frontend logic
├── style.css              ← Styling
├── backend/
│   ├── config.py          ← Constants, env vars, symbol maps
│   ├── groww_api.py       ← Groww API integration
│   ├── upstox_api.py      ← Upstox API integration
│   ├── stock_data.py      ← Stock fetch pipeline + saved closes
│   ├── news_scraper.py    ← News RSS + web scraping
│   └── routes.py          ← Flask API routes
├── start.bat              ← Start all servers
├── close.bat              ← Stop all servers
├── .env                   ← API credentials (not committed)
├── saved_closes.json      ← Persisted closing prices (not committed)
└── requirements.txt       ← Python dependencies
```

---

## Setup

### Prerequisites

- **Python 3.8+** with `pip`
- **Node.js 16+** with `npm`

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd india-terminal

# Install Node.js dependencies
npm install

# Create Python virtual environment
python -m venv venv

# Activate venv
.\venv\Scripts\activate     # Windows
source venv/bin/activate    # Mac/Linux

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Configure API Keys

Copy `.env.example` to `.env` and fill in your credentials:

```env
# Groww API (primary data source)
GROWW_API_KEY=your_groww_api_key
GROWW_API_SECRET=your_groww_secret

# Upstox API (optional, requires daily login)
UPSTOX_API_KEY=your_upstox_key
UPSTOX_API_SECRET=your_upstox_secret
UPSTOX_REDIRECT_URI=http://localhost:5000/callback
```

> **Note:** The app works without API keys using Google Finance + yfinance as fallbacks, but Groww provides the most accurate real-time data.

### 3. Start the App

```bash
.\start.bat
```

Open **http://localhost:3000** in your browser.

### 4. Stop the App

```bash
.\close.bat
```

Or the server auto-shuts down at **3:31 PM IST** (after market close).

---

## Data Sources (Priority Order)

| Priority | Source          | Auth Required | Speed    |
|----------|---------------|--------------|----------|
| 1        | Groww API      | API Key      | Real-time |
| 2        | Upstox API     | OAuth + Daily Login | Real-time |
| 3        | Google Finance | None         | ~1 min delay |
| 4        | yfinance       | None         | ~2 min delay |

---

## API Endpoints

| Endpoint              | Description                     |
|----------------------|--------------------------------|
| `GET /api/quote`     | Stock quotes (Yahoo-compatible) |
| `GET /api/indices`   | Index data (NIFTY, SENSEX, etc) |
| `GET /api/commodities` | Commodity prices              |
| `GET /api/news`      | Market news headlines           |
| `GET /api/status`    | Server status                   |
| `GET /api/data-sources` | Data source status            |
| `GET /api/save-closes` | Manually save closing prices  |
| `GET /upstox/login`  | Start Upstox OAuth flow         |

---

## Environment Variables

| Variable              | Required | Description               |
|----------------------|----------|--------------------------|
| `GROWW_API_KEY`      | Optional | Groww API key              |
| `GROWW_API_SECRET`   | Optional | Groww API secret           |
| `UPSTOX_API_KEY`     | Optional | Upstox API key             |
| `UPSTOX_API_SECRET`  | Optional | Upstox API secret          |
| `UPSTOX_REDIRECT_URI`| Optional | OAuth callback URL        |
| `UPSTOX_ACCESS_TOKEN`| Auto     | Auto-filled after login    |

---

## License

MIT
