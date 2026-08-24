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

DEFAULT_CSV_CONTENT = """MARKET,종목명,종목코드,매수가,수량
KOSPI,TIGER 미국 S&P500,360750,27910,35
KOSPI,TIGER 미국 나스닥100,133690,194325,7
KOSPI,삼성전자,005930,269000,190
KOSPI,KoAct 미국 나스닥 성장기업 액티브,0015B0,21730,100
KOSPI,현대차,005380,430500,50
KOSPI,SK하이닉스,000660,1924000,21
KOSPI,KODEX 전고체배터리ESS TOP2플러스,0209D0,7205,236
KOSPI,DB하이텍,000990,111000,20
KOSPI,HANARO Fn K-반도체,395270,59120,150
KOSPI,LS ELECTRIC,010120,190000,4
KOSPI,한미반도체,042700,209000,4
KOSPI,KODEX 코스피100,237350,89405,13
KOSPI,삼성전기,009150,1325000,3
AMEX,State Street SPDR S&P 500 ETF Turst,SPY,$797.36,20
NASDAQ,테슬라,TSLA,$420.79,1"""

# 기본 종목 사전
BUILTIN_STOCK_DICT = {
    '삼성전자': {'code': '005930', 'market': 'KOSPI'},
    '삼성전자우': {'code': '005935', 'market': 'KOSPI'},
    'SK하이닉스': {'code': '000660', 'market': 'KOSPI'},
    '현대차': {'code': '005380', 'market': 'KOSPI'},
    'DB하이텍': {'code': '000990', 'market': 'KOSPI'},
    'LS ELECTRIC': {'code': '010120', 'market': 'KOSPI'},
    '한미반도체': {'code': '042700', 'market': 'KOSPI'},
    '삼성전기': {'code': '009150', 'market': 'KOSPI'},
    'TIGER 미국 S&P500': {'code': '360750', 'market': 'KOSPI'},
    'TIGER 미국 나스닥100': {'code': '133690', 'market': 'KOSPI'},
    'KoAct 미국 나스닥 성장기업 액티브': {'code': '0015B0', 'market': 'KOSPI'},
    'KODEX 전고체배터리ESS TOP2플러스': {'code': '0209D0', 'market': 'KOSPI'},
    'HANARO Fn K-반도체': {'code': '395270', 'market': 'KOSPI'},
    'KODEX 코스피100': {'code': '237350', 'market': 'KOSPI'},
    'SPY': {'code': 'SPY', 'market': 'AMEX'},
    '테슬라': {'code': 'TSLA', 'market': 'NASDAQ'},
    'TSLA': {'code': 'TSLA', 'market': 'NASDAQ'},
    '애플': {'code': 'AAPL', 'market': 'NASDAQ'},
    'AAPL': {'code': 'AAPL', 'market': 'NASDAQ'},
    '엔비디아': {'code': 'NVDA', 'market': 'NASDAQ'},
    'NVDA': {'code': 'NVDA', 'market': 'NASDAQ'},
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
    Google Finance에서 한국 및 해외 종목 시세 조회
    """
    clean_sym = symbol.strip().upper()
    is_korean = market.upper() in ['KOSPI', 'KOSDAQ']
    
    if is_korean:
        candidates = [f"{clean_sym}:KRX", f"{clean_sym}:KOSPI", f"{clean_sym}:KOSDAQ"]
        default_currency = 'KRW'
    else:
        candidates = [f"{clean_sym}:{market}", f"{clean_sym}:NYSEARCA", f"{clean_sym}:NASDAQ", f"{clean_sym}:NYSE", f"{clean_sym}:AMEX", clean_sym]
        default_currency = 'USD'

    for q in candidates:
        url = f"https://www.google.com/finance/quote/{q}"
        try:
            res = requests.get(url, headers=HEADERS, timeout=4)
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
                                'query': q,
                                'currentPrice': current_price,
                                'changePrice': round(change_price, 2),
                                'changeRate': round(change_rate, 2),
                                'currency': default_currency,
                                'googleUrl': f"https://www.google.com/finance/quote/{q}",
                                'success': True
                            }
        except Exception:
            pass

    return {
        'symbol': clean_sym,
        'query': candidates[0],
        'currentPrice': None,
        'changePrice': 0,
        'changeRate': 0,
        'currency': default_currency,
        'googleUrl': f"https://www.google.com/finance/quote/{clean_sym}",
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
    CSV 파일 로드 및 파싱 ($ 기호 및 Market 구분 감지)
    """
    stocks = []
    if not os.path.exists(CSV_PATH):
        os.makedirs(os.path.dirname(CSV_PATH), exist_ok=True)
        with open(CSV_PATH, 'w', encoding='utf-8') as f:
            f.write(DEFAULT_CSV_CONTENT)

    with open(CSV_PATH, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader):
            market = (row.get('MARKET') or row.get('market') or 'KOSPI').strip().upper()
            name = (row.get('종목명') or row.get('name') or '').strip()
            code = (row.get('종목코드') or row.get('code') or '').strip()
            
            raw_buy_str = str(row.get('매수가') or row.get('buyPrice') or '0').strip()
            raw_quantity_str = str(row.get('수량') or row.get('quantity') or '0').strip()
            
            has_dollar_sign = '$' in raw_buy_str
            clean_buy_str = raw_buy_str.replace('$', '').replace(',', '').strip()
            clean_qty_str = raw_quantity_str.replace(',', '').strip()
            
            buy_price = float(clean_buy_str) if clean_buy_str else 0.0
            quantity = float(clean_qty_str) if clean_qty_str else 0.0

            if name or code:
                stocks.append({
                    'id': idx + 1,
                    'market': market,
                    'name': name,
                    'code': code,
                    'buyPrice': buy_price,
                    'hasDollarSign': has_dollar_sign,
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
                    '매수가': f"${s.get('buyPrice', 0)}" if s.get('isDollar') or s.get('hasDollarSign') else s.get('buyPrice', 0),
                    '수량': s.get('quantity', 0)
                })

def process_single_stock(stock, usd_krw_rate):
    name = stock['name']
    code = stock['code']
    market = stock['market'].upper()
    buy_price = stock['buyPrice']
    has_dollar_sign = stock.get('hasDollarSign', False)
    quantity = stock['quantity']

    if not code and name:
        if name in BUILTIN_STOCK_DICT:
            code = BUILTIN_STOCK_DICT[name]['code']
            market = BUILTIN_STOCK_DICT[name]['market']

    is_dollar_stock = (market not in ['KOSPI', 'KOSDAQ']) or has_dollar_sign

    quote_info = {'currentPrice': buy_price, 'changeRate': 0.0, 'changePrice': 0, 'success': False}
    if code:
        quote_info = fetch_google_stock_quote(code, market)

    raw_curr_price = quote_info['currentPrice'] if quote_info['currentPrice'] is not None else buy_price

    if is_dollar_stock:
        current_price_usd = raw_curr_price
        buy_price_usd = buy_price

        total_buy_amount = round(buy_price_usd * quantity * usd_krw_rate)
        total_current_amount = round(current_price_usd * quantity * usd_krw_rate)
        profit_loss = total_current_amount - total_buy_amount
        return_rate = ((current_price_usd - buy_price_usd) / buy_price_usd * 100) if buy_price_usd > 0 else 0.0

        return {
            'id': stock['id'],
            'market': market,
            'name': name or f"종목-{code}",
            'code': code,
            'currency': 'USD',
            'isDollar': True,
            'buyPrice': buy_price_usd,
            'currentPrice': current_price_usd,
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
        current_price_krw = raw_curr_price
        buy_price_krw = buy_price

        total_buy_amount = round(buy_price_krw * quantity)
        total_current_amount = round(current_price_krw * quantity)
        profit_loss = total_current_amount - total_buy_amount
        return_rate = ((current_price_krw - buy_price_krw) / buy_price_krw * 100) if buy_price_krw > 0 else 0.0

        return {
            'id': stock['id'],
            'market': market,
            'name': name or f"종목-{code}",
            'code': code,
            'currency': 'KRW',
            'isDollar': False,
            'buyPrice': buy_price_krw,
            'currentPrice': current_price_krw,
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
    
    with ThreadPoolExecutor(max_workers=12) as executor:
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
