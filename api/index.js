import express from 'express';
import cors from 'cors';
import axios from 'axios';
import Papa from 'papaparse';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const DEFAULT_CSV = `MARKET,종목명,종목코드,매수가,수량
KOSPI,삼성전자,005930,71500,100
KOSPI,SK하이닉스,000660,182000,30
KOSPI,NAVER,035420,198000,20
KOSPI,현대차,005380,235000,15
KOSDAQ,에코프로비엠,247540,165000,25
KOSPI,카카오,035720,46500,40
KOSDAQ,알테오젠,196170,280000,10`;

let inMemoryCsv = DEFAULT_CSV;

async function fetchStockPriceFromNaver(code) {
  const cleanCode = String(code).trim().padStart(6, '0');
  
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
    // fallback
  }

  try {
    const res = await axios.get(`https://polling.finance.naver.com/api/realtime?query=SERVICE_ITEM:${cleanCode}`, {
      timeout: 3500,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
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
    // fallback
  }

  return {
    code: cleanCode,
    name: '',
    currentPrice: null,
    changeRate: 0,
    changePrice: 0,
    marketStatus: 'UNKNOWN',
    success: false
  };
}

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
      return items.map(item => ({
        code: item[0],
        name: item[1],
        market: item[2] || 'KOSPI'
      }));
    }
  } catch (err) {
    console.error(`Search error:`, err.message);
  }
  return [];
}

app.get('/api/stocks', async (req, res) => {
  try {
    const parsed = Papa.parse(inMemoryCsv, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = parsed.data;

    const stockPromises = rows.map(async (row, index) => {
      let market = (row.MARKET || row.market || 'KOSPI').trim();
      let name = (row['종목명'] || row.name || '').trim();
      let code = (row['종목코드'] || row.code || '').trim();
      const buyPrice = parseFloat(String(row['매수가'] || row.buyPrice || '0').replace(/,/g, '')) || 0;
      const quantity = parseFloat(String(row['수량'] || row.quantity || '0').replace(/,/g, '')) || 0;

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
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/price/:code', async (req, res) => {
  try {
    const code = req.params.code;
    const priceInfo = await fetchStockPriceFromNaver(code);
    res.json(priceInfo);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    if (!query) return res.json([]);
    const results = await searchStockCode(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/stocks/save', (req, res) => {
  try {
    const { stocks, rawCsv } = req.body;
    let csvDataToSave = rawCsv;

    if (!csvDataToSave && Array.isArray(stocks)) {
      const csvRows = stocks.map(s => ({
        MARKET: s.market || 'KOSPI',
        '종목명': s.name || '',
        '종목코드': s.code || '',
        '매수가': s.buyPrice || 0,
        '수량': s.quantity || 0,
      }));
      csvDataToSave = Papa.unparse(csvRows);
    }

    if (csvDataToSave) {
      inMemoryCsv = csvDataToSave;
    }

    res.json({ success: true, message: '포트폴리오가 성공적으로 저장되었습니다.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default app;
