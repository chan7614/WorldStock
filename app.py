import os
import sys
import csv
import json
import re
import urllib.parse
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

# Windows 콘솔 인코딩 대응
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from flask import Flask, render_template, request, jsonify, send_file
import requests

app = Flask(__name__, static_folder='static', template_folder='templates')

CSV_PATH = os.path.join(os.path.dirname(__file__), 'data', 'portfolio.csv')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9,ko-KR;q=0.8,ko;q=0.7'
}

# 기본 종목 사전 (한국 및 대표 미국 주식)
BUILTIN_STOCK_DICT = {
    # 한국 주식
    '삼성전자': {'code': '005930', 'market': 'KOSPI'},
    '삼성전자우': {'code': '005935', 'market': 'KOSPI'},
    'SK하이닉스': {'code': '000660', 'market': 'KOSPI'},
    'LG에너지솔루션': {'code': '373220', 'market': 'KOSPI'},
    '삼성바이오로직스': {'code': '207940', 'market': 'KOSPI'},
    '현대차': {'code': '005380', 'market': 'KOSPI'},
    '기아': {'code': '000270', 'market': 'KOSPI'},
    '셀트리온': {'code': '068270', 'market': 'KOSPI'},
    'KB금융': {'code': '105560', 'market': 'KOSPI'},
    'NAVER': {'code': '035420', 'market': 'KOSPI'},
    '네이버': {'code': '035420', 'market': 'KOSPI'},
    '신한지주': {'code': '055550', 'market': 'KOSPI'},
    'POSCO홀딩스': {'code': '005490', 'market': 'KOSPI'},
    '포스코홀딩스': {'code': '005490', 'market': 'KOSPI'},
    '현대모비스': {'code': '012330', 'market': 'KOSPI'},
    '카카오': {'code': '035720', 'market': 'KOSPI'},
    '에코프로비엠': {'code': '247540', 'market': 'KOSDAQ'},
    '에코프로': {'code': '086520', 'market': 'KOSDAQ'},
    '알테오젠': {'code': '196170', 'market': 'KOSDAQ'},
    'HLB': {'code': '028300', 'market': 'KOSDAQ'},
    # 미국 주식
    '애플': {'code': 'AAPL', 'market': 'NASDAQ'},
    'APPLE': {'code': 'AAPL', 'market': 'NASDAQ'},
    'AAPL': {'code': 'AAPL', 'market': 'NASDAQ'},
    '엔비디아': {'code': 'NVDA', 'market': 'NASDAQ'},
    'NVIDIA': {'code': 'NVDA', 'market': 'NASDAQ'},
    'NVDA': {'code': 'NVDA', 'market': 'NASDAQ'},
    '테슬라': {'code': 'TSLA', 'market': 'NASDAQ'},
    'TESLA': {'code': 'TSLA', 'market': 'NASDAQ'},
    'TSLA': {'code': 'TSLA', 'market': 'NASDAQ'},
    '마이크로소프트': {'code': 'MSFT', 'market': 'NASDAQ'},
    'MICROSOFT': {'code': 'MSFT', 'market': 'NASDAQ'},
    'MSFT': {'code': 'MSFT', 'market': 'NASDAQ'},
    '알파벳': {'code': 'GOOGL', 'market': 'NASDAQ'},
    '구글': {'code': 'GOOGL', 'market': 'NASDAQ'},
    'GOOGL': {'code': 'GOOGL', 'market': 'NASDAQ'},
    '아마존': {'code': 'AMZN', 'market': 'NASDAQ'},
    'AMAZON': {'code': 'AMZN', 'market': 'NASDAQ'},
    'AMZN': {'code': 'AMZN', 'market': 'NASDAQ'},
    '메타': {'code': 'META', 'market': 'NASDAQ'},
    'META': {'code': 'META', 'market': 'NASDAQ'},
    'TSMC': {'code': 'TSM', 'market': 'NYSE'},
    'TSM': {'code': 'TSM', 'market': 'NYSE'},
}

