"""
BHARAT TERMINAL — Stock Data Fetching
Pipeline: Groww → Upstox → Google Finance → yfinance
Includes saved closes for day-over-day tracking.
"""

import os
import json
import time
import traceback
import concurrent.futures
from datetime import datetime

import yfinance as yf
import requests as req_lib
from bs4 import BeautifulSoup

from .config import (
    NIFTY50_SYMBOLS, INDEX_SYMBOLS, COMMODITY_SYMBOLS, GOOGLE_FINANCE_MAP,
    UPSTOX_STOCK_MAP, HEADERS, SAVED_CLOSES_FILE, cache, cache_lock,
)
from .groww_api import groww_is_configured, groww_fetch_all
from .upstox_api import upstox_is_configured, upstox_has_token, upstox_fetch_indices, upstox_fetch_stocks


# ═══════════════════════════════════════════
#  GOOGLE FINANCE SCRAPER
# ═══════════════════════════════════════════

def _fetch_from_google_finance(symbol):
    """Scrape price data from Google Finance as backup source"""
    if symbol in GOOGLE_FINANCE_MAP:
        gf_sym = GOOGLE_FINANCE_MAP[symbol]
    elif symbol.endswith('.NS'):
        gf_sym = symbol.replace('.NS', '') + ':NSE'
    else:
        return None

    try:
        url = f'https://www.google.com/finance/quote/{gf_sym}'
        r = req_lib.get(url, headers=HEADERS, timeout=8)
        if r.status_code != 200:
            return None

        soup = BeautifulSoup(r.text, 'lxml')
        price_el = soup.select_one('[data-last-price]')
        if not price_el:
            return None

        price = float(price_el['data-last-price'])
        prev_str = price_el.get('data-previous-close', '')
        prev_close = float(prev_str) if prev_str else None

        if price and prev_close:
            chg = round(price - prev_close, 2)
            chgP = round((chg / prev_close * 100), 2)
            return {
                'symbol': symbol,
                'shortName': symbol,
                'regularMarketPrice': round(price, 2),
                'regularMarketPreviousClose': round(prev_close, 2),
                'regularMarketChange': chg,
                'regularMarketChangePercent': chgP,
            }
    except Exception as e:
        print(f"  ⚠ Google Finance error ({symbol}): {e}")
    return None


# ═══════════════════════════════════════════
#  YFINANCE FETCHER
# ═══════════════════════════════════════════

def _fetch_single_ticker(sym):
    """Fetch a single ticker's data — uses fast_info for accurate live data"""
    try:
        t = yf.Ticker(sym)

        try:
            fi = t.fast_info
            curr = round(float(fi.last_price), 2)
            prev = round(float(fi.previous_close), 2) if hasattr(fi, 'previous_close') and fi.previous_close else None

            if curr and prev and prev > 0:
                chg = round(curr - prev, 2)
                chgP = round((chg / prev * 100), 2)

                return sym, {
                    'symbol': sym,
                    'shortName': sym.replace('.NS', '').replace('=X', ''),
                    'regularMarketPrice': curr,
                    'regularMarketChange': chg,
                    'regularMarketChangePercent': chgP,
                    'regularMarketPreviousClose': prev,
                    'fiftyTwoWeekHigh': getattr(fi, 'year_high', None),
                    'fiftyTwoWeekLow': getattr(fi, 'year_low', None),
                    'marketCap': getattr(fi, 'market_cap', None),
                }
        except Exception:
            pass

        hist = t.history(period='5d')
        if hist.empty or len(hist) < 1:
            return sym, None
        curr = round(float(hist['Close'].iloc[-1]), 2)
        prev = round(float(hist['Close'].iloc[-2]), 2) if len(hist) >= 2 else curr
        chg = round(curr - prev, 2)
        chgP = round((chg / prev * 100), 2) if prev else 0

        extra = {}
        try:
            fi = t.fast_info
            extra['fiftyTwoWeekHigh'] = getattr(fi, 'year_high', None)
            extra['fiftyTwoWeekLow'] = getattr(fi, 'year_low', None)
            extra['marketCap'] = getattr(fi, 'market_cap', None)
        except:
            pass

        return sym, {
            'symbol': sym,
            'shortName': sym.replace('.NS', '').replace('=X', ''),
            'regularMarketPrice': curr,
            'regularMarketChange': chg,
            'regularMarketChangePercent': chgP,
            'regularMarketPreviousClose': prev,
            'fiftyTwoWeekHigh': extra.get('fiftyTwoWeekHigh'),
            'fiftyTwoWeekLow': extra.get('fiftyTwoWeekLow'),
            'marketCap': extra.get('marketCap'),
        }
    except Exception:
        return sym, None


