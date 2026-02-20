"""
BHARAT TERMINAL — Groww API Integration
"""

from datetime import datetime
from .config import GROWW_API_KEY, GROWW_API_SECRET, GROWW_INDEX_MAP, GROWW_STOCK_MAP
import backend.config as cfg


def groww_is_configured():
    """Check if Groww API credentials are set up"""
    return bool(GROWW_API_KEY and GROWW_API_KEY != 'your_groww_api_key_here')


def groww_connect():
    """Connect to Groww API using credentials"""
    if not groww_is_configured():
        return False

    try:
        from growwapi import GrowwAPI
        access_token = GrowwAPI.get_access_token(
            api_key=GROWW_API_KEY,
            secret=GROWW_API_SECRET
        )
        cfg.GROWW_CLIENT = GrowwAPI(access_token)
        print(f"  ✅ Groww API connected successfully!")
        return True
    except Exception as e:
        print(f"  ❌ Groww API connection failed: {e}")
        cfg.GROWW_CLIENT = None
        return False


def groww_fetch_quotes(symbols, exchange='NSE', segment='CASH'):
    """Fetch real-time quotes from Groww API for given trading symbols"""
    if not cfg.GROWW_CLIENT:
        if not groww_connect():
            return {}

    results = {}
    for yahoo_sym, groww_sym in symbols.items():
        try:
            q = cfg.GROWW_CLIENT.get_quote(groww_sym, exchange, segment)
            if q and isinstance(q, dict):
                ltp = float(q.get('last_price', 0))
                prev_close = float(q.get('previous_close', ltp))
                net_chg = float(q.get('net_change', ltp - prev_close))
                chg_pct = (net_chg / prev_close * 100) if prev_close else 0

                results[yahoo_sym] = {
                    'symbol': yahoo_sym,
                    'shortName': groww_sym,
                    'regularMarketPrice': round(ltp, 2),
                    'regularMarketPreviousClose': round(prev_close, 2),
                    'regularMarketChange': round(net_chg, 2),
                    'regularMarketChangePercent': round(chg_pct, 2),
                }
        except Exception as e:
            err_msg = str(e).lower()
            if 'unauthorized' in err_msg or 'token' in err_msg or 'expired' in err_msg:
                print(f"  ⚠ Groww token issue, reconnecting...")
                cfg.GROWW_CLIENT = None
                if groww_connect():
                    try:
                        q = cfg.GROWW_CLIENT.get_quote(groww_sym, exchange, segment)
                        if q and isinstance(q, dict):
                            ltp = float(q.get('last_price', 0))
                            prev_close = float(q.get('previous_close', ltp))
                            net_chg = float(q.get('net_change', ltp - prev_close))
                            chg_pct = (net_chg / prev_close * 100) if prev_close else 0
                            results[yahoo_sym] = {
                                'symbol': yahoo_sym,
                                'shortName': groww_sym,
                                'regularMarketPrice': round(ltp, 2),
                                'regularMarketPreviousClose': round(prev_close, 2),
                                'regularMarketChange': round(net_chg, 2),
                                'regularMarketChangePercent': round(chg_pct, 2),
                            }
                    except:
                        pass
            else:
                print(f"  ⚠ Groww quote error for {groww_sym}: {e}")
    return results


def groww_fetch_all():
    """Fetch all available data from Groww (indices + stocks)"""
    if not groww_is_configured():
        return {}, {}

    # Fetch NSE stocks (exchange=NSE, segment=CASH)
    stock_results = groww_fetch_quotes(GROWW_STOCK_MAP, exchange='NSE', segment='CASH')

    # Fetch NSE indices (NIFTY, BANKNIFTY)
    nse_idx = {k: v for k, v in GROWW_INDEX_MAP.items() if k != '^BSESN'}
    idx_results = groww_fetch_quotes(nse_idx, exchange='NSE', segment='CASH')

    # Fetch BSE index (SENSEX)
    bse_idx = {k: v for k, v in GROWW_INDEX_MAP.items() if k == '^BSESN'}
    if bse_idx:
        bse_results = groww_fetch_quotes(bse_idx, exchange='BSE', segment='CASH')
        idx_results.update(bse_results)

    return idx_results, stock_results
