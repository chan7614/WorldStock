import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const CSV_FILE_PATH = path.join(__dirname, 'data', 'portfolio.csv');

// 네이버 증권 시세 조회 헬퍼 함수
async function fetchStockPriceFromNaver(code) {
  const cleanCode = String(code).trim().padStart(6, '0');
  
  // 1. 모바일 API 시도
  try {
    const res = await axios.get(`https://m.stock.naver.com/api/stock/${cleanCode}/basic`, {
      timeout: 3500,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://m.stock.naver.com/'
      }
    });

    if (res.data && (res.data.closePrice || res.data.nowPrice)) {
      const rawPrice = res.data.closePrice || res.data.nowPrice;
      const currentPrice = typeof rawPrice === 'string' ? parseInt(rawPrice.replace(/,/g, ''), 10) : Number(rawPrice);
      const stockName = res.data.stockName || '';
      const changeRate = parseFloat(res.data.fluctuationsRatio || '0');
      const changePrice = parseInt(String(res.data.compareToPreviousClosePrice || '0').replace(/,/g, ''), 10);
      const marketStatus = res.data.stockExchangeType?.name || 'KRX';
      
      return {
        code: cleanCode,
        name: stockName,
        currentPrice,
        changeRate,
        changePrice,
        marketStatus,
        success: true
      };
    }
  } catch (err) {
    // 폴백 진행
  }

  // 2. 실시간 폴링 API 폴백 시도
  try {
    const res = await axios.get(`https://polling.finance.naver.com/api/realtime?query=SERVICE_ITEM:${cleanCode}`, {
      timeout: 3500,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });

    const item = res.data?.result?.areas?.[0]?.datas?.[0];
    if (item && item.nv) {
      return {
        code: cleanCode,
        name: item.nm || '',
        currentPrice: Number(item.nv),
        changeRate: Number(item.cr || 0),
        changePrice: Number(item.cv || 0),
        marketStatus: 'KRX',
        success: true
      };
    }
  } catch (err) {
    // 폴백 진행
  }

  // 3. 웹페이지 파싱 폴백
  try {
    const res = await axios.get(`https://finance.naver.com/item/main.naver?code=${cleanCode}`, {
      timeout: 4000,
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });

    const decoder = new TextDecoder('euc-kr');
    const html = decoder.decode(res.data);
    
    // 현재가 정규식 검색
    const priceMatch = html.match(/<dd>현재가\s+([\d,]+)/) || html.match(/class="no_today"[^>]*>[\s\S]*?<span class="blind">([\d,]+)<\/span>/);
    const nameMatch = html.match(/<title>([^:]+)\s*:/) || html.match(/<h2><a href="[^"]*">([^<]+)<\/a><\/h2>/);

    if (priceMatch && priceMatch[1]) {
      const currentPrice = parseInt(priceMatch[1].replace(/,/g, ''), 10);
      const name = nameMatch ? nameMatch[1].trim() : '';
      return {
        code: cleanCode,
        name,
        currentPrice,
        changeRate: 0,
        changePrice: 0,
        marketStatus: 'KRX',
        success: true
      };
    }
  } catch (err) {
    console.error(`Failed to fetch price for ${cleanCode}:`, err.message);
  }

  return {
    code: cleanCode,
    name: '',
    currentPrice: null,
    changeRate: 0,
    changePrice: 0,
    marketStatus: 'UNKNOWN',
    success: false,
    error: '시세 정보를 가져올 수 없습니다.'
  };
}

// 종목명으로 종목코드 검색 함수
async function searchStockCode(query) {
  try {
    const res = await axios.get(`https://ac.finance.naver.com/ac?q=${encodeURIComponent(query)}&q_enc=utf-8&st=1&r_lt=1&r_format=json&r_enc=utf-8`, {
      timeout: 3000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      }
    });
    
    const items = res.data?.items?.[0];
    if (items && items.length > 0) {
      // items 구조: [ [종목코드, 종목명, 시장, ...], ... ]
      return items.map(item => ({
        code: item[0],
        name: item[1],
        market: item[2] || 'KOSPI'
      }));
    }
  } catch (err) {
    console.error(`Search error for ${query}:`, err.message);
  }
  return [];
}

