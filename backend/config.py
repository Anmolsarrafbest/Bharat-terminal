"""
BHARAT TERMINAL — Configuration
All constants, environment variables, symbol maps, and shared state.
"""

import os
import json
import threading
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # india-terminal/
ENV_PATH = os.path.join(BASE_DIR, '.env')
load_dotenv(ENV_PATH)


# ═══════════════════════════════════════════
#  UPSTOX API CONFIG
# ═══════════════════════════════════════════

UPSTOX_API_KEY = os.getenv('UPSTOX_API_KEY', '')
UPSTOX_API_SECRET = os.getenv('UPSTOX_API_SECRET', '')
UPSTOX_REDIRECT_URI = os.getenv('UPSTOX_REDIRECT_URI', 'http://localhost:5000/callback')
UPSTOX_ACCESS_TOKEN = os.getenv('UPSTOX_ACCESS_TOKEN', '')
UPSTOX_BASE_URL = 'https://api.upstox.com/v2'

UPSTOX_INDEX_KEYS = {
    'nifty': 'NSE_INDEX|Nifty 50',
    'sensex': 'BSE_INDEX|SENSEX',
    'banknifty': 'NSE_INDEX|Nifty Bank',
    'vix': 'NSE_INDEX|India VIX',
}

UPSTOX_STOCK_MAP = {
    'RELIANCE.NS': 'NSE_EQ|INE002A01018',
    'TCS.NS': 'NSE_EQ|INE467B01029',
    'HDFCBANK.NS': 'NSE_EQ|INE040A01034',
    'ICICIBANK.NS': 'NSE_EQ|INE090A01021',
    'INFY.NS': 'NSE_EQ|INE009A01021',
    'ITC.NS': 'NSE_EQ|INE154A01025',
    'SBIN.NS': 'NSE_EQ|INE062A01020',
    'BHARTIARTL.NS': 'NSE_EQ|INE397D01024',
    'LT.NS': 'NSE_EQ|INE018A01030',
    'KOTAKBANK.NS': 'NSE_EQ|INE237A01028',
}


# ═══════════════════════════════════════════
#  GROWW API CONFIG
# ═══════════════════════════════════════════

GROWW_API_KEY = os.getenv('GROWW_API_KEY', '')
GROWW_API_SECRET = os.getenv('GROWW_API_SECRET', '')
GROWW_CLIENT = None  # Will hold the GrowwAPI instance

GROWW_STOCK_MAP = {
    'RELIANCE.NS': 'RELIANCE',
    'TCS.NS': 'TCS',
    'HDFCBANK.NS': 'HDFCBANK',
    'ICICIBANK.NS': 'ICICIBANK',
    'INFY.NS': 'INFY',
    'ITC.NS': 'ITC',
    'SBIN.NS': 'SBIN',
    'BHARTIARTL.NS': 'BHARTIARTL',
    'LT.NS': 'LT',
    'KOTAKBANK.NS': 'KOTAKBANK',
    'HINDUNILVR.NS': 'HINDUNILVR',
    'BAJFINANCE.NS': 'BAJFINANCE',
    'WIPRO.NS': 'WIPRO',
    'AXISBANK.NS': 'AXISBANK',
    'SUNPHARMA.NS': 'SUNPHARMA',
    'MARUTI.NS': 'MARUTI',
    'TATAMOTORS.NS': 'TATAMOTORS',
    'TITAN.NS': 'TITAN',
    'ADANIENT.NS': 'ADANIENT',
    'NTPC.NS': 'NTPC',
}

GROWW_INDEX_MAP = {
    '^NSEI': 'NIFTY',
    '^BSESN': 'SENSEX',
    '^NSEBANK': 'BANKNIFTY',
}


# ═══════════════════════════════════════════
#  SYMBOL MAPS
# ═══════════════════════════════════════════

