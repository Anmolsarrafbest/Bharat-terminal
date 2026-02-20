"""
BHARAT TERMINAL — Flask API Routes
"""

import threading
import requests as req_lib
from urllib.parse import quote
from flask import jsonify, request, send_from_directory, redirect
from dotenv import set_key

from .config import (
    INDEX_SYMBOLS, UPSTOX_API_KEY, UPSTOX_API_SECRET, UPSTOX_REDIRECT_URI,
    UPSTOX_BASE_URL, ENV_PATH, cache, cache_lock,
)
from .stock_data import fetch_stock_data, save_market_close
from .groww_api import groww_is_configured
from .upstox_api import upstox_is_configured, upstox_has_token
import backend.config as cfg


def register_routes(app):
    """Register all API routes on the Flask app"""

    # ── Static file serving ──

    @app.route('/')
    def serve_index():
        return send_from_directory(cfg.BASE_DIR, 'index.html')

    @app.route('/<path:path>')
    def serve_static(path):
        return send_from_directory(cfg.BASE_DIR, path)

    # ── Upstox OAuth ──

    @app.route('/upstox/login')
    def upstox_login():
        """Start Upstox OAuth2 login flow"""
        if not upstox_is_configured():
            return jsonify({
                'error': 'Upstox API not configured',
                'message': 'Please add your UPSTOX_API_KEY and UPSTOX_API_SECRET to the .env file',
                'steps': [
                    '1. Create account at https://upstox.com',
                    '2. Go to https://account.upstox.com/developer/apps',
                    '3. Create an app with redirect URI: http://localhost:5000/callback',
                    '4. Copy API Key and Secret to .env file',
                ]
            }), 400

        auth_url = (
            f'https://api.upstox.com/v2/login/authorization/dialog?'
            f'response_type=code&'
            f'client_id={UPSTOX_API_KEY}&'
            f'redirect_uri={quote(UPSTOX_REDIRECT_URI)}'
        )
        return redirect(auth_url)

    @app.route('/callback')
    def upstox_callback():
        """Handle Upstox OAuth2 callback"""
        code = request.args.get('code')
        if not code:
            return jsonify({'error': 'No authorization code received'}), 400

        try:
            token_url = f'{UPSTOX_BASE_URL}/login/authorization/token'
            payload = {
                'code': code,
                'client_id': UPSTOX_API_KEY,
                'client_secret': UPSTOX_API_SECRET,
                'redirect_uri': UPSTOX_REDIRECT_URI,
                'grant_type': 'authorization_code',
            }
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            }
            r = req_lib.post(token_url, data=payload, headers=headers, timeout=10)
            if r.status_code == 200:
                data = r.json()
                token = data.get('access_token', '')
                if token:
                    cfg.UPSTOX_ACCESS_TOKEN = token
                    try:
                        set_key(ENV_PATH, 'UPSTOX_ACCESS_TOKEN', token)
                    except:
                        pass
                    print(f"\n  ✅ Upstox login successful! Token saved.")
                    threading.Thread(target=fetch_stock_data, daemon=True).start()
                    return '''
                    <html><body style="background:#000;color:#0f0;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
                    <div style="text-align:center">
                        <h1>✅ Upstox Login Successful!</h1>
                        <p>Real-time data is now active.</p>
                        <p>You can close this tab and go back to <a href="http://localhost:3000" style="color:#0ff">Bharat Terminal</a></p>
                    </div>
                    </body></html>
                    '''
                else:
                    return jsonify({'error': 'No token in response', 'data': data}), 400
            else:
                return jsonify({'error': 'Token exchange failed', 'status': r.status_code, 'body': r.text}), 400
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    # ── Status endpoints ──

    @app.route('/upstox/status')
    def upstox_status():
        return jsonify({
            'configured': upstox_is_configured(),
            'has_token': upstox_has_token(),
            'login_url': '/upstox/login' if upstox_is_configured() else None,
        })

    @app.route('/groww/status')
    def groww_status():
        return jsonify({
            'configured': groww_is_configured(),
            'connected': cfg.GROWW_CLIENT is not None,
        })

    @app.route('/api/data-sources')
    def api_data_sources():
        return jsonify({
            'groww': {'configured': groww_is_configured(), 'connected': cfg.GROWW_CLIENT is not None, 'priority': 0},
            'upstox': {'configured': upstox_is_configured(), 'has_token': upstox_has_token(), 'priority': 1},
            'google_finance': {'configured': True, 'connected': True, 'priority': 2},
            'yfinance': {'configured': True, 'connected': True, 'priority': 3},
        })

    # ── Data endpoints ──

    @app.route('/api/quote')
    def api_quotes():
        """Return stock quotes (compatible with frontend format)"""
        symbols = request.args.get('symbols', '').split(',')
        symbols = [s.strip() for s in symbols if s.strip()]

        idx_sym_to_name = {v: k for k, v in INDEX_SYMBOLS.items()}

        with cache_lock:
            result = []
            for sym in symbols:
                found = False

                if sym in idx_sym_to_name:
                    idx_name = idx_sym_to_name[sym]
                    if idx_name in cache['indices']:
                        idx = cache['indices'][idx_name]
                        result.append({
                            'symbol': sym,
                            'shortName': idx_name.upper(),
                            'regularMarketPrice': idx['val'],
                            'regularMarketPreviousClose': idx['prev'],
                            'regularMarketChange': idx['chg'],
                            'regularMarketChangePercent': idx['chgP'],
                        })
                        found = True

                if not found and sym in cache['quotes']:
                    result.append(cache['quotes'][sym])
                    found = True

                if not found and sym in cache['commodities']:
                    cmd = cache['commodities'][sym]
                    result.append({
                        'symbol': sym,
                        'regularMarketPrice': cmd['val'],
                        'regularMarketChange': cmd['chg'],
                        'regularMarketChangePercent': cmd['chgP'],
                        'shortName': cmd['name'],
                    })
                    found = True

                if not found:
                    for k, v in cache['quotes'].items():
                        if k == sym or k.replace('.NS', '') == sym.replace('.NS', ''):
                            result.append(v)
                            break

            return jsonify({'quoteResponse': {'result': result, 'error': None}})

    @app.route('/api/indices')
    def api_indices():
        with cache_lock:
            return jsonify(cache['indices'])

    @app.route('/api/commodities')
    def api_commodities():
        with cache_lock:
            commodities_list = []
            for sym, data in cache['commodities'].items():
                commodities_list.append({
                    'symbol': sym,
                    'name': data['name'],
                    'price': data['val'],
                    'change': data['chg'],
                    'changePercent': data['chgP'],
                })
            return jsonify(commodities_list)

    @app.route('/api/news')
    def api_news():
        cat = request.args.get('category', 'all')
        with cache_lock:
            news = cache['news']
            if cat and cat != 'all':
                news = [n for n in news if n.get('cat', '').lower() == cat.lower()]
            return jsonify({
                'articles': news,
                'total': len(news),
                'lastUpdate': cache['last_news_update'],
            })

    @app.route('/api/status')
    def api_status():
        with cache_lock:
            return jsonify({
                'status': 'running',
                'stocks_cached': len(cache['quotes']),
                'indices_cached': len(cache['indices']),
                'commodities_cached': len(cache['commodities']),
                'news_cached': len(cache['news']),
                'last_stock_update': cache['last_stock_update'],
                'last_news_update': cache['last_news_update'],
            })

    @app.route('/api/save-closes')
    def api_save_closes():
        save_market_close()
        return jsonify({'status': 'saved', 'file': 'saved_closes.json'})