def get_usd_krw_rate():
    """
    Google Finance에서 실시간 USD/KRW 환율 수집
    """
    try:
        url = "https://www.google.com/finance/quote/USD-KRW"
        res = requests.get(url, headers=HEADERS, timeout=4)
        if res.status_code == 200:
            html = res.text
            callbacks = re.findall(r'AF_initDataCallback\((.*?)\);', html, re.DOTALL)
            for cb in callbacks:
                if 'USD' in cb and 'KRW' in cb:
                    matches = re.findall(r'\[\s*([1-2][0-9]{3}\.[0-9]+)\s*,\s*([-\d\.]+)\s*,\s*([-\d\.]+)\s*,\s*2\s*,\s*2\s*,\s*2\s*\]', cb)
                    if matches:
                        rate = float(matches[0][0])
                        if 1000 <= rate <= 2500:
                            return round(rate, 2)
                    nums = re.findall(r'\"USD-KRW\"[^\"]*?([1-2][0-9]{3}\.[0-9]+)', cb)
                    if nums:
                        return round(float(nums[0]), 2)
    except Exception as e:
        print("환율 수집 오류:", e)
    return 1380.0

def fetch_google_stock_quote(symbol, market="KOSPI"):
    """
    Google Finance에서 한국(KOSPI/KOSDAQ) 및 미국(NASDAQ/NYSE) 실시간 시세 조회
    """
    clean_sym = symbol.strip().upper()
    is_us = market in ['NASDAQ', 'NYSE', 'AMEX', 'US'] or clean_sym.isalpha()

    if is_us:
        quote_query = f"{clean_sym}:NASDAQ" if market == 'NASDAQ' else f"{clean_sym}:NYSE" if market == 'NYSE' else f"{clean_sym}:NASDAQ"
        currency = 'USD'
    else:
        code_6 = clean_sym.zfill(6)
        quote_query = f"{code_6}:KRX" if market == 'KOSPI' else f"{code_6}:KOSDAQ" if market == 'KOSDAQ' else f"{code_6}:KRX"
        currency = 'KRW'

    url = f"https://www.google.com/finance/quote/{quote_query}"
    
    try:
        res = requests.get(url, headers=HEADERS, timeout=4.5)
        if res.status_code == 200:
            html = res.text
            callbacks = re.findall(r'AF_initDataCallback\((.*?)\);', html, re.DOTALL)
            
            for cb in callbacks:
                if clean_sym in cb:
                    matches = re.findall(r'\[\s*([\d\.]+)\s*,\s*([-\d\.]+)\s*,\s*([-\d\.]+)\s*,\s*2\s*,\s*2\s*,\s*2\s*\]', cb)
                    if matches:
                        current_price = float(matches[0][0])
                        change_price = float(matches[0][1])
                        change_rate = float(matches[0][2])

                        return {
                            'symbol': clean_sym,
                            'query': quote_query,
                            'currentPrice': current_price,
                            'changePrice': round(change_price, 2),
                            'changeRate': round(change_rate, 2),
                            'currency': currency,
                            'isUs': is_us,
                            'googleUrl': f"https://www.google.com/finance/quote/{quote_query}",
                            'success': True
                        }
    except Exception as e:
        print(f"Error fetching Google quote for {symbol}:", e)

    return {
        'symbol': clean_sym,
        'query': quote_query if 'quote_query' in locals() else symbol,
        'currentPrice': None,
        'changePrice': 0,
        'changeRate': 0,
        'currency': currency,
        'isUs': is_us,
        'googleUrl': f"https://www.google.com/finance/quote/{quote_query if 'quote_query' in locals() else clean_sym}",
        'success': False
    }

def search_stock_code(query):
    """
    종목명 또는 심볼로 종목 검색
    """
    if not query:
        return []
    clean_q = query.strip().lower()
    results = []

    for name, info in BUILTIN_STOCK_DICT.items():
        if clean_q in name.lower() or clean_q in info['code'].lower():
            if not any(r['code'] == info['code'] for r in results):
                results.append({
                    'code': info['code'],
                    'name': name,
                    'market': info['market']
                })
    return results

