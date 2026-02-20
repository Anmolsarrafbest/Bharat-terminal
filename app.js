/* ══════════════════════════════════════════════════════════════
   BHARAT TERMINAL — India Market Intelligence
   app.js — All data, logic, charts, interactivity
══════════════════════════════════════════════════════════════ */

'use strict';

/* ── MOCK DATA ── */
/* Yahoo Finance symbols for live data */
const YF_INDEX_SYMBOLS = {
  nifty: '^NSEI',
  sensex: '^BSESN',
  banknifty: '^NSEBANK',
  midcap: 'NIFTYMIDCAP150.NS',
  vix: '^INDIAVIX',
};

const INDICES = [
  { id: 'nifty', name: 'NIFTY 50', base: 22500.00, val: 22500.00 },
  { id: 'sensex', name: 'SENSEX', base: 74200.00, val: 74200.00 },
  { id: 'banknifty', name: 'BANK NIFTY', base: 48200.00, val: 48200.00 },
  { id: 'midcap', name: 'NIFTY MIDCAP', base: 45800.00, val: 45800.00 },
  { id: 'vix', name: 'INDIA VIX', base: 13.80, val: 13.80 },
];

let liveDataEnabled = false;

const SECTOR_COLORS = {
  'Energy': '#ff6b3d',
  'Financials': '#00d4ff',
  'IT': '#b864ff',
  'FMCG': '#f0b429',
  'Pharma': '#00e676',
  'Auto': '#ff3d57',
  'Metals': '#5a9fff',
  'Telecom': '#ff9d4d',
  'Infra': '#7aff8a',
  'Others': '#7a9ab8',
};