# ═══════════════════════════════════════════
#  SAVED CLOSES (day-over-day tracking)
# ═══════════════════════════════════════════

def _load_saved_closes():
    """Load yesterday's closing prices from file"""
    try:
        if os.path.exists(SAVED_CLOSES_FILE):
            with open(SAVED_CLOSES_FILE, 'r') as f:
                data = json.load(f)
                return data.get('prices', {})
    except Exception as e:
        print(f"  ⚠ Error loading saved closes: {e}")
    return {}


def _save_closes(prices):
    """Save today's closing prices to file"""
    try:
        data = {
            'date': datetime.now().strftime('%Y-%m-%d'),
            'time': datetime.now().strftime('%H:%M:%S'),
            'prices': prices,
        }
        with open(SAVED_CLOSES_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] 💾 Saved {len(prices)} closing prices to saved_closes.json")
    except Exception as e:
        print(f"  ⚠ Error saving closes: {e}")


def save_market_close():
    """Save current prices as today's close (called at 3:31 PM IST)"""
    with cache_lock:
        live_prices = cache.get('_live_prices', {})
    if live_prices:
        _save_closes(live_prices)
    else:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] ⚠ No live prices to save at market close")


def prefill_cache_from_saved_closes():
    """Pre-populate cache with saved_closes.json so frontend sees data instantly on startup"""
    saved = _load_saved_closes()
    if not saved:
        return 0

    quotes = {}
    indices = {}
    commodities = {}

    for sym, price in saved.items():
        if price <= 0:
            continue

        entry = {
            'symbol': sym,
            'shortName': sym.replace('.NS', '').replace('=X', '').replace('^', ''),
            'regularMarketPrice': price,
            'regularMarketPreviousClose': price,
            'regularMarketChange': 0,
            'regularMarketChangePercent': 0,
        }

        # Classify into indices, commodities, or stocks
        idx_name = None
        for name, idx_sym in INDEX_SYMBOLS.items():
            if sym == idx_sym:
                idx_name = name
                break

        if idx_name:
            indices[idx_name] = {
                'val': price, 'prev': price, 'chg': 0, 'chgP': 0,
            }
        elif sym in COMMODITY_SYMBOLS:
            commodities[sym] = {
                'name': COMMODITY_SYMBOLS[sym],
                'val': price, 'chg': 0, 'chgP': 0,
            }
        elif sym in NIFTY50_SYMBOLS:
            quotes[sym] = entry

    with cache_lock:
        cache['quotes'] = quotes
        cache['indices'] = indices
        cache['commodities'] = commodities
        cache['last_stock_update'] = datetime.now().isoformat()

    total = len(quotes) + len(indices) + len(commodities)
    print(f"  ✓ Pre-filled cache with {total} symbols from saved_closes.json")
    return total


# ═══════════════════════════════════════════
#  MAIN FETCH PIPELINE
# ═══════════════════════════════════════════