def load_portfolio_csv():
    """
    CSV 파일 로드
    """
    stocks = []
    if not os.path.exists(CSV_PATH):
        os.makedirs(os.path.dirname(CSV_PATH), exist_ok=True)
        default_csv = """MARKET,종목명,종목코드,매수가,수량
KOSPI,삼성전자,005930,71500,100
KOSPI,SK하이닉스,000660,182000,30
NASDAQ,애플,AAPL,195.50,40
NASDAQ,엔비디아,NVDA,125.00,50
NASDAQ,테슬라,TSLA,210.00,30
KOSPI,NAVER,035420,198000,20
KOSDAQ,에코프로비엠,247540,165000,25
KOSPI,카카오,035720,46500,40"""
        with open(CSV_PATH, 'w', encoding='utf-8') as f:
            f.write(default_csv)

    with open(CSV_PATH, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader):
            market = (row.get('MARKET') or row.get('market') or 'KOSPI').strip().upper()
            name = (row.get('종목명') or row.get('name') or '').strip()
            code = (row.get('종목코드') or row.get('code') or '').strip()
            
            raw_buy_price = str(row.get('매수가') or row.get('buyPrice') or '0').replace(',', '')
            raw_quantity = str(row.get('수량') or row.get('quantity') or '0').replace(',', '')
            
            buy_price = float(raw_buy_price) if raw_buy_price else 0.0
            quantity = float(raw_quantity) if raw_quantity else 0.0

            if name or code:
                stocks.append({
                    'id': idx + 1,
                    'market': market,
                    'name': name,
                    'code': code,
                    'buyPrice': buy_price,
                    'quantity': quantity
                })
    return stocks

def save_portfolio_csv(stocks_or_raw):
    """
    포트폴리오 CSV 저장
    """
    os.makedirs(os.path.dirname(CSV_PATH), exist_ok=True)
    if isinstance(stocks_or_raw, str):
        with open(CSV_PATH, 'w', encoding='utf-8') as f:
            f.write(stocks_or_raw)
    else:
        with open(CSV_PATH, 'w', encoding='utf-8', newline='') as f:
            fieldnames = ['MARKET', '종목명', '종목코드', '매수가', '수량']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for s in stocks_or_raw:
                writer.writerow({
                    'MARKET': s.get('market', 'KOSPI'),
                    '종목명': s.get('name', ''),
                    '종목코드': s.get('code', ''),
                    '매수가': s.get('buyPrice', 0),
                    '수량': s.get('quantity', 0)
                })

def process_single_stock(stock, usd_krw_rate):
    name = stock['name']
    code = stock['code']
    market = stock['market']
    buy_price = stock['buyPrice']
    quantity = stock['quantity']

    if not code and name:
        if name in BUILTIN_STOCK_DICT:
            code = BUILTIN_STOCK_DICT[name]['code']
            market = BUILTIN_STOCK_DICT[name]['market']

    is_us = market in ['NASDAQ', 'NYSE', 'AMEX', 'US'] or (code and code.isalpha())

    quote_info = {'currentPrice': buy_price, 'changeRate': 0.0, 'changePrice': 0, 'success': False, 'currency': 'USD' if is_us else 'KRW'}
    if code:
        quote_info = fetch_google_stock_quote(code, market)

    raw_curr_price = quote_info['currentPrice'] if quote_info['currentPrice'] is not None else buy_price

    if is_us:
        current_price_usd = raw_curr_price
        current_price_krw = round(current_price_usd * usd_krw_rate)
        
        if buy_price < 5000:
            buy_price_usd = buy_price
            buy_price_krw = round(buy_price_usd * usd_krw_rate)
        else:
            buy_price_krw = buy_price
            buy_price_usd = round(buy_price / usd_krw_rate, 2)

        total_buy_amount = buy_price_krw * quantity
        total_current_amount = current_price_krw * quantity
        profit_loss = total_current_amount - total_buy_amount
        return_rate = ((current_price_usd - buy_price_usd) / buy_price_usd * 100) if buy_price_usd > 0 else 0.0

        return {
            'id': stock['id'],
            'market': market,
            'name': name or f"종목-{code}",
            'code': code,
            'currency': 'USD',
            'isUs': True,
            'buyPrice': buy_price_usd,
            'buyPriceKrw': buy_price_krw,
            'currentPrice': current_price_usd,
            'currentPriceKrw': current_price_krw,
            'changeRate': quote_info.get('changeRate', 0.0),
            'changePrice': quote_info.get('changePrice', 0.0),
            'quantity': quantity,
            'totalBuyAmount': total_buy_amount,
            'totalCurrentAmount': total_current_amount,
            'profitLoss': profit_loss,
            'returnRate': round(return_rate, 2),
            'googleUrl': quote_info.get('googleUrl', f"https://www.google.com/finance/quote/{code}"),
            'isPriceLoaded': quote_info.get('success', False)
        }
    else:
        current_price = raw_curr_price
        total_buy_amount = buy_price * quantity
        total_current_amount = current_price * quantity
        profit_loss = total_current_amount - total_buy_amount
        return_rate = ((current_price - buy_price) / buy_price * 100) if buy_price > 0 else 0.0

        return {
            'id': stock['id'],
            'market': market,
            'name': name or f"종목-{code}",
            'code': code,
            'currency': 'KRW',
            'isUs': False,
            'buyPrice': buy_price,
            'buyPriceKrw': buy_price,
            'currentPrice': current_price,
            'currentPriceKrw': current_price,
            'changeRate': quote_info.get('changeRate', 0.0),
            'changePrice': quote_info.get('changePrice', 0),
            'quantity': quantity,
            'totalBuyAmount': total_buy_amount,
            'totalCurrentAmount': total_current_amount,
            'profitLoss': profit_loss,
            'returnRate': round(return_rate, 2),
            'googleUrl': quote_info.get('googleUrl', f"https://www.google.com/finance/quote/{code}:KRX"),
            'isPriceLoaded': quote_info.get('success', False)
        }