/* ── MASTER STOCK DATABASE (80+ stocks, searchable by name & symbol) ── */
const NIFTY50_STOCKS = [
  // NIFTY 50
  { sym: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy', ltp: 2892.50, chg: 34.20, chgP: 1.20, hi52: 3024, lo52: 2180, mcap: '19.6L Cr', pe: 24.8, yfSym: 'RELIANCE.NS' },
  { sym: 'TCS', name: 'Tata Consultancy Services', sector: 'IT', ltp: 3756.80, chg: -22.40, chgP: -0.59, hi52: 4258, lo52: 3056, mcap: '13.6L Cr', pe: 28.4, yfSym: 'TCS.NS' },
  { sym: 'HDFCBANK', name: 'HDFC Bank', sector: 'Financials', ltp: 1678.40, chg: 14.60, chgP: 0.88, hi52: 1880, lo52: 1363, mcap: '12.8L Cr', pe: 20.1, yfSym: 'HDFCBANK.NS' },
  { sym: 'ICICIBANK', name: 'ICICI Bank', sector: 'Financials', ltp: 1225.30, chg: 10.80, chgP: 0.89, hi52: 1362, lo52: 904, mcap: '8.6L Cr', pe: 18.9, yfSym: 'ICICIBANK.NS' },
  { sym: 'INFY', name: 'Infosys', sector: 'IT', ltp: 1842.60, chg: -11.20, chgP: -0.60, hi52: 2006, lo52: 1351, mcap: '7.6L Cr', pe: 26.1, yfSym: 'INFY.NS' },
  { sym: 'LT', name: 'Larsen & Toubro', sector: 'Infra', ltp: 3612.40, chg: 42.80, chgP: 1.20, hi52: 3965, lo52: 2612, mcap: '5.1L Cr', pe: 34.8, yfSym: 'LT.NS' },
  { sym: 'ITC', name: 'ITC Limited', sector: 'FMCG', ltp: 468.90, chg: 2.80, chgP: 0.60, hi52: 528, lo52: 400, mcap: '5.8L Cr', pe: 28.6, yfSym: 'ITC.NS' },
  { sym: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'FMCG', ltp: 2318.50, chg: -6.40, chgP: -0.28, hi52: 2778, lo52: 2172, mcap: '5.4L Cr', pe: 55.2, yfSym: 'HINDUNILVR.NS' },
  { sym: 'BAJFINANCE', name: 'Bajaj Finance', sector: 'Financials', ltp: 7168.20, chg: 88.40, chgP: 1.25, hi52: 8192, lo52: 6113, mcap: '4.3L Cr', pe: 32.4, yfSym: 'BAJFINANCE.NS' },
  { sym: 'WIPRO', name: 'Wipro Limited', sector: 'IT', ltp: 608.70, chg: -3.80, chgP: -0.62, hi52: 672, lo52: 478, mcap: '3.1L Cr', pe: 22.1, yfSym: 'WIPRO.NS' },
  { sym: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Financials', ltp: 1882.60, chg: 18.40, chgP: 0.99, hi52: 2060, lo52: 1543, mcap: '3.7L Cr', pe: 22.1, yfSym: 'KOTAKBANK.NS' },
  { sym: 'AXISBANK', name: 'Axis Bank', sector: 'Financials', ltp: 1148.20, chg: 12.60, chgP: 1.11, hi52: 1339, lo52: 915, mcap: '3.5L Cr', pe: 17.2, yfSym: 'AXISBANK.NS' },
  { sym: 'SUNPHARMA', name: 'Sun Pharmaceutical', sector: 'Pharma', ltp: 1724.30, chg: 20.80, chgP: 1.22, hi52: 1960, lo52: 1098, mcap: '4.1L Cr', pe: 39.4, yfSym: 'SUNPHARMA.NS' },
  { sym: 'MARUTI', name: 'Maruti Suzuki', sector: 'Auto', ltp: 11286.40, chg: 142.60, chgP: 1.28, hi52: 13680, lo52: 9604, mcap: '3.4L Cr', pe: 23.4, yfSym: 'MARUTI.NS' },
  { sym: 'ASIANPAINT', name: 'Asian Paints', sector: 'Others', ltp: 2268.80, chg: -18.40, chgP: -0.80, hi52: 3467, lo52: 2142, mcap: '2.2L Cr', pe: 46.8, yfSym: 'ASIANPAINT.NS' },
  { sym: 'TATAMOTORS', name: 'Tata Motors', sector: 'Auto', ltp: 682.40, chg: 8.60, chgP: 1.28, hi52: 1179, lo52: 601, mcap: '2.5L Cr', pe: 6.8, yfSym: 'TATAMOTORS.NS' },
  { sym: 'NTPC', name: 'NTPC Limited', sector: 'Energy', ltp: 328.60, chg: 3.40, chgP: 1.05, hi52: 448, lo52: 222, mcap: '3.2L Cr', pe: 16.8, yfSym: 'NTPC.NS' },
  { sym: 'ONGC', name: 'Oil & Natural Gas Corp', sector: 'Energy', ltp: 242.80, chg: 2.60, chgP: 1.08, hi52: 345, lo52: 197, mcap: '3.1L Cr', pe: 7.8, yfSym: 'ONGC.NS' },
  { sym: 'M&M', name: 'Mahindra & Mahindra', sector: 'Auto', ltp: 2868.40, chg: 34.20, chgP: 1.21, hi52: 3275, lo52: 1601, mcap: '3.5L Cr', pe: 28.6, yfSym: 'M&M.NS' },
  { sym: 'TITAN', name: 'Titan Company', sector: 'Others', ltp: 3248.60, chg: -14.20, chgP: -0.44, hi52: 3887, lo52: 2815, mcap: '2.9L Cr', pe: 78.2, yfSym: 'TITAN.NS' },
  { sym: 'JSWSTEEL', name: 'JSW Steel', sector: 'Metals', ltp: 878.20, chg: 10.40, chgP: 1.20, hi52: 1064, lo52: 716, mcap: '2.1L Cr', pe: 17.2, yfSym: 'JSWSTEEL.NS' },
  { sym: 'TATASTEEL', name: 'Tata Steel', sector: 'Metals', ltp: 148.60, chg: 1.80, chgP: 1.23, hi52: 184, lo52: 119, mcap: '1.8L Cr', pe: 14.8, yfSym: 'TATASTEEL.NS' },
  { sym: 'POWERGRID', name: 'Power Grid Corporation', sector: 'Infra', ltp: 298.40, chg: 2.80, chgP: 0.95, hi52: 366, lo52: 213, mcap: '2.8L Cr', pe: 18.2, yfSym: 'POWERGRID.NS' },
  { sym: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecom', ltp: 1684.20, chg: 18.60, chgP: 1.12, hi52: 1779, lo52: 935, mcap: '9.5L Cr', pe: 70.4, yfSym: 'BHARTIARTL.NS' },
  { sym: 'HCLTECH', name: 'HCL Technologies', sector: 'IT', ltp: 1648.80, chg: -8.40, chgP: -0.51, hi52: 1814, lo52: 1235, mcap: '4.5L Cr', pe: 26.8, yfSym: 'HCLTECH.NS' },
  // Nifty Next 50 / Large Caps
  { sym: 'ADANIPORTS', name: 'Adani Ports', sector: 'Infra', ltp: 1248.60, chg: 14.20, chgP: 1.15, hi52: 1621, lo52: 948, mcap: '2.7L Cr', pe: 28.4, yfSym: 'ADANIPORTS.NS' },
  { sym: 'ADANIENT', name: 'Adani Enterprises', sector: 'Others', ltp: 2286.40, chg: 28.60, chgP: 1.27, hi52: 3743, lo52: 1894, mcap: '2.6L Cr', pe: 98.2, yfSym: 'ADANIENT.NS' },
  { sym: 'ADANIPOWER', name: 'Adani Power', sector: 'Energy', ltp: 486.20, chg: 6.40, chgP: 1.34, hi52: 894, lo52: 276, mcap: '1.9L Cr', pe: 14.2, yfSym: 'ADANIPOWER.NS' },
  { sym: 'SBILIFE', name: 'SBI Life Insurance', sector: 'Financials', ltp: 1468.20, chg: 12.80, chgP: 0.88, hi52: 1918, lo52: 1168, mcap: '1.5L Cr', pe: 82.4, yfSym: 'SBILIFE.NS' },
  { sym: 'SBIN', name: 'State Bank of India', sector: 'Financials', ltp: 748.60, chg: 8.40, chgP: 1.13, hi52: 912, lo52: 544, mcap: '6.7L Cr', pe: 10.4, yfSym: 'SBIN.NS' },
  { sym: 'BAJAJFINSV', name: 'Bajaj Finserv', sector: 'Financials', ltp: 1628.40, chg: 18.20, chgP: 1.13, hi52: 2029, lo52: 1420, mcap: '2.6L Cr', pe: 18.4, yfSym: 'BAJAJFINSV.NS' },
  { sym: 'DRREDDY', name: 'Dr. Reddy Laboratories', sector: 'Pharma', ltp: 1228.60, chg: 14.20, chgP: 1.17, hi52: 1440, lo52: 1136, mcap: '1.0L Cr', pe: 20.2, yfSym: 'DRREDDY.NS' },
  { sym: 'CIPLA', name: 'Cipla Limited', sector: 'Pharma', ltp: 1472.40, chg: 16.80, chgP: 1.15, hi52: 1702, lo52: 1218, mcap: '1.2L Cr', pe: 28.4, yfSym: 'CIPLA.NS' },
  { sym: 'DIVISLAB', name: "Divi's Laboratories", sector: 'Pharma', ltp: 5248.60, chg: 62.40, chgP: 1.20, hi52: 5448, lo52: 3246, mcap: '1.4L Cr', pe: 64.2, yfSym: 'DIVISLAB.NS' },
  { sym: 'EICHERMOT', name: 'Eicher Motors', sector: 'Auto', ltp: 4862.40, chg: 48.60, chgP: 1.01, hi52: 5232, lo52: 3468, mcap: '1.3L Cr', pe: 28.4, yfSym: 'EICHERMOT.NS' },
  { sym: 'HEROMOTOCO', name: 'Hero MotoCorp', sector: 'Auto', ltp: 4162.80, chg: 38.40, chgP: 0.93, hi52: 6246, lo52: 3628, mcap: '0.8L Cr', pe: 18.8, yfSym: 'HEROMOTOCO.NS' },
  { sym: 'HINDALCO', name: 'Hindalco Industries', sector: 'Metals', ltp: 628.60, chg: 8.20, chgP: 1.32, hi52: 772, lo52: 492, mcap: '1.4L Cr', pe: 12.4, yfSym: 'HINDALCO.NS' },
  { sym: 'COALINDIA', name: 'Coal India', sector: 'Energy', ltp: 382.40, chg: 4.20, chgP: 1.11, hi52: 546, lo52: 338, mcap: '2.4L Cr', pe: 7.4, yfSym: 'COALINDIA.NS' },
  { sym: 'BPCL', name: 'Bharat Petroleum', sector: 'Energy', ltp: 292.60, chg: 3.40, chgP: 1.18, hi52: 376, lo52: 228, mcap: '1.3L Cr', pe: 8.2, yfSym: 'BPCL.NS' },
  { sym: 'GRASIM', name: 'Grasim Industries', sector: 'Others', ltp: 2542.80, chg: 22.40, chgP: 0.89, hi52: 2888, lo52: 1798, mcap: '1.7L Cr', pe: 22.4, yfSym: 'GRASIM.NS' },
  { sym: 'TECHM', name: 'Tech Mahindra', sector: 'IT', ltp: 1648.20, chg: -8.40, chgP: -0.51, hi52: 1762, lo52: 1018, mcap: '1.6L Cr', pe: 42.8, yfSym: 'TECHM.NS' },
  { sym: 'ULTRACEMCO', name: 'UltraTech Cement', sector: 'Infra', ltp: 10248.60, chg: 88.60, chgP: 0.87, hi52: 12472, lo52: 8606, mcap: '2.9L Cr', pe: 38.4, yfSym: 'ULTRACEMCO.NS' },
  { sym: 'INDUSINDBK', name: 'IndusInd Bank', sector: 'Financials', ltp: 996.40, chg: -48.60, chgP: -4.65, hi52: 1694, lo52: 848, mcap: '0.8L Cr', pe: 10.8, yfSym: 'INDUSINDBK.NS' },
  { sym: 'TATACONSUM', name: 'Tata Consumer Products', sector: 'FMCG', ltp: 1048.60, chg: 8.40, chgP: 0.81, hi52: 1248, lo52: 786, mcap: '0.9L Cr', pe: 68.4, yfSym: 'TATACONSUM.NS' },
  { sym: 'VEDL', name: 'Vedanta Limited', sector: 'Metals', ltp: 448.60, chg: 6.20, chgP: 1.40, hi52: 528, lo52: 206, mcap: '1.7L Cr', pe: 12.8, yfSym: 'VEDL.NS' },
  { sym: 'PIDILITIND', name: 'Pidilite Industries', sector: 'Others', ltp: 2848.60, chg: -12.40, chgP: -0.43, hi52: 3248, lo52: 2218, mcap: '1.4L Cr', pe: 82.6, yfSym: 'PIDILITIND.NS' },
  // Mid-Caps & Popular Stocks
  { sym: 'ZOMATO', name: 'Zomato Limited', sector: 'Others', ltp: 224.80, chg: 4.20, chgP: 1.90, hi52: 304, lo52: 128, mcap: '2.0L Cr', pe: 248, yfSym: 'ZOMATO.NS' },
  { sym: 'PAYTM', name: 'One97 Communications (Paytm)', sector: 'Financials', ltp: 886.40, chg: 12.60, chgP: 1.44, hi52: 1062, lo52: 310, mcap: '0.6L Cr', pe: 0, yfSym: 'PAYTM.NS' },
  { sym: 'NYKAA', name: 'FSN E-Commerce (Nykaa)', sector: 'Others', ltp: 172.40, chg: 2.80, chgP: 1.65, hi52: 248, lo52: 126, mcap: '0.5L Cr', pe: 218, yfSym: 'NYKAA.NS' },
  { sym: 'IRCTC', name: 'IRCTC', sector: 'Others', ltp: 762.40, chg: 8.60, chgP: 1.14, hi52: 1048, lo52: 648, mcap: '0.6L Cr', pe: 56.4, yfSym: 'IRCTC.NS' },
  { sym: 'HAL', name: 'Hindustan Aeronautics', sector: 'Infra', ltp: 3862.40, chg: 42.60, chgP: 1.12, hi52: 5674, lo52: 2628, mcap: '2.6L Cr', pe: 32.4, yfSym: 'HAL.NS' },
  { sym: 'DLF', name: 'DLF Limited', sector: 'Others', ltp: 748.60, chg: 8.40, chgP: 1.13, hi52: 968, lo52: 516, mcap: '1.8L Cr', pe: 54.8, yfSym: 'DLF.NS' },
  { sym: 'POLICYBZR', name: 'PB Fintech (PolicyBazaar)', sector: 'Financials', ltp: 1724.40, chg: 22.60, chgP: 1.33, hi52: 2196, lo52: 824, mcap: '0.8L Cr', pe: 0, yfSym: 'POLICYBZR.NS' },
  { sym: 'DMART', name: 'Avenue Supermarts (DMart)', sector: 'FMCG', ltp: 3628.60, chg: -18.40, chgP: -0.50, hi52: 5884, lo52: 3248, mcap: '2.4L Cr', pe: 86.4, yfSym: 'DMART.NS' },
  { sym: 'TRENT', name: 'Trent Limited', sector: 'FMCG', ltp: 5624.80, chg: 68.40, chgP: 1.23, hi52: 8346, lo52: 3228, mcap: '2.0L Cr', pe: 186, yfSym: 'TRENT.NS' },
  { sym: 'MPHASIS', name: 'Mphasis Limited', sector: 'IT', ltp: 2746.80, chg: -18.40, chgP: -0.67, hi52: 3148, lo52: 1948, mcap: '0.5L Cr', pe: 32.8, yfSym: 'MPHASIS.NS' },
  { sym: 'PERSISTENT', name: 'Persistent Systems', sector: 'IT', ltp: 5624.40, chg: 48.80, chgP: 0.87, hi52: 6862, lo52: 3628, mcap: '0.9L Cr', pe: 62.4, yfSym: 'PERSISTENT.NS' },
  { sym: 'COFORGE', name: 'Coforge Limited', sector: 'IT', ltp: 7248.60, chg: 82.40, chgP: 1.15, hi52: 9882, lo52: 4628, mcap: '0.5L Cr', pe: 58.4, yfSym: 'COFORGE.NS' },
  { sym: 'ABCAPITAL', name: 'Aditya Birla Capital', sector: 'Financials', ltp: 186.40, chg: 2.80, chgP: 1.53, hi52: 248, lo52: 148, mcap: '0.5L Cr', pe: 14.2, yfSym: 'ABCAPITAL.NS' },
  { sym: 'CANBK', name: 'Canara Bank', sector: 'Financials', ltp: 96.40, chg: 1.20, chgP: 1.26, hi52: 128, lo52: 82, mcap: '0.9L Cr', pe: 6.2, yfSym: 'CANBK.NS' },
  { sym: 'PNB', name: 'Punjab National Bank', sector: 'Financials', ltp: 98.60, chg: 1.40, chgP: 1.44, hi52: 142, lo52: 84, mcap: '1.1L Cr', pe: 8.4, yfSym: 'PNB.NS' },
  { sym: 'BANKBARODA', name: 'Bank of Baroda', sector: 'Financials', ltp: 228.60, chg: 2.80, chgP: 1.24, hi52: 280, lo52: 178, mcap: '1.2L Cr', pe: 7.2, yfSym: 'BANKBARODA.NS' },
  { sym: 'APOLLOHOSP', name: 'Apollo Hospitals', sector: 'Pharma', ltp: 6862.40, chg: 82.60, chgP: 1.22, hi52: 7482, lo52: 4628, mcap: '0.9L Cr', pe: 98.4, yfSym: 'APOLLOHOSP.NS' },
  { sym: 'MAXHEALTH', name: 'Max Healthcare', sector: 'Pharma', ltp: 924.60, chg: 10.80, chgP: 1.18, hi52: 1148, lo52: 648, mcap: '0.9L Cr', pe: 86.4, yfSym: 'MAXHEALTH.NS' },
  { sym: 'VOLTAS', name: 'Voltas Limited', sector: 'Others', ltp: 1528.60, chg: 18.40, chgP: 1.22, hi52: 1926, lo52: 1024, mcap: '0.5L Cr', pe: 68.4, yfSym: 'VOLTAS.NS' },
  { sym: 'HAVELLS', name: 'Havells India', sector: 'Others', ltp: 1548.60, chg: 14.40, chgP: 0.94, hi52: 2048, lo52: 1148, mcap: '1.0L Cr', pe: 62.4, yfSym: 'HAVELLS.NS' },
  { sym: 'MARICO', name: 'Marico Limited', sector: 'FMCG', ltp: 628.60, chg: 4.80, chgP: 0.77, hi52: 762, lo52: 498, mcap: '0.8L Cr', pe: 48.4, yfSym: 'MARICO.NS' },
  { sym: 'GODREJCP', name: 'Godrej Consumer Products', sector: 'FMCG', ltp: 1148.60, chg: 8.40, chgP: 0.74, hi52: 1486, lo52: 862, mcap: '1.2L Cr', pe: 48.8, yfSym: 'GODREJCP.NS' },
  { sym: 'TORNTPHARM', name: 'Torrent Pharmaceuticals', sector: 'Pharma', ltp: 3348.60, chg: 28.40, chgP: 0.86, hi52: 3648, lo52: 1948, mcap: '1.1L Cr', pe: 48.4, yfSym: 'TORNTPHARM.NS' },
  { sym: 'AUROPHARMA', name: 'Aurobindo Pharma', sector: 'Pharma', ltp: 1178.60, chg: 14.20, chgP: 1.22, hi52: 1348, lo52: 742, mcap: '0.7L Cr', pe: 18.4, yfSym: 'AUROPHARMA.NS' },
  { sym: 'INDHOTEL', name: 'Indian Hotels Company', sector: 'Others', ltp: 748.60, chg: 10.40, chgP: 1.41, hi52: 892, lo52: 424, mcap: '1.1L Cr', pe: 68.4, yfSym: 'INDHOTEL.NS' },
  { sym: 'JUBLFOOD', name: 'Jubilant Foodworks', sector: 'FMCG', ltp: 648.60, chg: 6.80, chgP: 1.06, hi52: 802, lo52: 418, mcap: '0.4L Cr', pe: 68.4, yfSym: 'JUBLFOOD.NS' },
  { sym: 'PAGEIND', name: 'Page Industries', sector: 'FMCG', ltp: 44862.40, chg: 448.60, chgP: 1.01, hi52: 47824, lo52: 33248, mcap: '0.5L Cr', pe: 64.8, yfSym: 'PAGEIND.NS' },
  { sym: 'SCHAEFFLER', name: 'Schaeffler India', sector: 'Auto', ltp: 3648.60, chg: 28.40, chgP: 0.78, hi52: 5248, lo52: 2928, mcap: '0.2L Cr', pe: 48.4, yfSym: 'SCHAEFFLER.NS' },
  // SME / Small Cap / IPO-listed
  { sym: 'SILVERBEE', name: 'Silverbee Telecom', sector: 'Telecom', ltp: 142.60, chg: 3.40, chgP: 2.44, hi52: 218, lo52: 92, mcap: '850 Cr', pe: 28.4, yfSym: 'SILVERBEE.NS' },
  { sym: 'SBICARDS', name: 'SBI Cards & Payment', sector: 'Financials', ltp: 698.60, chg: 8.40, chgP: 1.22, hi52: 869, lo52: 648, mcap: '0.7L Cr', pe: 24.8, yfSym: 'SBICARDS.NS' },
  { sym: 'NUVOCO', name: 'Nuvoco Vistas', sector: 'Infra', ltp: 368.60, chg: 4.40, chgP: 1.21, hi52: 498, lo52: 296, mcap: '0.2L Cr', pe: 28.4, yfSym: 'NUVOCO.NS' },
  { sym: 'CAMPUS', name: 'Campus Activewear', sector: 'FMCG', ltp: 242.60, chg: -2.80, chgP: -1.14, hi52: 398, lo52: 152, mcap: '0.1L Cr', pe: 48.4, yfSym: 'CAMPUS.NS' },
  { sym: 'LATENTVIEW', name: 'LatentView Analytics', sector: 'IT', ltp: 368.60, chg: 4.40, chgP: 1.21, hi52: 528, lo52: 248, mcap: '0.2L Cr', pe: 68.4, yfSym: 'LATENTVIEW.NS' },
  { sym: 'EASEMYTRIP', name: 'Easy Trip Planners', sector: 'Others', ltp: 24.60, chg: 0.40, chgP: 1.65, hi52: 68, lo52: 18, mcap: '350 Cr', pe: 42.4, yfSym: 'EASEMYTRIP.NS' },
];

let NEWS_DATA = [
  {
    id: 1, cat: 'Policy', title: 'RBI Holds Rates Steady at 6.5% Amid Inflation Concerns',
    summary: 'The Reserve Bank of India maintained its benchmark repo rate at 6.5% in its latest monetary policy committee meeting, citing persistent food inflation and global uncertainty. Markets interpreted the move as moderately positive.',
    impact: 'neutral', time: '09:42 AM', source: 'Economic Times', affected: ['HDFCBANK', 'ICICIBANK', 'AXISBANK']
  },
  {
    id: 2, cat: 'Earnings', title: 'Reliance Industries Q3 Results Beat Estimates; Retail Revenue Up 18%',
    summary: 'Reliance Industries posted strong Q3 results with net profit rising 11.2% YoY to ₹21,804 Cr. The retail and telecom segments led growth. Jio added 8.4 million new subscribers during the quarter.',
    impact: 'positive', time: '08:15 AM', source: 'Moneycontrol', affected: ['RELIANCE']
  },
  {
    id: 3, cat: 'Economy', title: 'India\'s GDP Growth Projected at 8.2% for FY25 — IMF Upgrades Forecast',
    summary: 'The International Monetary Fund upgraded India\'s growth forecast to 8.2% for FY25, citing robust domestic consumption, infrastructure spending and strong capital markets. India remains the fastest-growing major economy.',
    impact: 'positive', time: '07:30 AM', source: 'Financial Express', affected: []
  },
  {
    id: 4, cat: 'Sector', title: 'IT Sector Faces Headwinds as US Tech Spending Slows in Q4',
    summary: 'Major Indian IT firms including TCS, Infosys and Wipro may face near-term pressure as US technology clients signal belt-tightening. Analysts have revised earnings estimates downward by 3-5%. Deal wins declined quarter-on-quarter.',
    impact: 'negative', time: '06:55 AM', source: 'CNBC TV18', affected: ['TCS', 'INFY', 'WIPRO', 'HCLTECH']
  },
  {
    id: 5, cat: 'Global', title: 'US Fed Minutes Signal Cautious Rate Cut Path; Dollar Strengthens',
    summary: 'Federal Reserve meeting minutes revealed policymakers remain cautious about cutting rates. The US dollar index rose 0.4%, putting pressure on emerging market currencies including the Indian Rupee which weakened to 83.45 per dollar.',
    impact: 'negative', time: '06:10 AM', source: 'Reuters India', affected: []
  },
  {
    id: 6, cat: 'Earnings', title: 'Bajaj Finance Reports 28% YoY Profit Jump; AUM Crosses ₹3.5L Cr',
    summary: 'Bajaj Finance delivered stellar Q3 results with net profit surging 28.1% to ₹3,848 Cr. Assets under management crossed ₹3.5 lakh crore for the first time. Credit quality remained stable with GNPA at 0.95%.',
    impact: 'positive', time: '05:45 AM', source: 'Bloomberg Quint', affected: ['BAJFINANCE']
  },
  {
    id: 7, cat: 'Sector', title: 'Auto Sales Hit 7-Year High as EV Adoption Accelerates',
    summary: 'India\'s automobile sector recorded its highest monthly sales in seven years, driven by rising EV adoption and pent-up rural demand. Maruti Suzuki and Mahindra led the surge. Two-wheeler sales also touched record levels.',
    impact: 'positive', time: '05:20 AM', source: 'Autocar India', affected: ['MARUTI', 'M&M', 'TATAMOTORS']
  },
  {
    id: 8, cat: 'Policy', title: 'SEBI Relaxes F&O Entry Norms for Retail Investors',
    summary: 'SEBI announced revisions to F&O entry criteria for retail investors, reducing the minimum income threshold and simplifying documentation. The move is expected to increase retail participation in derivatives markets.',
    impact: 'neutral', time: '04:50 AM', source: 'Mint', affected: []
  },
  {
    id: 9, cat: 'Economy', title: 'FII Inflows Touch ₹18,400 Cr in January — Highest in 9 Months',
    summary: 'Foreign Institutional Investors pumped ₹18,400 crore into Indian equities in January, the highest monthly inflow in 9 months. IT and Pharma sectors attracted the most interest. The trend reflects renewed confidence in Indian growth story.',
    impact: 'positive', time: '04:15 AM', source: 'NDTV Profit', affected: []
  },
];

const MACRO_DATA = [
  { name: 'REPO RATE', val: '6.50%', sub: 'RBI unchanged', color: '#00d4ff' },
  { name: 'CPI INFLATION', val: '5.1%', sub: 'Dec \'25', color: '#f0b429' },
  { name: 'GDP GROWTH', val: '8.2%', sub: 'FY25 (IMF)', color: '#00e676' },
  { name: 'INR/USD', val: '83.45', sub: '+0.18 today', color: '#ff6b3d' },
  { name: '10Y G-SEC', val: '7.18%', sub: '-2bps today', color: '#b864ff' },
  { name: 'CRUDE (WTI)', val: '$78.4', sub: '-0.64%', color: '#ff3d57' },
];

let CURRENCY_DATA = [
  { name: 'INR / USD', val: '83.45', chg: '+0.18', up: false },
  { name: 'INR / EUR', val: '90.12', chg: '-0.24', up: false },
  { name: 'GOLD', val: '₹63,450/10g', chg: '+0.35%', up: true },
  { name: 'SILVER', val: '₹75,800/Kg', chg: '+0.82%', up: true },
  { name: 'CRUDE OIL', val: '$78.40/bbl', chg: '-0.64%', up: false },
  { name: 'NGAS', val: '$2.85/MMBtu', chg: '+1.12%', up: true },
];

const FII_DATA = [
  ['', 'BUY (CR)', 'SELL (CR)', 'NET (CR)'],
  ['FII', '₹28,412', '₹22,848', '+₹5,564'],
  ['DII', '₹18,624', '₹14,312', '+₹4,312'],
  ['NET', '', '', '+₹9,876'],
];

const IPO_DATA = [
  { name: 'Hexaware Technologies', open: '12 Feb', close: '14 Feb', price: '₹674-708', gmp: '+₹82 (11.6%)', pos: true },
  { name: 'Capital SFB', open: '20 Feb', close: '24 Feb', price: '₹445-469', gmp: '+₹35 (7.5%)', pos: true },
  { name: 'Stallion India Fluoroc.', open: '16 Feb', close: '18 Feb', price: '₹85-90', gmp: '-₹4 (-4.4%)', pos: false },
];

const TRENDING_STOCKS = [
  { sym: 'RELIANCE', mentions: '4.2K' },
  { sym: 'TATAMOTORS', mentions: '3.8K' },
  { sym: 'BAJFINANCE', mentions: '3.1K' },
  { sym: 'MARUTI', mentions: '2.6K' },
  { sym: 'INFY', mentions: '2.1K' },
];

/* ── STATE ── */
let holdings = JSON.parse(localStorage.getItem('bt_holdings') || '[]');
let watchlist = JSON.parse(localStorage.getItem('bt_watchlist') || '[]');
let alerts = JSON.parse(localStorage.getItem('bt_alerts') || '[]');
let moversMode = 'gainers';
let newsFilter = 'all';
let indexData = JSON.parse(JSON.stringify(INDICES));
let marketStocks = JSON.parse(JSON.stringify(NIFTY50_STOCKS));

/* ── LIVE DATA VIA LOCAL PROXY SERVER ── */
const COMMODITY_SYMBOLS = {
  'USDINR=X': { name: 'INR / USD', format: v => v.toFixed(2) },
  'EURINR=X': { name: 'INR / EUR', format: v => v.toFixed(2) },
  'GC=F': { name: 'GOLD', format: v => '$' + v.toFixed(1) + '/oz' },
  'SI=F': { name: 'SILVER', format: v => '$' + v.toFixed(2) + '/oz' },
  'CL=F': { name: 'CRUDE OIL', format: v => '$' + v.toFixed(2) + '/bbl' },
  'NG=F': { name: 'NGAS', format: v => '$' + v.toFixed(2) + '/MMBtu' },
};

let liveRefreshInterval = null;
let lastLiveUpdate = null;

async function fetchBatchQuotes(symbols) {
  // Try Python backend FIRST (port 5000) — has saved_closes.json for accurate gain/loss
  try {
    const r = await fetch('http://localhost:5000/api/quote?symbols=' + encodeURIComponent(symbols.join(',')));
    if (r.ok) {
      const d = await r.json();
      const result = d?.quoteResponse?.result;
      if (result && result.length > 0) return result;
    }
  } catch (e) { /* Python backend failed, try fallback */ }

  // Fallback: try Node.js proxy (port 3000)
  try {
    const r = await fetch('/api/quote?symbols=' + encodeURIComponent(symbols.join(',')));
    if (r.ok) {
      const d = await r.json();
      return d?.quoteResponse?.result || null;
    }
  } catch (e) { /* fallback also failed */ }

  return null;
}

/* ── Market hours helper (IST: Mon-Fri, 9:15 AM - 3:30 PM) ── */
function isMarketOpen() {
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day = ist.getDay();       // 0=Sun, 6=Sat
  const hr = ist.getHours();
  const mn = ist.getMinutes();
  const mins = hr * 60 + mn;
  // Mon(1)–Fri(5), 9:15(555) to 15:30(930)
  return day >= 1 && day <= 5 && mins >= 555 && mins < 930;
}

async function fetchLiveData() {
  const badge = document.getElementById('data-source-badge');

  // Skip fetching when market is closed — use cached data
  if (!isMarketOpen()) {
    if (!liveDataEnabled) {
      // First load: fetch once to populate, then stop
      badge.textContent = 'CLOSED';
      badge.className = 'data-source-badge dsb-sim';
      badge.title = 'Market closed — using last available data';
    }
    // If we already have live data from a previous fetch, keep showing it
    if (liveDataEnabled) return;
  }

  badge.textContent = 'LOADING…';
  badge.className = 'data-source-badge dsb-sim';

  try {
    // 1) Fetch all stock symbols
    const allStockSyms = marketStocks.map(s => s.yfSym).filter(Boolean);
    // 2) Index symbols
    const allIdxSyms = Object.values(YF_INDEX_SYMBOLS);
    // 3) Commodity symbols
    const allCmdSyms = Object.keys(COMMODITY_SYMBOLS);
    // Combine all
    const allSymbols = [...allIdxSyms, ...allCmdSyms, ...allStockSyms];

    // Fetch in batches of 20 (Yahoo allows up to ~50 per call)
    let allQuotes = [];
    for (let i = 0; i < allSymbols.length; i += 20) {
      const batch = allSymbols.slice(i, i + 20);
      const quotes = await fetchBatchQuotes(batch);
      if (quotes) allQuotes = allQuotes.concat(quotes);
      // Small delay between batches to be nice to the API
      if (i + 20 < allSymbols.length) await new Promise(r => setTimeout(r, 200));
    }

    if (!allQuotes.length) {
      throw new Error('No data returned');
    }

    // Build a lookup by symbol
    const lookup = {};
    allQuotes.forEach(q => { if (q.symbol) lookup[q.symbol] = q; });

    // Update indices
    indexData.forEach(idx => {
      const sym = YF_INDEX_SYMBOLS[idx.id];
      const q = lookup[sym];
      if (!q) return;
      idx.val = q.regularMarketPrice || idx.val;
      idx.base = q.regularMarketPreviousClose || idx.base;
    });

    // Update stocks
    let stocksUpdated = 0;
    marketStocks.forEach(s => {
      const q = lookup[s.yfSym];
      if (!q) return;
      s.ltp = q.regularMarketPrice || s.ltp;
      s.chg = q.regularMarketChange ?? s.chg;
      s.chgP = q.regularMarketChangePercent ?? s.chgP;
      if (q.fiftyTwoWeekHigh) s.hi52 = Math.round(q.fiftyTwoWeekHigh);
      if (q.fiftyTwoWeekLow) s.lo52 = Math.round(q.fiftyTwoWeekLow);
      if (q.marketCap) {
        const mc = q.marketCap;
        if (mc >= 1e12) s.mcap = (mc / 1e12).toFixed(1) + 'L Cr';
        else if (mc >= 1e10) s.mcap = (mc / 1e10).toFixed(0) + 'K Cr';
        else if (mc >= 1e7) s.mcap = (mc / 1e7).toFixed(0) + ' Cr';
        else s.mcap = s.mcap;
      }
      if (q.trailingPE) s.pe = +q.trailingPE.toFixed(1);
      if (q.shortName && !s.name) s.name = q.shortName;
      stocksUpdated++;
    });

    // Update currency/commodities live
    const updatedCurrency = [];
    Object.entries(COMMODITY_SYMBOLS).forEach(([sym, info]) => {
      const q = lookup[sym];
      if (!q) return;
      const price = q.regularMarketPrice;
      const chg = q.regularMarketChangePercent;
      updatedCurrency.push({
        name: info.name,
        val: info.format(price),
        chg: (chg >= 0 ? '+' : '') + chg.toFixed(2) + '%',
        up: chg >= 0,
      });
    });
    if (updatedCurrency.length) {
      CURRENCY_DATA.length = 0;
      updatedCurrency.forEach(c => CURRENCY_DATA.push(c));
    }

    // Update macro data with live values
    const usdInr = lookup['USDINR=X'];
    const crude = lookup['CL=F'];
    if (usdInr) {
      const mi = MACRO_DATA.findIndex(m => m.name === 'INR/USD');
      if (mi >= 0) {
        MACRO_DATA[mi].val = usdInr.regularMarketPrice.toFixed(2);
        const c = usdInr.regularMarketChange;
        MACRO_DATA[mi].sub = (c >= 0 ? '+' : '') + c.toFixed(2) + ' today';
      }
    }
    if (crude) {
      const mi = MACRO_DATA.findIndex(m => m.name.includes('CRUDE'));
      if (mi >= 0) {
        MACRO_DATA[mi].val = '$' + crude.regularMarketPrice.toFixed(1);
        const c = crude.regularMarketChangePercent;
        MACRO_DATA[mi].sub = (c >= 0 ? '+' : '') + c.toFixed(2) + '%';
      }
    }

    // Update holdings LTP from fresh market data
    holdings.forEach(h => {
      const mkt = marketStocks.find(s => s.sym === h.symbol);
      if (mkt) {
        const prevLtp = h.ltp;
        h.ltp = mkt.ltp;
        h.daychg = mkt.chgP;
      }
    });
    try {
      await saveHoldings();
    } catch (saveErr) {
      console.error('Failed to save holdings after live data update:', saveErr);
      showToast('⚠️ Could not save your holdings. Recent changes may not be saved.');
    }

    // Mark as LIVE
    liveDataEnabled = true;
    lastLiveUpdate = new Date();
    badge.textContent = 'LIVE';
    badge.className = 'data-source-badge dsb-live';
    badge.title = `Live data · ${stocksUpdated} stocks · Updated ${lastLiveUpdate.toLocaleTimeString('en-IN')}`;

    showToast(`📡 Live data updated — ${stocksUpdated} stocks refreshed`);

    renderIndexStrip();
    renderTicker();
    rerenderActivePanel();

  } catch (err) {
    console.warn('Live data fetch failed:', err.message);
    badge.textContent = 'SIM';
    badge.className = 'data-source-badge dsb-sim';
    badge.title = 'Simulated data — run server.js for live data';
  }
}

// On load: fetch once, then use smart interval based on market hours
fetchLiveData();

function startSmartRefresh() {
  if (liveRefreshInterval) clearInterval(liveRefreshInterval);
  const interval = isMarketOpen() ? 30 * 1000 : 5 * 60 * 1000; // 30s during market, 5min otherwise
  liveRefreshInterval = setInterval(() => {
    fetchLiveData();
    // Re-check interval when market open/close transitions
    const nowOpen = isMarketOpen();
    const currentInterval = nowOpen ? 30 * 1000 : 5 * 60 * 1000;
    if (currentInterval !== interval) startSmartRefresh();
  }, interval);
}
startSmartRefresh();

/* ── LIVE NEWS FETCHER ── */
async function fetchLiveNews() {
  // Try primary (same origin), then Python backend
  const urls = ['/api/news', 'http://localhost:5000/api/news'];
  for (const url of urls) {
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const d = await r.json();
      if (d.articles && d.articles.length > 0) {
        NEWS_DATA = d.articles;
        const active = document.querySelector('.panel.active');
        if (active && active.id === 'panel-news') renderNews();
        if (active && active.id === 'panel-dashboard') {
          renderMiniNews();
          renderSentiment();
        }
        console.log(`📰 Got ${d.articles.length} live news articles from ${url}`);
        return;
      }
    } catch (e) { continue; }
  }
  console.warn('News fetch failed from all sources');
}

// Fetch news on load, refresh every 3 minutes
fetchLiveNews();
setInterval(fetchLiveNews, 3 * 60 * 1000);

/* ── GLOBAL SEARCH ── */
function buildSearchIndex() {
  return NIFTY50_STOCKS.map(s => ({
    sym: s.sym, name: s.name, sector: s.sector, ltp: s.ltp, chgP: s.chgP,
    _search: (s.sym + ' ' + s.name + ' ' + s.sector).toLowerCase()
  }));
}

function setupGlobalSearch() {
  const input = document.getElementById('global-search');
  const results = document.getElementById('global-search-results');
  if (!input) return;

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { results.style.display = 'none'; return; }
    const idx = buildSearchIndex();
    const hits = idx.filter(s => s._search.includes(q)).slice(0, 10);
    if (!hits.length) {
      results.innerHTML = `<div class="search-result-empty">No results for "${input.value}"</div>`;
    } else {
      results.innerHTML = hits.map(s => {
        const mkt = marketStocks.find(m => m.sym === s.sym) || s;
        const chg = mkt.chgP || 0;
        return `<div class="search-result-item" onclick="onSearchSelect('${s.sym}','${s.sector}')">
          <div class="sr-left"><span class="sr-sym">${s.sym}</span><span class="sr-name">${s.name}</span></div>
          <div class="sr-right">
            <span class="sr-price">₹${fmt(mkt.ltp)}</span>
            <span class="sr-chg ${chg >= 0 ? 'up' : 'dn'}">${sign(chg)}${chg.toFixed(2)}%</span>
          </div>
        </div>`;
      }).join('');
    }
    results.style.display = 'block';
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') { results.style.display = 'none'; input.value = ''; }
  });

  document.addEventListener('click', e => {
    if (!document.getElementById('global-search-wrap').contains(e.target))
      results.style.display = 'none';
  });
}

