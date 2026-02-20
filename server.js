/* ══════════════════════════════════════════════════════════════
   BHARAT TERMINAL — Local Proxy Server
   Serves static files + proxies Yahoo Finance API to avoid CORS
══════════════════════════════════════════════════════════════ */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const STATIC_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

function serveStatic(req, res) {
    let filePath = path.join(STATIC_DIR, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    const ext = path.extname(filePath);
    const mime = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
            return;
        }
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
    });
}

function fetchFromYahoo(yahooUrl) {
    return new Promise((resolve, reject) => {
        https.get(yahooUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json,text/html,*/*',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        }, (proxyRes) => {
            let body = '';
            proxyRes.on('data', chunk => body += chunk);
            proxyRes.on('end', () => {
                resolve({ status: proxyRes.statusCode, body });
            });
        }).on('error', reject);
    });
}

// Fetch a single symbol via the v8 chart API (no auth required)
async function fetchChartQuote(symbol) {
    try {
        const yUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d&includePrePost=false`;
        const { status, body } = await fetchFromYahoo(yUrl);
        if (status !== 200) return null;

        const d = JSON.parse(body);
        const result = d?.chart?.result?.[0];
        const meta = result?.meta;
        if (!meta) return null;

        const price = meta.regularMarketPrice;

        // Get previous close: prefer regularMarketPreviousClose, then try historical data
        let prevClose = meta.regularMarketPreviousClose || meta.previousClose || meta.chartPreviousClose;

        // If still no good previousClose, try computing from actual historical close prices
        if (!prevClose && result?.indicators?.quote?.[0]?.close) {
            const closes = result.indicators.quote[0].close.filter(c => c !== null);
            if (closes.length >= 2) {
                prevClose = closes[closes.length - 2];
            }
        }

        if (!prevClose) prevClose = price;

        const change = price - prevClose;
        const changePct = prevClose ? ((change / prevClose) * 100) : 0;

        return {
            symbol: symbol,
            regularMarketPrice: price,
            regularMarketPreviousClose: prevClose,
            regularMarketChange: change,
            regularMarketChangePercent: changePct,
            fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
            currency: meta.currency,
            exchangeName: meta.exchangeName,
            shortName: meta.shortName || meta.longName || symbol,
        };
    } catch (e) {
        console.error(`Error fetching ${symbol}:`, e.message);
        return null;
    }
}

// Batch fetch multiple symbols
async function fetchBatchQuotes(symbols) {
    // Process in parallel, max 10 at a time
    const results = [];
    const batchSize = 10;
    for (let i = 0; i < symbols.length; i += batchSize) {
        const batch = symbols.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(s => fetchChartQuote(s)));
        results.push(...batchResults.filter(r => r !== null));
        // Small delay between batches
        if (i + batchSize < symbols.length) {
            await new Promise(r => setTimeout(r, 100));
        }
    }
    return results;
}

const server = http.createServer(async (req, res) => {
    const parsed = url.parse(req.url, true);

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // /api/quote?symbols=RELIANCE.NS,TCS.NS,...
    if (parsed.pathname === '/api/quote') {
        const symbols = (parsed.query.symbols || '').split(',').filter(Boolean);
        if (!symbols.length) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing symbols parameter' }));
            return;
        }

        console.log(`[${new Date().toLocaleTimeString()}] Fetching ${symbols.length} symbols...`);

        try {
            const quotes = await fetchBatchQuotes(symbols);
            console.log(`[${new Date().toLocaleTimeString()}] Got ${quotes.length}/${symbols.length} quotes`);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                quoteResponse: {
                    result: quotes,
                    error: null
                }
            }));
        } catch (err) {
            console.error('Batch fetch error:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
        return;
    }

    // /api/chart?symbol=RELIANCE.NS&range=1mo&interval=1d
    if (parsed.pathname === '/api/chart') {
        const symbol = parsed.query.symbol || '';
        if (!symbol) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing symbol parameter' }));
            return;
        }
        const range = parsed.query.range || '1d';
        const interval = parsed.query.interval || '5m';
        const yUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&includePrePost=false`;

        try {
            const { status, body } = await fetchFromYahoo(yUrl);
            res.writeHead(status, { 'Content-Type': 'application/json' });
            res.end(body);
        } catch (err) {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
        return;
    }

    // Static files
    serveStatic(req, res);
});

server.listen(PORT, () => {
    console.log(`\n  ₹ BHARAT TERMINAL Server`);
    console.log(`  ─────────────────────────`);
    console.log(`  ✓ Running at http://localhost:${PORT}`);
    console.log(`  ✓ Yahoo Finance proxy ready (using v8 chart API)`);
    console.log(`  ✓ Open http://localhost:${PORT} in your browser\n`);
});