NIFTY50_SYMBOLS = [
    'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'INFY.NS',
    'LT.NS', 'ITC.NS', 'HINDUNILVR.NS', 'BAJFINANCE.NS', 'WIPRO.NS',
    'KOTAKBANK.NS', 'AXISBANK.NS', 'SUNPHARMA.NS', 'MARUTI.NS', 'ASIANPAINT.NS',
    'TATAMOTORS.NS', 'NTPC.NS', 'ONGC.NS', 'M&M.NS', 'TITAN.NS',
    'JSWSTEEL.NS', 'TATASTEEL.NS', 'POWERGRID.NS', 'BHARTIARTL.NS', 'HCLTECH.NS',
    'ADANIPORTS.NS', 'ADANIENT.NS', 'SBIN.NS', 'BAJAJFINSV.NS',
    'DRREDDY.NS', 'CIPLA.NS', 'DIVISLAB.NS', 'EICHERMOT.NS', 'HEROMOTOCO.NS',
    'HINDALCO.NS', 'COALINDIA.NS', 'BPCL.NS', 'GRASIM.NS', 'TECHM.NS',
    'ULTRACEMCO.NS', 'INDUSINDBK.NS', 'TATACONSUM.NS', 'VEDL.NS',
    'ZOMATO.NS', 'PAYTM.NS', 'IRCTC.NS', 'HAL.NS', 'DLF.NS',
    'DMART.NS', 'TRENT.NS', 'SBILIFE.NS', 'ADANIPOWER.NS',
    'PERSISTENT.NS', 'COFORGE.NS', 'APOLLOHOSP.NS',
    'PNB.NS', 'BANKBARODA.NS', 'CANBK.NS',
]

INDEX_SYMBOLS = {
    'nifty': '^NSEI',
    'sensex': '^BSESN',
    'banknifty': '^NSEBANK',
    'vix': '^INDIAVIX',
}

COMMODITY_SYMBOLS = {
    'USDINR=X': 'INR / USD',
    'EURINR=X': 'INR / EUR',
    'GC=F': 'GOLD',
    'SI=F': 'SILVER',
    'CL=F': 'CRUDE OIL',
    'NG=F': 'NATURAL GAS',
}

GOOGLE_FINANCE_MAP = {
    '^NSEI': 'NIFTY_50:INDEXNSE',
    '^BSESN': 'SENSEX:INDEXBOM',
    '^NSEBANK': 'NIFTY_BANK:INDEXNSE',
    '^INDIAVIX': 'INDIAVIX:INDEXNSE',
}


# ═══════════════════════════════════════════
#  NEWS CONFIG
# ═══════════════════════════════════════════

NEWS_FEEDS = [
    {
        'url': 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
        'source': 'Economic Times',
        'cat': 'Economy',
    },
    {
        'url': 'https://www.moneycontrol.com/rss/marketreports.xml',
        'source': 'Moneycontrol',
        'cat': 'Economy',
    },
    {
        'url': 'https://www.livemint.com/rss/markets',
        'source': 'Livemint',
        'cat': 'Economy',
    },
    {
        'url': 'https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms',
        'source': 'ET Stocks',
        'cat': 'Sector',
    },
    {
        'url': 'https://www.moneycontrol.com/rss/results.xml',
        'source': 'MC Earnings',
        'cat': 'Earnings',
    },
    {
        'url': 'https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms',
        'source': 'ET Economy',
        'cat': 'Policy',
    },
]

SCRAPE_NEWS_URLS = [
    {
        'url': 'https://www.moneycontrol.com/news/business/markets/',
        'source': 'Moneycontrol',
        'selector': 'li.clearfix h2 a',
        'cat': 'Economy',
    },
    {
        'url': 'https://www.livemint.com/market',
        'source': 'Livemint',
        'selector': 'h2.headline a',
        'cat': 'Sector',
    },
]

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}


# ═══════════════════════════════════════════
#  SHARED STATE
# ═══════════════════════════════════════════

cache = {
    'quotes': {},
    'indices': {},
    'commodities': {},
    'news': [],
    'macro': {},
    'last_stock_update': None,
    'last_news_update': None,
    '_live_prices': {},
}
cache_lock = threading.Lock()

SAVED_CLOSES_FILE = os.path.join(BASE_DIR, 'saved_closes.json')