def fetch_stock_data():
    """Fetch all stock quotes using the priority pipeline"""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] 📈 Fetching stock data...")
    start = time.time()

    all_symbols = NIFTY50_SYMBOLS + list(INDEX_SYMBOLS.values()) + list(COMMODITY_SYMBOLS.keys())

    try:
        results = {}
        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:
            futures = {pool.submit(_fetch_single_ticker, sym): sym for sym in all_symbols}
            for future in concurrent.futures.as_completed(futures, timeout=60):
                try:
                    sym, data = future.result()
                    if data:
                        results[sym] = data
                except:
                    pass

        # ── PRIORITY 0: Groww API ──
        if groww_is_configured():
            print(f"[{datetime.now().strftime('%H:%M:%S')}] 🟢 Fetching from Groww API...")
            groww_indices, groww_stocks = groww_fetch_all()
            if groww_indices:
                for sym, data in groww_indices.items():
                    results[sym] = {**results.get(sym, {}), **data}
                print(f"  ✓ Groww: Got {len(groww_indices)} indices")
            if groww_stocks:
                for sym, data in groww_stocks.items():
                    results[sym] = {**results.get(sym, {}), **data}
                print(f"  ✓ Groww: Got {len(groww_stocks)} stocks")

        # ── PRIORITY 1: Upstox API ──
        if upstox_is_configured() and upstox_has_token():
            print(f"[{datetime.now().strftime('%H:%M:%S')}] 🏆 Fetching from Upstox API...")
            upstox_idx = upstox_fetch_indices()
            upstox_stk = upstox_fetch_stocks()
            if upstox_idx:
                for sym, data in upstox_idx.items():
                    results[sym] = {**results.get(sym, {}), **data}
                print(f"  ✓ Upstox: Got {len(upstox_idx)} indices")
            if upstox_stk:
                for sym, data in upstox_stk.items():
                    results[sym] = {**results.get(sym, {}), **data}
                print(f"  ✓ Upstox: Got {len(upstox_stk)} stocks")
        elif upstox_is_configured():
            print(f"[{datetime.now().strftime('%H:%M:%S')}] ⚠ Upstox configured but no token. Login at http://localhost:5000/upstox/login")

        # ── PRIORITY 2: Google Finance (cross-verification for indices) ──
        print(f"[{datetime.now().strftime('%H:%M:%S')}] 🔍 Verifying indices via Google Finance...")
        for name, sym in INDEX_SYMBOLS.items():
            gf_data = _fetch_from_google_finance(sym)
            if gf_data:
                print(f"  ✓ {name}: Google Finance = {gf_data['regularMarketPrice']} ({gf_data['regularMarketChangePercent']:+.2f}%)")
                yf_data = results.get(sym)
                if not yf_data:
                    results[sym] = gf_data
                elif sym not in [v for v in (upstox_idx if upstox_is_configured() and upstox_has_token() else {})]:
                    yf_dir = yf_data['regularMarketChange'] >= 0
                    gf_dir = gf_data['regularMarketChange'] >= 0
                    if yf_dir != gf_dir:
                        print(f"  ⚠ {name}: Direction mismatch! → Using Google Finance")
                        results[sym] = {**yf_data, **gf_data}
                    else:
                        results[sym]['regularMarketPreviousClose'] = gf_data['regularMarketPreviousClose']
                        results[sym]['regularMarketChange'] = gf_data['regularMarketChange']
                        results[sym]['regularMarketChangePercent'] = gf_data['regularMarketChangePercent']
                        results[sym]['regularMarketPrice'] = gf_data['regularMarketPrice']

        # Verify top stocks
        key_stocks = ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS']
        for sym in key_stocks:
            if upstox_is_configured() and upstox_has_token() and sym in UPSTOX_STOCK_MAP:
                continue
            gf_data = _fetch_from_google_finance(sym)
            if gf_data and sym in results:
                results[sym]['regularMarketPrice'] = gf_data['regularMarketPrice']
                results[sym]['regularMarketPreviousClose'] = gf_data['regularMarketPreviousClose']
                results[sym]['regularMarketChange'] = gf_data['regularMarketChange']
                results[sym]['regularMarketChangePercent'] = gf_data['regularMarketChangePercent']

        # ── DAY-OVER-DAY GAIN/LOSS ──
        saved_closes = _load_saved_closes()
        if saved_closes:
            applied = 0
            for sym, data in results.items():
                if sym in saved_closes and saved_closes[sym] > 0:
                    prev = saved_closes[sym]
                    curr = data.get('regularMarketPrice', 0)
                    if curr > 0:
                        chg = round(curr - prev, 2)
                        chgP = round((chg / prev * 100), 2) if prev else 0
                        data['regularMarketPreviousClose'] = prev
                        data['regularMarketChange'] = chg
                        data['regularMarketChangePercent'] = chgP
                        applied += 1
            if applied > 0:
                print(f"  📊 Applied saved closes for {applied} symbols")

        # Separate into stocks, indices, commodities
        quotes = {}
        for sym in NIFTY50_SYMBOLS:
            if sym in results:
                quotes[sym] = results[sym]

        indices = {}
        for name, sym in INDEX_SYMBOLS.items():
            if sym in results:
                d = results[sym]
                indices[name] = {
                    'val': d['regularMarketPrice'],
                    'prev': d['regularMarketPreviousClose'],
                    'chg': d['regularMarketChange'],
                    'chgP': d['regularMarketChangePercent'],
                }

        commodities = {}
        for sym, cname in COMMODITY_SYMBOLS.items():
            if sym in results:
                d = results[sym]
                commodities[sym] = {
                    'name': cname,
                    'val': d['regularMarketPrice'],
                    'chg': d['regularMarketChange'],
                    'chgP': d['regularMarketChangePercent'],
                }

        with cache_lock:
            cache['quotes'] = quotes
            cache['indices'] = indices
            cache['commodities'] = commodities
            cache['last_stock_update'] = datetime.now().isoformat()
            cache['_live_prices'] = {sym: data.get('regularMarketPrice', 0) for sym, data in results.items()}

        elapsed = time.time() - start
        print(f"[{datetime.now().strftime('%H:%M:%S')}] ✅ Got {len(quotes)} stocks, {len(indices)} indices, {len(commodities)} commodities in {elapsed:.1f}s")

    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] ❌ Stock fetch error: {e}")
        traceback.print_exc()