function onSearchSelect(sym, sector) {
  const input = document.getElementById('global-search');
  const results = document.getElementById('global-search-results');
  results.style.display = 'none';
  input.value = '';
  // navigate to markets and highlight
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('nav-markets').classList.add('active');
  document.getElementById('panel-markets').classList.add('active');
  renderMarkets();
  // Filter to this symbol
  const mktSearch = document.getElementById('mkt-search');
  if (mktSearch) { mktSearch.value = sym; filterMarket(sym); }
  showToast(`Showing: ${sym}`);
}
window.onSearchSelect = onSearchSelect;

/* ── UTILS ── */
const fmt = (n) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(n);
const fmtCr = (n) => {
  if (n >= 1e7) return '₹' + (n / 1e7).toFixed(2) + 'L Cr';
  if (n >= 1e5) return '₹' + (n / 1e5).toFixed(2) + ' Cr';
  return '₹' + fmt(n);
};
const clsx = (...cls) => cls.filter(Boolean).join(' ');
const updn = (v) => v >= 0 ? 'up' : 'dn';
const sign = (v) => v >= 0 ? '+' : '';

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

/* ── CLOCK ── */
function updateClock() {
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const h = String(ist.getHours()).padStart(2, '0');
  const m = String(ist.getMinutes()).padStart(2, '0');
  const s = String(ist.getSeconds()).padStart(2, '0');
  document.getElementById('clock').textContent = `${h}:${m}:${s}`;

  const day = ist.getDay(), hr = ist.getHours(), mn = ist.getMinutes();
  const isOpen = day >= 1 && day <= 5 && (hr > 9 || (hr === 9 && mn >= 15)) && (hr < 15 || (hr === 15 && mn < 30));
  const badge = document.getElementById('market-status-badge');
  badge.className = 'market-status' + (isOpen ? '' : ' closed');
  badge.innerHTML = `<span class="status-dot"></span><span class="status-text">${isOpen ? 'OPEN' : 'CLOSED'}</span>`;
}
setInterval(updateClock, 1000);
updateClock();

