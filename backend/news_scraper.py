"""
BHARAT TERMINAL — News Scraper
RSS feeds + website scraping from ET, Moneycontrol, Livemint.
"""

import time
import traceback
from datetime import datetime

import requests as req_lib
from bs4 import BeautifulSoup
import feedparser

from .config import NEWS_FEEDS, SCRAPE_NEWS_URLS, HEADERS, cache, cache_lock


def classify_news_impact(title, summary=''):
    """Simple keyword-based sentiment classifier"""
    text = (title + ' ' + summary).lower()
    positive_kw = ['surge', 'jump', 'rally', 'gain', 'rise', 'soar', 'boom', 'bullish',
                   'record', 'high', 'profit', 'growth', 'upgrade', 'beat', 'strong',
                   'inflow', 'optimis', 'positive', 'bull run']
    negative_kw = ['crash', 'fall', 'drop', 'slump', 'plunge', 'decline', 'loss', 'bearish',
                   'low', 'cut', 'downgrade', 'miss', 'weak', 'outflow', 'recession',
                   'fear', 'warning', 'negative', 'sell-off', 'selloff']

    pos = sum(1 for kw in positive_kw if kw in text)
    neg = sum(1 for kw in negative_kw if kw in text)

    if pos > neg:
        return 'positive'
    elif neg > pos:
        return 'negative'
    return 'neutral'


def classify_news_category(title, summary='', source_cat='Economy'):
    """Categorize news into Economy/Earnings/Policy/Global/Sector"""
    text = (title + ' ' + summary).lower()
    if any(kw in text for kw in ['earnings', 'quarter', 'profit', 'revenue', 'result', 'q1', 'q2', 'q3', 'q4', 'fy']):
        return 'Earnings'
    if any(kw in text for kw in ['rbi', 'sebi', 'policy', 'regulation', 'tax', 'government', 'budget', 'reform']):
        return 'Policy'
    if any(kw in text for kw in ['global', 'us ', 'china', 'fed ', 'dollar', 'world', 'international', 'europe']):
        return 'Global'
    if any(kw in text for kw in ['sector', 'industry', 'auto', 'pharma', 'bank', 'it ', 'fmcg', 'metal', 'oil', 'energy']):
        return 'Sector'
    return source_cat


def detect_affected_stocks(title, summary=''):
    """Detect which stock symbols are mentioned in the news"""
    text = (title + ' ' + summary).upper()
    known = ['RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY', 'INFOSYS', 'ITC',
             'MARUTI', 'SUNPHARMA', 'TATAMOTORS', 'TATA MOTORS', 'BAJFINANCE',
             'WIPRO', 'AXISBANK', 'AXIS BANK', 'LT', 'L&T', 'TITAN', 'ADANI',
             'ONGC', 'NTPC', 'BHARTI AIRTEL', 'BHARTIARTL', 'SBIN', 'SBI',
             'ZOMATO', 'PAYTM', 'HAL', 'HDFC', 'KOTAK', 'NIFTY', 'SENSEX']
    affected = []
    for sym in known:
        if sym in text:
            mapped = sym.replace('INFOSYS', 'INFY').replace('TATA MOTORS', 'TATAMOTORS')
            mapped = mapped.replace('AXIS BANK', 'AXISBANK').replace('L&T', 'LT')
            mapped = mapped.replace('BHARTI AIRTEL', 'BHARTIARTL').replace('SBI', 'SBIN')
            mapped = mapped.replace('HDFC', 'HDFCBANK').replace('KOTAK', 'KOTAKBANK')
            if mapped not in affected and mapped not in ['NIFTY', 'SENSEX', 'ADANI']:
                affected.append(mapped)
    return affected[:5]


def scrape_rss_news():
    """Scrape news from RSS feeds"""
    articles = []
    for feed_info in NEWS_FEEDS:
        try:
            feed = feedparser.parse(feed_info['url'])
            for entry in feed.entries[:5]:
                title = entry.get('title', '').strip()
                summary = BeautifulSoup(entry.get('summary', ''), 'html.parser').get_text()[:300].strip()
                link = entry.get('link', '')

                try:
                    if hasattr(entry, 'published_parsed') and entry.published_parsed:
                        dt = datetime(*entry.published_parsed[:6])
                        time_str = dt.strftime('%I:%M %p')
                    else:
                        time_str = datetime.now().strftime('%I:%M %p')
                except:
                    time_str = datetime.now().strftime('%I:%M %p')

                cat = classify_news_category(title, summary, feed_info['cat'])
                impact = classify_news_impact(title, summary)
                affected = detect_affected_stocks(title, summary)

                articles.append({
                    'title': title,
                    'summary': summary,
                    'cat': cat,
                    'impact': impact,
                    'time': time_str,
                    'source': feed_info['source'],
                    'affected': affected,
                    'link': link,
                })
        except Exception as e:
            print(f"  ⚠ RSS error ({feed_info['source']}): {e}")

    return articles


def scrape_website_news():
    """Scrape news by parsing HTML from financial websites"""
    articles = []
    for site in SCRAPE_NEWS_URLS:
        try:
            r = req_lib.get(site['url'], headers=HEADERS, timeout=10)
            if r.status_code != 200:
                continue

            soup = BeautifulSoup(r.text, 'lxml')
            links = soup.select(site['selector'])[:8]

            for link in links:
                title = link.get_text().strip()
                href = link.get('href', '')
                if not title or len(title) < 20:
                    continue
                if href and not href.startswith('http'):
                    base = site['url'].split('/')[0] + '//' + site['url'].split('/')[2]
                    href = base + href

                cat = classify_news_category(title, '', site['cat'])
                impact = classify_news_impact(title)
                affected = detect_affected_stocks(title)

                articles.append({
                    'title': title,
                    'summary': '',
                    'cat': cat,
                    'impact': impact,
                    'time': datetime.now().strftime('%I:%M %p'),
                    'source': site['source'],
                    'affected': affected,
                    'link': href,
                })
        except Exception as e:
            print(f"  ⚠ Scrape error ({site['source']}): {e}")

    return articles


def fetch_news_data():
    """Fetch all news from RSS feeds and websites"""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] 📰 Scraping news headlines...")
    start = time.time()

    try:
        rss_news = scrape_rss_news()
        web_news = scrape_website_news()
        all_news = rss_news + web_news

        # Deduplicate by title
        seen_titles = set()
        unique_news = []
        for article in all_news:
            key = article['title'][:60].lower()
            if key not in seen_titles:
                seen_titles.add(key)
                unique_news.append(article)

        for i, n in enumerate(unique_news):
            n['id'] = i + 1

        with cache_lock:
            cache['news'] = unique_news[:30]
            cache['last_news_update'] = datetime.now().isoformat()

        elapsed = time.time() - start
        print(f"[{datetime.now().strftime('%H:%M:%S')}] ✅ Got {len(unique_news)} unique news articles in {elapsed:.1f}s")

    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] ❌ News fetch error: {e}")
        traceback.print_exc()