// 1. 포트폴리오 CSV 로드 및 실시간 시세 결합 API
app.get('/api/stocks', async (req, res) => {
  try {
    let csvContent = '';
    
    if (fs.existsSync(CSV_FILE_PATH)) {
      csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
    } else {
      // 기본 데이터
      csvContent = `MARKET,종목명,종목코드,매수가,수량
KOSPI,삼성전자,005930,71500,100
KOSPI,SK하이닉스,000660,182000,30
KOSPI,NAVER,035420,198000,20
KOSPI,현대차,005380,235000,15
KOSDAQ,에코프로비엠,247540,165000,25
KOSPI,카카오,035720,46500,40
KOSDAQ,알테오젠,196170,280000,10`;
    }

    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = parsed.data;

    // 각 종목별 네이버 증권 시세 병렬 수집
    const stockPromises = rows.map(async (row, index) => {
      let market = (row.MARKET || row.market || 'KOSPI').trim();
      let name = (row['종목명'] || row.name || '').trim();
      let code = (row['종목코드'] || row.code || '').trim();
      const buyPrice = parseFloat(String(row['매수가'] || row.buyPrice || '0').replace(/,/g, '')) || 0;
      const quantity = parseFloat(String(row['수량'] || row.quantity || '0').replace(/,/g, '')) || 0;

      // 종목코드가 없으면 종목명으로 자동 검색
      if (!code && name) {
        const searchResults = await searchStockCode(name);
        if (searchResults.length > 0) {
          code = searchResults[0].code;
          if (!market) market = searchResults[0].market;
        }
      }

      let priceInfo = { currentPrice: buyPrice, changeRate: 0, changePrice: 0, success: false };
      if (code) {
        priceInfo = await fetchStockPriceFromNaver(code);
        if (!name && priceInfo.name) {
          name = priceInfo.name;
        }
      }

      const currentPrice = priceInfo.currentPrice !== null ? priceInfo.currentPrice : buyPrice;
      const totalBuyAmount = buyPrice * quantity;
      const totalCurrentAmount = currentPrice * quantity;
      const profitLoss = totalCurrentAmount - totalBuyAmount;
      const returnRate = buyPrice > 0 ? ((currentPrice - buyPrice) / buyPrice) * 100 : 0;

      return {
        id: index + 1,
        market,
        name: name || `종목-${code}`,
        code,
        buyPrice,
        quantity,
        currentPrice,
        changeRate: priceInfo.changeRate || 0,
        changePrice: priceInfo.changePrice || 0,
        totalBuyAmount,
        totalCurrentAmount,
        profitLoss,
        returnRate: parseFloat(returnRate.toFixed(2)),
        isPriceLoaded: priceInfo.success,
      };
    });

    const stocks = await Promise.all(stockPromises);

    // 전체 통계 계산
    const totalBuyAmount = stocks.reduce((acc, s) => acc + s.totalBuyAmount, 0);
    const totalCurrentAmount = stocks.reduce((acc, s) => acc + s.totalCurrentAmount, 0);
    const totalProfitLoss = totalCurrentAmount - totalBuyAmount;
    const overallReturnRate = totalBuyAmount > 0 ? ((totalProfitLoss / totalBuyAmount) * 100) : 0;
    const averageReturnRate = stocks.length > 0 ? (stocks.reduce((acc, s) => acc + s.returnRate, 0) / stocks.length) : 0;

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalStocks: stocks.length,
        totalBuyAmount,
        totalCurrentAmount,
        totalProfitLoss,
        overallReturnRate: parseFloat(overallReturnRate.toFixed(2)),
        averageReturnRate: parseFloat(averageReturnRate.toFixed(2)),
      },
      stocks,
    });
  } catch (error) {
    console.error('Error in /api/stocks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. 단일 종목 시세 조회 API
app.get('/api/price/:code', async (req, res) => {
  try {
    const code = req.params.code;
    const priceInfo = await fetchStockPriceFromNaver(code);
    res.json(priceInfo);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. 종목 검색 API
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    if (!query) {
      return res.json([]);
    }
    const results = await searchStockCode(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. CSV 포트폴리오 저장/업로드 API
app.post('/api/stocks/save', (req, res) => {
  try {
    const { stocks, rawCsv } = req.body;
    let csvDataToSave = rawCsv;

    if (!csvDataToSave && Array.isArray(stocks)) {
      // 배열로부터 CSV 생성
      const csvRows = stocks.map(s => ({
        MARKET: s.market || 'KOSPI',
        '종목명': s.name || '',
        '종목코드': s.code || '',
        '매수가': s.buyPrice || 0,
        '수량': s.quantity || 0,
      }));
      csvDataToSave = Papa.unparse(csvRows);
    }

    if (!csvDataToSave) {
      return res.status(400).json({ success: false, error: '저장할 데이터가 없습니다.' });
    }

    // 디렉토리 확인 및 저장
    const dataDir = path.dirname(CSV_FILE_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(CSV_FILE_PATH, csvDataToSave, 'utf-8');
    res.json({ success: true, message: '포트폴리오가 성공적으로 저장되었습니다.' });
  } catch (error) {
    console.error('Error saving portfolio:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. 정적 파일 서빙 (프로덕션 빌드 시)
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 [주식의 세계] 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});

export { app, fetchStockPriceFromNaver, searchStockCode };