/* ── SIMULATED LIVE PRICES (only when no live data) ── */
function perturbPrice(price, factor = 0.002) {
  return price * (1 + (Math.random() - 0.49) * factor);
}
function updatePrices() {
  // Only perturb prices if NOT receiving live data
  if (!liveDataEnabled) {
    indexData.forEach(idx => {
      const newVal = perturbPrice(idx.val, 0.0005);
      idx.val = newVal;
    });
    marketStocks.forEach(s => {
      const prev = s.ltp - s.chg;
      s.ltp = perturbPrice(s.ltp, 0.001);
      s.chg = s.ltp - prev;
      s.chgP = (s.chg / prev) * 100;
    });
  }
  renderIndexStrip();
  renderTicker();
  rerenderActivePanel();
}
setInterval(updatePrices, 4000);

/* ── NAV ── */
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const panel = document.getElementById('panel-' + btn.dataset.panel);
    if (panel) panel.classList.add('active');
    rerenderActivePanel();
  });
});
document.getElementById('add-holding-btn').addEventListener('click', openAddModal);

function rerenderActivePanel() {
  const active = document.querySelector('.panel.active');
  if (!active) return;
  const id = active.id;
  if (id === 'panel-dashboard') renderDashboard();
  else if (id === 'panel-portfolio') renderPortfolio();
  else if (id === 'panel-markets') renderMarkets();
  else if (id === 'panel-news') renderNews();
  else if (id === 'panel-watchlist') renderWatchlist();
}