# --- 웹 라우트 ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/stocks', methods=['GET'])
def get_stocks():
    raw_stocks = load_portfolio_csv()
    
    # 환율과 종목 시세를 병렬로 초고속 수집
    with ThreadPoolExecutor(max_workers=10) as executor:
        rate_future = executor.submit(get_usd_krw_rate)
        usd_krw_rate = rate_future.result()
        
        futures = [executor.submit(process_single_stock, stock, usd_krw_rate) for stock in raw_stocks]
        processed_stocks = [f.result() for f in futures]

    total_buy_amount = sum(s['totalBuyAmount'] for s in processed_stocks)
    total_current_amount = sum(s['totalCurrentAmount'] for s in processed_stocks)
    total_profit_loss = total_current_amount - total_buy_amount
    overall_return_rate = (total_profit_loss / total_buy_amount * 100) if total_buy_amount > 0 else 0.0
    average_return_rate = (sum(s['returnRate'] for s in processed_stocks) / len(processed_stocks)) if processed_stocks else 0.0

    return jsonify({
        'success': True,
        'timestamp': datetime.now().isoformat(),
        'usdKrwRate': usd_krw_rate,
        'summary': {
            'totalStocks': len(processed_stocks),
            'totalBuyAmount': total_buy_amount,
            'totalCurrentAmount': total_current_amount,
            'totalProfitLoss': total_profit_loss,
            'overallReturnRate': round(overall_return_rate, 2),
            'averageReturnRate': round(average_return_rate, 2),
            'usdKrwRate': usd_krw_rate
        },
        'stocks': processed_stocks
    })

@app.route('/api/search', methods=['GET'])
def search_stock():
    q = request.args.get('q', '')
    results = search_stock_code(q)
    return jsonify(results)

@app.route('/api/stocks/save', methods=['POST'])
def save_stocks():
    try:
        data = request.get_json() or {}
        raw_csv = data.get('rawCsv')
        stocks = data.get('stocks')
        if raw_csv:
            save_portfolio_csv(raw_csv)
        elif stocks is not None:
            save_portfolio_csv(stocks)
        return jsonify({'success': True, 'message': '포트폴리오가 저장되었습니다.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/download-csv', methods=['GET'])
def download_csv():
    if os.path.exists(CSV_PATH):
        return send_file(CSV_PATH, as_attachment=True, download_name=f"portfolio_{datetime.now().strftime('%Y%m%d')}.csv")
    return jsonify({'error': 'File not found'}), 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 [주식의 세계] 웹서비스가 시작되었습니다 -> http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
