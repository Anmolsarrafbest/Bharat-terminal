"""
BHARAT TERMINAL — Python Backend Server
Entry point: creates Flask app, registers routes, starts background threads.

Structure:
  backend/
    config.py       — All constants, env vars, symbol maps, shared state
    groww_api.py    — Groww API integration
    upstox_api.py   — Upstox API integration
    stock_data.py   — Stock fetching pipeline + saved closes
    news_scraper.py — News RSS + web scraping
    routes.py       — Flask API routes
"""

import time
import threading
from datetime import datetime

from flask import Flask
from flask_cors import CORS

from backend.config import cache_lock, cache
from backend.stock_data import fetch_stock_data, save_market_close, _load_saved_closes, prefill_cache_from_saved_closes
from backend.news_scraper import fetch_news_data
from backend.groww_api import groww_is_configured
from backend.upstox_api import upstox_is_configured
from backend.routes import register_routes


# ═══════════════════════════════════════════
#  FLASK APP
# ═══════════════════════════════════════════

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)
register_routes(app)


def is_market_open():
    """Check if Indian stock market is currently open (9:15 AM - 3:30 PM, Mon-Fri)"""
    now = datetime.now()
    weekday = now.weekday()  # 0=Mon, 6=Sun
    if weekday >= 5:
        return False
    market_start = now.replace(hour=9, minute=15, second=0)
    market_end = now.replace(hour=15, minute=30, second=0)
    return market_start <= now <= market_end


def stock_refresh_loop():
    """Refresh stocks every 30 seconds — only during market hours"""
    while True:
        if is_market_open():
            fetch_stock_data()
            time.sleep(30)
        else:
            time.sleep(60)  # Check every minute when market is closed


def news_refresh_loop():
    """Refresh news every 5 minutes — only during market hours"""
    while True:
        if is_market_open():
            fetch_news_data()
            time.sleep(300)
        else:
            time.sleep(300)


def market_close_saver_loop():
    """Auto-save closing prices at 3:31 PM IST every weekday"""
    saved_today = False
    while True:
        now = datetime.now()
        hour, minute = now.hour, now.minute
        weekday = now.weekday()

        if weekday < 5 and hour == 15 and minute == 31 and not saved_today:
            save_market_close()
            saved_today = True
            print(f"[{now.strftime('%H:%M:%S')}] 🔔 Market closed — saved today's closing prices")
            print(f"[{now.strftime('%H:%M:%S')}] 🛑 Auto-shutting down server...")
            import os as _os
            _os._exit(0)

        if hour == 0:
            saved_today = False

        time.sleep(30)


# ═══════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════

if __name__ == '__main__':
    print("\n  ₹ BHARAT TERMINAL — Python Backend")
    print("  ═══════════════════════════════════")
    print("  ✓ Data sources: Groww → Upstox → Google Finance → yfinance")
    print("  ✓ News: ET, Moneycontrol, Livemint RSS + scraping")
    print("  ✓ Day-over-day tracking via saved_closes.json")
    print("  ✓ Auto-save & shutdown at 3:31 PM IST")

    market_status = "🟢 OPEN" if is_market_open() else "🔴 CLOSED"
    print(f"  ✓ Market status: {market_status}")

    saved = _load_saved_closes()
    if saved:
        print(f"  ✓ Loaded {len(saved)} saved closing prices")
    else:
        print("  ⚠ No saved closes yet — will use API values for first day")
        print("    → Or manually save: http://localhost:5000/api/save-closes")

    if groww_is_configured():
        print("  ✓ Groww API: configured")
    if upstox_is_configured():
        print("  ✓ Upstox API: configured")

    # Pre-fill cache from saved_closes.json so API returns data instantly
    prefill_cache_from_saved_closes()

    # Load cached portfolio (no auto-sync — user triggers via button)
    from backend.portfolio import load_portfolio
    if load_portfolio():
        print("  ✓ Portfolio loaded from cache")
    else:
        print("  ⚠ No portfolio yet → sync via http://localhost:5000/api/portfolio/sync")

    print(f"  ✓ Starting at http://localhost:5000\n")

    # Fetch data once at startup, then let refresh loops handle it
    if is_market_open():
        print("  ⏳ Market is open — fetching live data...\n")
        threading.Thread(target=fetch_stock_data, daemon=True).start()
        threading.Thread(target=fetch_news_data, daemon=True).start()
    else:
        print("  💤 Market is closed — using cached data. Live fetch starts when market opens.\n")

    # Start background threads
    threading.Thread(target=stock_refresh_loop, daemon=True).start()
    threading.Thread(target=news_refresh_loop, daemon=True).start()
    threading.Thread(target=market_close_saver_loop, daemon=True).start()

    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