/* ── INDEX STRIP ── */
function renderIndexStrip() {
  indexData.forEach(idx => {
    const prev = idx.base;
    const chg = idx.val - prev;
    const chgP = (chg / prev) * 100;
    const cls = chgP >= 0 ? 'up' : 'dn';
    const el = document.getElementById(idx.id + '-val');
    if (el) el.textContent = fmt(idx.val);
    const cel = document.getElementById(idx.id + '-chg');
    if (cel) {
      cel.textContent = `${sign(chg)}${fmt(chg)} (${sign(chgP)}${chgP.toFixed(2)}%)`;
      cel.className = 'idx-chg ' + cls;
    }
  });
}

/* ── TICKER ── */
function renderTicker() {
  const items = marketStocks.slice(0, 20).map(s =>
    `<span class="ticker-item"><span class="t-sym">${s.sym}</span><span class="t-val">₹${fmt(s.ltp)}</span><span class="${s.chgP >= 0 ? 't-up' : 't-dn'}">${sign(s.chgP)}${s.chgP.toFixed(2)}%</span></span>`
  ).join('');
  const track = document.getElementById('ticker-track');
  if (track) track.innerHTML = items + items; // double for seamless loop
}

/* ── DASHBOARD ── */
function renderDashboard() {
  renderPortfolioSummary();
  renderAllocationPie();
  renderMovers();
  renderMiniNews();
  renderFII();
  renderMacro();
}

