import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  RefreshCw, 
  Plus, 
  FileText, 
  Clock 
} from 'lucide-react';

import SummaryCards from './components/SummaryCards';
import StockTable from './components/StockTable';
import StockMobileCards from './components/StockMobileCards';
import StockModal from './components/StockModal';
import CsvModal from './components/CsvModal';

export default function App() {
  const [stocks, setStocks] = useState([]);
  const [usdKrwRate, setUsdKrwRate] = useState(1380.0);
  const [summary, setSummary] = useState({
    totalStocks: 0,
    totalBuyAmount: 0,
    totalCurrentAmount: 0,
    totalProfitLoss: 0,
    overallReturnRate: 0,
    averageReturnRate: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(60);

  // 모달 상태
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedStockForEdit, setSelectedStockForEdit] = useState(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // 주식 데이터 및 구글 파이낸스 시세 로드
  const fetchStocksData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await axios.get('/api/stocks');
      if (response.data && response.data.success) {
        setStocks(response.data.stocks || []);
        setSummary(response.data.summary || {});
        setUsdKrwRate(response.data.usdKrwRate || 1380.0);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('시세 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 초기 로드 시 시세 조회
  useEffect(() => {
    fetchStocksData();
  }, [fetchStocksData]);

  // 자동 새로고침 타이머
  useEffect(() => {
    let timer;
    if (autoRefresh) {
      timer = setInterval(() => {
        fetchStocksData(true);
      }, autoRefreshInterval * 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [autoRefresh, autoRefreshInterval, fetchStocksData]);

  // 종목 추가/수정 저장
  const handleSaveStock = async (stockData) => {
    let updatedStocks;
    if (stockData.id) {
      updatedStocks = stocks.map(s => s.id === stockData.id ? { ...s, ...stockData } : s);
    } else {
      const newStock = {
        id: Date.now(),
        ...stockData
      };
      updatedStocks = [...stocks, newStock];
    }

    try {
      await axios.post('/api/stocks/save', { stocks: updatedStocks });
      fetchStocksData();
    } catch (err) {
      console.error('저장 실패:', err);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 종목 삭제
  const handleDeleteStock = async (stockId) => {
    if (!window.confirm('해당 종목을 포트폴리오에서 삭제하시겠습니까?')) return;
    const updatedStocks = stocks.filter(s => s.id !== stockId);
    try {
      await axios.post('/api/stocks/save', { stocks: updatedStocks });
      fetchStocksData();
    } catch (err) {
      console.error('삭제 실패:', err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // CSV 업데이트 콜백
  const handleUpdateFromCsv = async (parsedStocks, rawCsvText) => {
    try {
      await axios.post('/api/stocks/save', { rawCsv: rawCsvText });
      fetchStocksData();
    } catch (err) {
      console.error('CSV 저장 실패:', err);
      alert('CSV 저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* 1. 상단 글로벌 네비게이션 헤더 */}
      <header className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* 로고 & 타이틀 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-xl">
              📈
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
                주식의 세계
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                실시간 시세 기반 수익률 및 손익금액 대시보드
              </p>
            </div>
          </div>

          {/* 우측 상단 액션 버튼 그룹 */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* CSV 관리 버튼 */}
            <button
              onClick={() => setIsCsvModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-slate-300" />
              <span>CSV 관리</span>
            </button>

            {/* 신규 종목 추가 버튼 */}
            <button
              onClick={() => {
                setSelectedStockForEdit(null);
                setIsStockModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-md shadow-amber-400/10"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>종목 추가</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. 메인 컨텐츠 영역 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* 컨트롤 & 상태 바 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>마지막 갱신:</span>
              <span className="font-mono text-slate-200 font-medium">
                {lastUpdated ? lastUpdated.toLocaleTimeString('ko-KR') : '가져오는 중...'}
              </span>
            </div>

            {/* 실시간 환율 정보 */}
            <div className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono">
              <span className="text-amber-400 font-semibold">USD/KRW:</span>
              <span>{Math.round(usdKrwRate).toLocaleString('ko-KR')}원</span>
            </div>

            {loading && (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 ml-1 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                구글 파이낸스 시세 수신 중...
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* 자동 새로고침 토글 */}
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-200">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-3.5 h-3.5 accent-amber-400 rounded bg-slate-800 border-slate-700"
              />
              <span>1분 자동 갱신</span>
            </label>

            {/* 수동 새로고침 버튼 */}
            <button
              onClick={() => fetchStocksData()}
              disabled={loading}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white transition-all ${
                loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-amber-400/50'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : 'text-slate-300'}`} />
              <span>새로고침 (Refresh)</span>
            </button>
          </div>
        </div>

        {/* 3. 상단 대시보드 통계 카드 */}
        <SummaryCards summary={summary} loading={loading && stocks.length === 0} />

        {/* 4. 주식 포트폴리오 목록 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>보유 주식 현황</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                {stocks.length} 종목
              </span>
            </h2>
          </div>

          {/* 데스크탑 테이블 뷰 */}
          <StockTable
            stocks={stocks}
            loading={loading}
            onEdit={(stk) => {
              setSelectedStockForEdit(stk);
              setIsStockModalOpen(true);
            }}
            onDelete={handleDeleteStock}
          />

          {/* 모바일 카드 뷰 */}
          <StockMobileCards
            stocks={stocks}
            loading={loading}
            onEdit={(stk) => {
              setSelectedStockForEdit(stk);
              setIsStockModalOpen(true);
            }}
            onDelete={handleDeleteStock}
          />
        </div>
      </main>

      {/* 5. 푸터 */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p>© 2026 주식의 세계 (WorldStock) · 구글 파이낸스(Google Finance) 실시간 시세 연동</p>
          <p className="text-[11px] text-slate-600">
            미국 주식은 실시간 USD/KRW 환율을 적용하여 원화로 자동 환산 계산됩니다.
          </p>
        </div>
      </footer>

      {/* 종목 추가/수정 모달 */}
      <StockModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        onSave={handleSaveStock}
        initialData={selectedStockForEdit}
      />

      {/* CSV 관리 모달 */}
      <CsvModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        stocks={stocks}
        onUpdateFromCsv={handleUpdateFromCsv}
      />
    </div>
  );
}
