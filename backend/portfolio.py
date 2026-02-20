"""
BHARAT TERMINAL — Portfolio Integration (Groww)
Fetches real holdings from Groww and caches them locally.
Portfolio data is saved to portfolio.json (gitignored — personal data).
"""

import os
import json
from datetime import datetime

from .config import SAVED_CLOSES_FILE, cache, cache_lock
import backend.config as cfg


PORTFOLIO_FILE = os.path.join(cfg.BASE_DIR, 'portfolio.json')
HOLDINGS_FILE = os.path.join(cfg.BASE_DIR, 'holdings.json')


# ═══════════════════════════════════════════
#  HOLDINGS — stored in holdings.json
#  Populated from Groww sync or manual add.
#  No demo/mock data — file starts empty.
# ═══════════════════════════════════════════

def load_holdings():
    """Load holdings from local JSON file. Returns [] if no file yet."""
    try:
        if os.path.exists(HOLDINGS_FILE):
            with open(HOLDINGS_FILE, 'r') as f:
                return json.load(f)
    except Exception as e:
        print(f"  ⚠ Error loading holdings: {e}")
    return []


def save_holdings(holdings):
    """Persist the full holdings array to disk."""
    try:
        with open(HOLDINGS_FILE, 'w') as f:
            json.dump(holdings, f, indent=2)
    except Exception as e:
        print(f"  ⚠ Error saving holdings: {e}")


def add_holding(holding):
    """Append a single holding and save."""
    holdings = load_holdings()
    holdings.append(holding)
    save_holdings(holdings)
    return holdings


def update_holding(index, holding):
    """Update a holding at a given index."""
    holdings = load_holdings()
    if 0 <= index < len(holdings):
        holdings[index] = holding
        save_holdings(holdings)
    return holdings


def delete_holding(index):
    """Remove a holding by index."""
    holdings = load_holdings()
    if 0 <= index < len(holdings):
        holdings.pop(index)
        save_holdings(holdings)
    return holdings


# ═══════════════════════════════════════════
#  GROWW PORTFOLIO (brokerage sync)
# ═══════════════════════════════════════════

def fetch_portfolio_from_groww():
    """Fetch real holdings from Groww API and save locally"""
    if not cfg.GROWW_CLIENT:
        from .groww_api import groww_connect
        if not groww_connect():
            print("  ❌ Cannot fetch portfolio — Groww not connected")
            return None

    try:
        raw = cfg.GROWW_CLIENT.get_holdings_for_user()
        if not raw or not isinstance(raw, dict):
            print("  ⚠ No holdings data returned from Groww")
            return None

        holdings_list = raw.get('holdings', [])
        if not holdings_list:
            print("  ⚠ No holdings found in Groww account")
            return None

        # Process holdings
        holdings = []
        total_invested = 0
        for h in holdings_list:
            symbol = h.get('trading_symbol', '')
            qty = float(h.get('quantity', 0))
            avg_price = float(h.get('average_price', 0))
            invested = round(qty * avg_price, 2)
            total_invested += invested

            holdings.append({
                'symbol': symbol,
                'isin': h.get('isin', ''),
                'quantity': qty,
                'avgPrice': avg_price,
                'invested': invested,
                'exchanges': h.get('tradable_exchanges', []),
            })

        portfolio = {
            'source': 'groww',
            'lastUpdated': datetime.now().isoformat(),
            'totalInvested': round(total_invested, 2),
            'holdings': holdings,
        }

        # Save raw Groww data to portfolio.json (brokerage cache)
        _save_portfolio(portfolio)

        # Also convert & save to holdings.json so dashboard can display them
        frontend_holdings = []
        for h in holdings:
            frontend_holdings.append({
                'symbol': h['symbol'],
                'sector': 'Others',     # Groww doesn't provide sector
                'qty': h['quantity'],
                'avg': h['avgPrice'],
                'ltp': 0,               # will be filled by live data
                'daychg': 0,
            })
        save_holdings(frontend_holdings)

        print(f"  ✅ Imported {len(holdings)} holdings from Groww (₹{total_invested:,.2f} invested)")
        return portfolio

    except Exception as e:
        print(f"  ❌ Portfolio fetch error: {e}")
        return None


def _save_portfolio(portfolio):
    """Save portfolio data to local file"""
    try:
        with open(PORTFOLIO_FILE, 'w') as f:
            json.dump(portfolio, f, indent=2)
    except Exception as e:
        print(f"  ⚠ Error saving portfolio: {e}")


def load_portfolio():
    """Load portfolio from local cache file"""
    try:
        if os.path.exists(PORTFOLIO_FILE):
            with open(PORTFOLIO_FILE, 'r') as f:
                return json.load(f)
    except Exception as e:
        print(f"  ⚠ Error loading portfolio: {e}")
    return None


def get_portfolio_with_live_prices():
    """Load portfolio and enrich with live prices from cache"""
    portfolio = load_portfolio()
    if not portfolio:
        return None

    holdings = portfolio.get('holdings', [])
    total_current = 0
    total_invested = 0

    with cache_lock:
        quotes = cache.get('quotes', {})

    for h in holdings:
        sym = h['symbol']
        # Try to find live price: SYMBOL.NS format in cache
        yf_sym = f"{sym}.NS"
        quote = quotes.get(yf_sym)

        if not quote:
            # Try fetching LTP from Groww directly
            try:
                if cfg.GROWW_CLIENT:
                    ltp_data = cfg.GROWW_CLIENT.get_ltp(sym, 'NSE', 'CASH')
                    if ltp_data and isinstance(ltp_data, dict):
                        ltp = float(ltp_data.get('last_price', 0))
                        if ltp > 0:
                            quote = {'regularMarketPrice': ltp}
            except:
                pass

        if quote:
            ltp = quote.get('regularMarketPrice', 0)
            h['ltp'] = ltp
            h['currentValue'] = round(ltp * h['quantity'], 2)
            h['pnl'] = round(h['currentValue'] - h['invested'], 2)
            h['pnlPercent'] = round((h['pnl'] / h['invested'] * 100), 2) if h['invested'] > 0 else 0
        else:
            h['ltp'] = 0
            h['currentValue'] = 0
            h['pnl'] = 0
            h['pnlPercent'] = 0

        total_current += h.get('currentValue', 0)
        total_invested += h.get('invested', 0)

    total_pnl = round(total_current - total_invested, 2)
    total_pnl_pct = round((total_pnl / total_invested * 100), 2) if total_invested > 0 else 0

    return {
        'source': portfolio.get('source', 'groww'),
        'lastUpdated': portfolio.get('lastUpdated', ''),
        'totalInvested': round(total_invested, 2),
        'totalCurrent': round(total_current, 2),
        'totalPnl': total_pnl,
        'totalPnlPercent': total_pnl_pct,
        'holdings': holdings,
    }