function renderPortfolioSummary() {
  const totalInvested = holdings.reduce((a, h) => a + h.qty * h.avg, 0);
  const totalCurrent = holdings.reduce((a, h) => a + h.qty * h.ltp, 0);
  const totalPnl = totalCurrent - totalInvested;
  const totalPnlP = totalInvested ? (totalPnl / totalInvested * 100) : 0;
  const dayPnl = holdings.reduce((a, h) => a + h.qty * h.ltp * (h.daychg / 100), 0);
  const dayPnlP = totalCurrent ? (dayPnl / totalCurrent * 100) : 0;

  document.getElementById('port-total-val').textContent = '₹' + fmt(totalCurrent);
  const dp = document.getElementById('port-day-pnl');
  dp.textContent = `${sign(dayPnl)}₹${fmt(Math.abs(dayPnl))} (${sign(dayPnlP)}${dayPnlP.toFixed(2)}%)`;
  dp.className = 'pnl-val ' + (dayPnl >= 0 ? 'up' : 'dn');
  const tp = document.getElementById('port-total-pnl');
  tp.textContent = `${sign(totalPnl)}₹${fmt(Math.abs(totalPnl))} (${sign(totalPnlP)}${totalPnlP.toFixed(2)}%)`;
  tp.className = 'pnl-val ' + (totalPnl >= 0 ? 'up' : 'dn');
  document.getElementById('port-invested').textContent = '₹' + fmt(totalInvested);

  drawPortfolioSparkline(totalCurrent);
}

function drawPortfolioSparkline(total) {
  const canvas = document.getElementById('portfolio-sparkline');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.offsetWidth || 380, h = 70;
  canvas.width = w; canvas.height = h;
  ctx.clearRect(0, 0, w, h);

  const pts = 40;
  const data = [];
  let v = total * 0.92;
  for (let i = 0; i < pts; i++) {
    v += (Math.random() - 0.45) * total * 0.004;
    data.push(v);
  }
  data[pts - 1] = total;

  const mn = Math.min(...data), mx = Math.max(...data);
  const range = mx - mn || 1;
  const toY = val => h - 8 - ((val - mn) / range) * (h - 16);
  const toX = i => (i / (pts - 1)) * w;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(0,212,255,0.25)');
  grad.addColorStop(1, 'rgba(0,212,255,0)');

  ctx.beginPath();
  ctx.moveTo(toX(0), toY(data[0]));
  for (let i = 1; i < pts; i++) {
    const x0 = toX(i - 1), y0 = toY(data[i - 1]), x1 = toX(i), y1 = toY(data[i]);
    ctx.bezierCurveTo((x0 + x1) / 2, y0, (x0 + x1) / 2, y1, x1, y1);
  }
  ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();

  ctx.beginPath();
  ctx.moveTo(toX(0), toY(data[0]));
  for (let i = 1; i < pts; i++) {
    const x0 = toX(i - 1), y0 = toY(data[i - 1]), x1 = toX(i), y1 = toY(data[i]);
    ctx.bezierCurveTo((x0 + x1) / 2, y0, (x0 + x1) / 2, y1, x1, y1);
  }
  ctx.strokeStyle = '#00d4ff'; ctx.lineWidth = 2;
  ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 6;
  ctx.stroke(); ctx.shadowBlur = 0;
}

function renderAllocationPie() {
  const bySecArr = {};
  const total = holdings.reduce((a, h) => a + h.qty * h.ltp, 0) || 1;
  holdings.forEach(h => {
    const v = h.qty * h.ltp;
    bySecArr[h.sector] = (bySecArr[h.sector] || 0) + v;
  });

  const canvas = document.getElementById('alloc-pie');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const sz = 160;
  canvas.width = sz; canvas.height = sz;
  ctx.clearRect(0, 0, sz, sz);

  const entries = Object.entries(bySecArr).map(([k, v]) => ({ k, v, pct: v / total }));
  if (!entries.length) {
    ctx.font = '11px JetBrains Mono'; ctx.fillStyle = '#3d5470'; ctx.textAlign = 'center';
    ctx.fillText('No holdings', sz / 2, sz / 2);
  } else {
    let start = -Math.PI / 2;
    entries.forEach(e => {
      const angle = e.pct * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(sz / 2, sz / 2);
      ctx.arc(sz / 2, sz / 2, sz / 2 - 4, start, start + angle);
      ctx.closePath();
      ctx.fillStyle = SECTOR_COLORS[e.k] || '#7a9ab8';
      ctx.fill();
      start += angle;
    });
    // inner circle
    ctx.beginPath();
    ctx.arc(sz / 2, sz / 2, sz / 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#0e0e0e'; ctx.fill();
  }

  const legend = document.getElementById('alloc-legend');
  legend.innerHTML = entries.slice(0, 7).map(e =>
    `<div class="legend-item"><div class="legend-dot" style="background:${SECTOR_COLORS[e.k] || '#7a9ab8'}"></div><span class="legend-name">${e.k}</span><span class="legend-pct">${(e.pct * 100).toFixed(1)}%</span></div>`
  ).join('');
}

function renderMovers() {
  const sorted = [...marketStocks].sort((a, b) => moversMode === 'gainers' ? b.chgP - a.chgP : a.chgP - b.chgP);
  const top = sorted.slice(0, 8);
  document.getElementById('movers-list').innerHTML = top.map((s, i) =>
    `<div class="mover-row">
      <span class="mover-rank">${i + 1}</span>
      <span class="mover-sym">${s.sym}</span>
      <span class="mover-price">₹${fmt(s.ltp)}</span>
      <span class="mover-chg ${updn(s.chgP)}">${sign(s.chgP)}${s.chgP.toFixed(2)}%</span>
    </div>`
  ).join('');
}

function switchMovers(mode) {
  moversMode = mode;
  document.getElementById('tab-gainers').classList.toggle('active', mode === 'gainers');
  document.getElementById('tab-losers').classList.toggle('active', mode === 'losers');
  renderMovers();
}
window.switchMovers = switchMovers;

function renderMiniNews() {
  const el = document.getElementById('mini-news-list');
  el.innerHTML = NEWS_DATA.slice(0, 5).map(n =>
    `<div class="mini-news-item">
      <div><span class="news-category cat-${n.cat}">${n.cat}</span><span class="mini-news-time">${n.time}</span></div>
      <div class="mini-news-headline">${n.title}</div>
    </div>`
  ).join('');
}

function renderFII() {
  const el = document.getElementById('fii-table');
  el.innerHTML = FII_DATA.map((row, ri) =>
    `<div class="fii-row">
      ${row.map((cell, ci) => {
      let cls = '';
      if (ri > 0 && ci === 3) cls = cell.startsWith('+') ? 'up' : 'dn';
      return `<span class="${cls}">${cell}</span>`;
    }).join('')}
    </div>`
  ).join('');
}

function renderMacro() {
  const el = document.getElementById('macro-grid');
  el.innerHTML = MACRO_DATA.map(m =>
    `<div class="macro-item">
      <span class="macro-name">${m.name}</span>
      <span class="macro-val" style="color:${m.color}">${m.val}</span>
      <span class="macro-sub">${m.sub}</span>
    </div>`
  ).join('');
}

/* ── PORTFOLIO ── */
async function saveHoldings() {
  // Persist to backend (holdings.json) — falls back to localStorage
  try {
    const r = await fetch('http://localhost:5000/api/holdings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ holdings }),
    });
    if (!r.ok) throw new Error('Backend save failed');
  } catch (e) {
    console.warn('Backend save failed, using localStorage fallback:', e.message);
    localStorage.setItem('bt_holdings', JSON.stringify(holdings));
  }
}

function renderPortfolio() {
  const total = holdings.reduce((a, h) => a + h.qty * h.ltp, 0);
  const invested = holdings.reduce((a, h) => a + h.qty * h.avg, 0);

  document.getElementById('holdings-tbody').innerHTML = holdings.map((h, i) => {
    const cv = h.qty * h.ltp;
    const pnl = cv - h.qty * h.avg;
    const pnlP = h.qty && h.avg ? pnl / (h.qty * h.avg) * 100 : 0;
    const wt = total ? (cv / total * 100) : 0;
    return `<tr>
      <td><div class="sym-name">${h.symbol}</div><div class="sym-sector">${h.sector}</div></td>
      <td class="neutral">${h.sector}</td>
      <td>${h.qty.toLocaleString('en-IN')}</td>
      <td>₹${fmt(h.avg)}</td>
      <td>₹${fmt(h.ltp)}</td>
      <td>₹${fmt(cv)}</td>
      <td class="${updn(pnl)}">${sign(pnl)}₹${fmt(Math.abs(pnl))}</td>
      <td class="${updn(pnlP)}">${sign(pnlP)}${pnlP.toFixed(2)}%</td>
      <td class="${updn(h.daychg)}">${sign(h.daychg)}${h.daychg.toFixed(2)}%</td>
      <td><span class="weight-bar" style="width:${Math.min(wt, 100) * 0.8}px"></span>${wt.toFixed(1)}%</td>
      <td>
        <button class="icon-btn" onclick="editHolding(${i})" title="Edit">✎</button>
        <button class="icon-btn" onclick="deleteHolding(${i})" title="Delete" style="margin-left:4px;">✕</button>
      </td>
    </tr>`;
  }).join('') || `<tr><td colspan="11" style="text-align:center;padding:24px;color:var(--text-muted)">No holdings yet. Click <b>⟳ SYNC GROWW</b> to import your portfolio or <b>+ ADD</b> to add manually.</td></tr>`;

  // Stats
  const totalPnl = holdings.reduce((a, h) => a + (h.qty * h.ltp - h.qty * h.avg), 0);
  const dayPnl = holdings.reduce((a, h) => a + h.qty * h.ltp * (h.daychg / 100), 0);
  document.getElementById('port-stats-list').innerHTML = [
    ['Total Holdings', holdings.length],
    ['Total Invested', '₹' + fmt(invested)],
    ['Current Value', '₹' + fmt(total)],
    ['Total P&L', `<span class="${updn(totalPnl)}">${sign(totalPnl)}₹${fmt(Math.abs(totalPnl))}</span>`],
    ['Day P&L', `<span class="${updn(dayPnl)}">${sign(dayPnl)}₹${fmt(Math.abs(dayPnl))}</span>`],
    ['Best Return', getBestReturn()],
    ['Worst Return', getWorstReturn()],
  ].map(([k, v]) => `<div class="stat-row"><span class="stat-name">${k}</span><span class="stat-val">${v}</span></div>`).join('');

  drawPnlTrend();
  populateAlertSymbols();
}

