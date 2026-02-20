"""
BHARAT TERMINAL — Upstox API Integration
"""

import os
import requests as req_lib
from urllib.parse import quote
from datetime import datetime

from .config import (
    UPSTOX_API_KEY, UPSTOX_API_SECRET, UPSTOX_REDIRECT_URI,
    UPSTOX_BASE_URL, UPSTOX_INDEX_KEYS, UPSTOX_STOCK_MAP,
)
import backend.config as cfg


def upstox_is_configured():
    """Check if Upstox API credentials are set up"""
    return bool(UPSTOX_API_KEY and UPSTOX_API_KEY != 'your_api_key_here')


def upstox_has_token():
    """Check if we have a valid Upstox access token"""
    cfg.UPSTOX_ACCESS_TOKEN = os.getenv('UPSTOX_ACCESS_TOKEN', '')
    return bool(cfg.UPSTOX_ACCESS_TOKEN)


def upstox_fetch_quotes(instrument_keys):
    """Fetch market quotes from Upstox API"""
    if not upstox_has_token():
        return None

    try:
        keys_param = ','.join(instrument_keys)
        url = f'{UPSTOX_BASE_URL}/market-quote/quotes?instrument_key={quote(keys_param)}'
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': f'Bearer {cfg.UPSTOX_ACCESS_TOKEN}',
        }
        r = req_lib.get(url, headers=headers, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data.get('status') == 'success':
                return data.get('data', {})
        elif r.status_code == 401:
            print("  ⚠ Upstox token expired. Please login again at /upstox/login")
            cfg.UPSTOX_ACCESS_TOKEN = ''
    except Exception as e:
        print(f"  ⚠ Upstox API error: {e}")
    return None


def upstox_fetch_indices():
    """Fetch index data from Upstox API"""
    if not upstox_has_token():
        return {}

    keys = list(UPSTOX_INDEX_KEYS.values())
    data = upstox_fetch_quotes(keys)
    if not data:
        return {}

    results = {}
    for name, key in UPSTOX_INDEX_KEYS.items():
        quote_key = key.replace('|', ':')
        q = data.get(quote_key)
        if not q:
            continue

        ltp = q.get('last_price', 0)
        ohlc = q.get('ohlc', {})
        prev_close = ohlc.get('close', ltp)
        net_chg = q.get('net_change', ltp - prev_close)
        chg_pct = (net_chg / prev_close * 100) if prev_close else 0

        yahoo_sym_map = {
            'nifty': '^NSEI',
            'sensex': '^BSESN',
            'banknifty': '^NSEBANK',
            'vix': '^INDIAVIX',
        }
        yahoo_sym = yahoo_sym_map.get(name, '')

        results[yahoo_sym] = {
            'symbol': yahoo_sym,
            'shortName': name.upper(),
            'regularMarketPrice': round(ltp, 2),
            'regularMarketPreviousClose': round(prev_close, 2),
            'regularMarketChange': round(net_chg, 2),
            'regularMarketChangePercent': round(chg_pct, 2),
        }

    return results


def upstox_fetch_stocks():
    """Fetch stock data from Upstox API for mapped stocks"""
    if not upstox_has_token():
        return {}

    keys = list(UPSTOX_STOCK_MAP.values())
    data = upstox_fetch_quotes(keys)
    if not data:
        return {}

    results = {}
    for yahoo_sym, upstox_key in UPSTOX_STOCK_MAP.items():
        quote_key = upstox_key.replace('|', ':')
        q = data.get(quote_key)
        if not q:
            continue

        ltp = q.get('last_price', 0)
        ohlc = q.get('ohlc', {})
        prev_close = ohlc.get('close', ltp)
        net_chg = q.get('net_change', ltp - prev_close)
        chg_pct = (net_chg / prev_close * 100) if prev_close else 0

        results[yahoo_sym] = {
            'symbol': yahoo_sym,
            'shortName': q.get('symbol', yahoo_sym.replace('.NS', '')),
            'regularMarketPrice': round(ltp, 2),
            'regularMarketPreviousClose': round(prev_close, 2),
            'regularMarketChange': round(net_chg, 2),
            'regularMarketChangePercent': round(chg_pct, 2),
        }

    return results