function getBestReturn() {
  if (!holdings.length) return '—';
  const h = holdings.reduce((best, curr) => {
    const bP = (best.ltp - best.avg) / best.avg * 100;
    const cP = (curr.ltp - curr.avg) / curr.avg * 100;
    return cP > bP ? curr : best;
  });
  const p = (h.ltp - h.avg) / h.avg * 100;
  return `<span class="up">${h.symbol} +${p.toFixed(2)}%</span>`;
}
function getWorstReturn() {
  if (!holdings.length) return '—';
  const h = holdings.reduce((worst, curr) => {
    const wP = (worst.ltp - worst.avg) / worst.avg * 100;
    const cP = (curr.ltp - curr.avg) / curr.avg * 100;
    return cP < wP ? curr : worst;
  });
  const p = (h.ltp - h.avg) / h.avg * 100;
  return `<span class="${updn(p)}">${h.symbol} ${sign(p)}${p.toFixed(2)}%</span>`;
}

function drawPnlTrend() {
  const canvas = document.getElementById('pnl-trend-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.offsetWidth || 280, h = 160;
  canvas.width = w; canvas.height = h;
  ctx.clearRect(0, 0, w, h);

  const pts = 30;
  const total = holdings.reduce((a, h) => a + h.qty * h.ltp, 0);
  const inv = holdings.reduce((a, h) => a + h.qty * h.avg, 0);
  if (!total) return;
  const data = [];
  let v = inv * 0.98;
  for (let i = 0; i < pts; i++) {
    v += (Math.random() - 0.44) * inv * 0.005;
    data.push(v);
  }
  data[pts - 1] = total;

  const mn = Math.min(inv * 0.95, ...data), mx = Math.max(...data);
  const range = mx - mn || 1;
  const toY = val => h - 10 - ((val - mn) / range) * (h - 20);
  const toX = i => 10 + (i / (pts - 1)) * (w - 20);

  // zero line at inv
  const zy = toY(inv);
  ctx.beginPath(); ctx.moveTo(0, zy); ctx.lineTo(w, zy);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.moveTo(toX(0), toY(data[0]));
  for (let i = 1; i < pts; i++) {
    const x0 = toX(i - 1), y0 = toY(data[i - 1]), x1 = toX(i), y1 = toY(data[i]);
    ctx.bezierCurveTo((x0 + x1) / 2, y0, (x0 + x1) / 2, y1, x1, y1);
  }
  const isPos = total >= inv;
  ctx.strokeStyle = isPos ? '#00e676' : '#ff3d57';
  ctx.lineWidth = 2; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 6;
  ctx.stroke(); ctx.shadowBlur = 0;
}

function filterHoldings(q) {
  const rows = document.querySelectorAll('#holdings-tbody tr');
  rows.forEach(r => {
    r.style.display = r.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none';
  });
}
window.filterHoldings = filterHoldings;

function openAddModal(sym = '') {
  clearModalForm();
  document.getElementById('modal-title').textContent = 'ADD HOLDING';
  document.getElementById('edit-index').value = '';
  if (sym) document.getElementById('form-symbol').value = sym;
  document.getElementById('modal-overlay').classList.add('open');
}
window.openAddModal = openAddModal;

function editHolding(i) {
  const h = holdings[i];
  document.getElementById('modal-title').textContent = 'EDIT HOLDING';
  document.getElementById('edit-index').value = i;
  document.getElementById('form-symbol').value = h.symbol;
  document.getElementById('form-sector').value = h.sector;
  document.getElementById('form-qty').value = h.qty;
  document.getElementById('form-avg').value = h.avg;
  document.getElementById('form-ltp').value = h.ltp;
  document.getElementById('form-daychg').value = h.daychg;
  document.getElementById('modal-overlay').classList.add('open');
}
window.editHolding = editHolding;

async function deleteHolding(i) {
  holdings.splice(i, 1);
  await saveHoldings();
  renderPortfolio();
  renderDashboard();
  showToast('Holding removed.');
}
window.deleteHolding = deleteHolding;

async function saveHolding() {
  const sym = document.getElementById('form-symbol').value.trim().toUpperCase();
  const sector = document.getElementById('form-sector').value;
  const qty = parseFloat(document.getElementById('form-qty').value);
  const avg = parseFloat(document.getElementById('form-avg').value);
  const ltp = parseFloat(document.getElementById('form-ltp').value);
  const daychg = parseFloat(document.getElementById('form-daychg').value) || 0;

  if (!sym || !qty || !avg || !ltp) { showToast('Please fill all required fields.'); return; }

  const idx = document.getElementById('edit-index').value;
  const entry = { symbol: sym, sector, qty, avg, ltp, daychg };

  if (idx !== '') {
    holdings[parseInt(idx)] = entry;
    showToast(`${sym} updated.`);
  } else {
    holdings.push(entry);
    showToast(`${sym} added to portfolio.`);
  }
  await saveHoldings();
  closeAddModal();
  renderPortfolio();
  renderDashboard();
}
window.saveHolding = saveHolding;

function clearModalForm() {
  ['form-symbol', 'form-qty', 'form-avg', 'form-ltp', 'form-daychg'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('form-sector').value = 'Energy';
}

function closeAddModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}
window.closeAddModal = closeAddModal;

function closeModal(e) {
  if (e.target === document.getElementById('modal-overlay')) closeAddModal();
}
window.closeModal = closeModal;

// Datalist for symbol suggestions
const dl = document.getElementById('symbol-suggestions');
NIFTY50_STOCKS.forEach(s => {
  const opt = document.createElement('option');
  opt.value = s.sym;
  opt.label = s.name || s.sym;
  dl.appendChild(opt);
});

/* ── MARKETS ── */
let marketFilterQuery = '';

function renderMarkets() {
  const tbody = document.getElementById('market-tbody');
  const inWl = (sym) => watchlist.some(w => w.sym === sym);

  // Filter stocks based on current search query
  const q = marketFilterQuery.toLowerCase();
  const filtered = q
    ? marketStocks.filter(s =>
      s.sym.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.sector.toLowerCase().includes(q)
    )
    : marketStocks;

  tbody.innerHTML = filtered.map(s =>
    `<tr>
      <td><div class="sym-name">${s.sym}</div><div class="sym-sector">${s.name || s.sector}</div></td>
      <td class="neutral">${s.sector}</td>
      <td>₹${fmt(s.ltp)}</td>
      <td class="${updn(s.chg)}">${sign(s.chg)}₹${fmt(Math.abs(s.chg))}</td>
      <td class="${updn(s.chgP)}">${sign(s.chgP)}${s.chgP.toFixed(2)}%</td>
      <td>₹${s.hi52 >= 1000 ? fmt(s.hi52) : s.hi52}</td>
      <td>₹${s.lo52 >= 1000 ? fmt(s.lo52) : s.lo52}</td>
      <td>${s.mcap}</td>
      <td class="neutral">${s.pe}</td>
      <td><button class="icon-btn" title="${inWl(s.sym) ? 'Remove' : 'Add to watchlist'}" onclick="toggleWatchlistFromMarket('${s.sym}','${s.sector}')">${inWl(s.sym) ? '★' : '☆'}</button></td>
    </tr>`
  ).join('');

  if (q && !filtered.length) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:24px;color:var(--text-muted)">No stocks matching "${marketFilterQuery}"</td></tr>`;
  }

  renderHeatmap();
  renderCurrency();
}

function toggleWatchlistFromMarket(sym, sector) {
  const idx = watchlist.findIndex(w => w.sym === sym);
  const stock = marketStocks.find(s => s.sym === sym);
  if (idx >= 0) { watchlist.splice(idx, 1); showToast(`${sym} removed from watchlist`); }
  else { watchlist.push({ sym, sector, ltp: stock.ltp, chg: stock.chg, chgP: stock.chgP, hi52: stock.hi52, lo52: stock.lo52 }); showToast(`${sym} added to watchlist`); }
  localStorage.setItem('bt_watchlist', JSON.stringify(watchlist));
  renderMarkets();
}
window.toggleWatchlistFromMarket = toggleWatchlistFromMarket;

function filterMarket(q) {
  marketFilterQuery = q;
  renderMarkets();
}
window.filterMarket = filterMarket;

function renderHeatmap() {
  const sectors = {};
  marketStocks.forEach(s => {
    if (!sectors[s.sector]) sectors[s.sector] = [];
    sectors[s.sector].push(s.chgP);
  });
  const el = document.getElementById('heatmap-grid');
  el.innerHTML = Object.entries(sectors).map(([sec, vals]) => {
    const avg = vals.reduce((a, v) => a + v, 0) / vals.length;
    const intensity = Math.min(Math.abs(avg) / 3, 1);
    const color = avg >= 0
      ? `rgba(0,230,118,${0.15 + intensity * 0.6})`
      : `rgba(255,61,87,${0.15 + intensity * 0.6})`;
    return `<div class="heat-block" style="background:${color}">
      <div class="heat-name">${sec}</div>
      <div class="heat-val" style="color:${avg >= 0 ? '#00e676' : '#ff3d57'}">${sign(avg)}${avg.toFixed(2)}%</div>
    </div>`;
  }).join('');
}

function renderCurrency() {
  const el = document.getElementById('currency-list');
  el.innerHTML = CURRENCY_DATA.map(c =>
    `<div class="currency-row">
      <span class="curr-name">${c.name}</span>
      <span class="curr-val">${c.val}</span>
      <span class="${c.up ? 'up' : 'dn'}">${c.chg}</span>
    </div>`
  ).join('');
}

/* ── NEWS ── */
function renderNews() {
  const filtered = newsFilter === 'all' ? NEWS_DATA : NEWS_DATA.filter(n => n.cat === newsFilter);
  const el = document.getElementById('news-list');
  el.innerHTML = filtered.map(n =>
    `<div class="news-item">
      <div class="news-item-top">
        <span class="news-category cat-${n.cat}">${n.cat}</span>
        <span class="news-impact impact-${n.impact}">${n.impact.toUpperCase()}</span>
        <span style="font-size:10px;color:var(--text-muted);margin-left:auto">${n.source} · ${n.time}</span>
      </div>
      <div class="news-headline">${n.title}</div>
      <div class="news-summary">${n.summary}</div>
      ${n.affected.length ? `<div class="news-meta"><span>Related:</span>${n.affected.map(s => `<span style="color:var(--accent);font-weight:700">${s}</span>`).join(', ')}</div>` : ''}
    </div>`
  ).join('') || `<div style="padding:24px;color:var(--text-muted);text-align:center">No news in this category.</div>`;

  renderSentiment();
  renderTrending();
  renderIPO();
}

function filterNews(cat, btn) {
  newsFilter = cat === 'all' ? 'all' : cat;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderNews();
}
window.filterNews = filterNews;

function renderSentiment() {
  // Compute: count positive vs negative
  const pos = NEWS_DATA.filter(n => n.impact === 'positive').length;
  const neg = NEWS_DATA.filter(n => n.impact === 'negative').length;
  const total = NEWS_DATA.length;
  const score = Math.round((pos / total) * 100);
  const pct = score + '%';
  let label = score >= 65 ? 'BULLISH' : score >= 45 ? 'NEUTRAL' : 'BEARISH';
  let color = score >= 65 ? '#00e676' : score >= 45 ? '#f0b429' : '#ff3d57';
  document.getElementById('sentiment-block').innerHTML = `
    <div class="sentiment-score" style="color:${color}">${score}</div>
    <div class="sentiment-label">${label}</div>
    <div class="sentiment-meter">
      <div class="sentiment-needle" style="left:${pct}"></div>
    </div>
    <div class="sentiment-labels"><span>BEARISH</span><span>NEUTRAL</span><span>BULLISH</span></div>
    <div style="margin-top:12px;font-size:10px;color:var(--text-muted)">
      <div style="display:flex;justify-content:space-between;padding:3px 0"><span>Positive signals</span><span style="color:#00e676">${pos}</span></div>
      <div style="display:flex;justify-content:space-between;padding:3px 0"><span>Negative signals</span><span style="color:#ff3d57">${neg}</span></div>
      <div style="display:flex;justify-content:space-between;padding:3px 0"><span>Neutral signals</span><span style="color:var(--text-secondary)">${total - pos - neg}</span></div>
    </div>`;
}

function renderTrending() {
  document.getElementById('trending-list').innerHTML = TRENDING_STOCKS.map((t, i) =>
    `<div class="trending-item">
      <span class="trend-rank">${i + 1}</span>
      <span class="trend-sym" style="color:var(--accent)">${t.sym}</span>
      <span class="trend-mentions">${t.mentions} mentions</span>
    </div>`
  ).join('');
}

function renderIPO() {
  document.getElementById('ipo-list').innerHTML = IPO_DATA.map(p =>
    `<div class="ipo-item">
      <div class="ipo-name">${p.name}</div>
      <div class="ipo-meta">
        <span>${p.open} - ${p.close}</span>
        <span>${p.price}</span>
      </div>
      <div class="ipo-meta" style="margin-top:4px">
        <span>GMP: <span class="ipo-gmp ${p.pos ? 'up' : 'dn'}">${p.gmp}</span></span>
      </div>
    </div>`
  ).join('');
}

/* ── WATCHLIST ── */
function renderWatchlist() {
  const grid = document.getElementById('watchlist-grid');
  if (!watchlist.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;padding:40px;color:var(--text-muted);text-align:center">
      No stocks in watchlist.<br>Go to <b>MARKETS</b> and click ☆ to add stocks.
    </div>`;
  } else {
    grid.innerHTML = watchlist.map((w, i) => {
      const s = marketStocks.find(m => m.sym === w.sym) || w;
      const chgP = s.chgP || 0;
      return `<div class="wl-card">
        <button class="wl-remove" onclick="removeWatchlist(${i})">✕</button>
        <div class="wl-sym" style="color:var(--accent)">${w.sym}</div>
        <div class="wl-sector">${w.sector}</div>
        <div class="wl-price">₹${fmt(s.ltp)}</div>
        <div class="wl-chg ${updn(chgP)}">${sign(chgP)}${chgP.toFixed(2)}% today</div>
        <div class="wl-extras">
          <div class="wl-extra-item"><span class="wl-extra-label">52W HIGH</span><span class="wl-extra-val">₹${w.hi52 >= 1000 ? fmt(w.hi52) : w.hi52}</span></div>
          <div class="wl-extra-item"><span class="wl-extra-label">52W LOW</span><span class="wl-extra-val">₹${w.lo52 >= 1000 ? fmt(w.lo52) : w.lo52}</span></div>
        </div>
      </div>`;
    }).join('');
  }

  renderAlerts();
}

function removeWatchlist(i) {
  const sym = watchlist[i].sym;
  watchlist.splice(i, 1);
  localStorage.setItem('bt_watchlist', JSON.stringify(watchlist));
  showToast(`${sym} removed from watchlist.`);
  renderWatchlist();
}
window.removeWatchlist = removeWatchlist;

function renderAlerts() {
  const el = document.getElementById('alert-list');
  if (!alerts.length) { el.innerHTML = `<div style="padding:12px 14px;color:var(--text-muted);font-size:11px">No alerts set.</div>`; return; }
  el.innerHTML = alerts.map((a, i) =>
    `<div class="alert-item">
      <span class="alert-sym" style="color:var(--accent)">${a.sym}</span>
      <span class="alert-dir">${a.dir === 'above' ? '▲' : '▼'}</span>
      <span class="alert-price">₹${fmt(a.price)}</span>
      <button class="icon-btn" onclick="removeAlert(${i})">✕</button>
    </div>`
  ).join('');
}

function addAlert() {
  const sym = document.getElementById('alert-symbol').value;
  const price = parseFloat(document.getElementById('alert-price').value);
  const dir = document.getElementById('alert-dir').value;
  if (!sym || !price) { showToast('Please select symbol and enter price.'); return; }
  alerts.push({ sym, price, dir });
  localStorage.setItem('bt_alerts', JSON.stringify(alerts));
  document.getElementById('alert-price').value = '';
  showToast(`Alert set: ${sym} ${dir} ₹${fmt(price)}`);
  renderAlerts();
}
window.addAlert = addAlert;

function removeAlert(i) {
  alerts.splice(i, 1);
  localStorage.setItem('bt_alerts', JSON.stringify(alerts));
  renderAlerts();
}
window.removeAlert = removeAlert;

function populateAlertSymbols() {
  const sel = document.getElementById('alert-symbol');
  const syms = [...new Set([...holdings.map(h => h.symbol), ...watchlist.map(w => w.sym)])].sort();
  sel.innerHTML = `<option value="">Select Symbol</option>` + syms.map(s => `<option value="${s}">${s}</option>`).join('');
}

/* ── ALERT CHECKING ── */
function checkAlerts() {
  alerts.forEach(a => {
    const s = marketStocks.find(m => m.sym === a.sym);
    if (!s) return;
    const triggered = a.dir === 'above' ? s.ltp >= a.price : s.ltp <= a.price;
    if (triggered) {
      showToast(`🔔 ALERT: ${a.sym} ${a.dir === 'above' ? 'crossed above' : 'fell below'} ₹${fmt(a.price)}!`);
    }
  });
}
setInterval(checkAlerts, 10000);

/* ── SEARCH ADD WATCHLIST ── */
const wlInput = document.getElementById('wl-search');
if (wlInput) {
  wlInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const sym = wlInput.value.trim().toUpperCase();
      const stock = marketStocks.find(s => s.sym === sym);
      if (!stock) { showToast(`Symbol '${sym}' not found in NIFTY50.`); return; }
      if (watchlist.find(w => w.sym === sym)) { showToast(`${sym} already in watchlist.`); return; }
      watchlist.push({ sym: stock.sym, sector: stock.sector, ltp: stock.ltp, chg: stock.chg, chgP: stock.chgP, hi52: stock.hi52, lo52: stock.lo52 });
      localStorage.setItem('bt_watchlist', JSON.stringify(watchlist));
      wlInput.value = '';
      showToast(`${sym} added to watchlist.`);
      renderWatchlist();
    }
  });
}

/* ── LOAD HOLDINGS FROM BACKEND ── */
async function loadHoldings() {
  try {
    const r = await fetch('http://localhost:5000/api/holdings');
    if (r.ok) {
      const data = await r.json();
      holdings = data.holdings || [];
      return;
    }
  } catch (e) {
    console.warn('Backend holdings fetch failed:', e.message);
  }
  // Backend offline — holdings stay empty
  holdings = [];
}

/* ── SYNC PORTFOLIO FROM GROWW ── */
async function syncFromGroww() {
  showToast('Syncing portfolio from Groww…');
  try {
    const r = await fetch('http://localhost:5000/api/portfolio/sync');
    if (r.ok) {
      const data = await r.json();
      showToast(`✅ Synced ${data.holdings} holdings from Groww (₹${data.invested.toLocaleString('en-IN')})`);
      // Reload holdings (Groww sync saves to holdings.json)
      await loadHoldings();
      renderPortfolio();
      renderDashboard();
    } else {
      const err = await r.json();
      showToast(`❌ Groww sync failed: ${err.error || 'Unknown error'}`);
    }
  } catch (e) {
    showToast(`❌ Groww sync failed: ${e.message}`);
  }
}
window.syncFromGroww = syncFromGroww;

/* ── BOOTSTRAP ── */
async function init() {
  await loadHoldings();
  setupGlobalSearch();
  renderIndexStrip();
  renderTicker();
  renderDashboard();
  renderPortfolio();
}

init();
