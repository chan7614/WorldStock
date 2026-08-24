import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Layers, Percent } from 'lucide-react';
import { formatCurrency, formatPercent, getStockColorClass, getStockBadgeClass } from '../utils/formatters';

export default function SummaryCards({ summary, loading }) {
  if (!summary) return null;

  const {
    totalBuyAmount = 0,
    totalCurrentAmount = 0,
    totalProfitLoss = 0,
    overallReturnRate = 0,
    averageReturnRate = 0,
    totalStocks = 0,
  } = summary;

  const isProfitable = totalProfitLoss >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {/* 1. 총 매수금액 (투자 원금) */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-slate-600 transition-all">
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
          <span>총 매수금액 (원금)</span>
          <span className="p-1.5 bg-slate-700/50 rounded-lg text-slate-300">
            <Layers className="w-4 h-4" />
          </span>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {loading ? (
            <div className="h-7 bg-slate-700/60 rounded animate-pulse w-32 mt-1"></div>
          ) : (
            formatCurrency(totalBuyAmount)
          )}
        </div>
        <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
          <span>보유 종목수:</span>
          <span className="font-semibold text-slate-200">{totalStocks}개</span>
        </div>
      </div>

      {/* 2. 총 평가금액 (현재 가치) */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-slate-600 transition-all">
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
          <span>총 평가금액</span>
          <span className="p-1.5 bg-slate-700/50 rounded-lg text-slate-300">
            <DollarSign className="w-4 h-4" />
          </span>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {loading ? (
            <div className="h-7 bg-slate-700/60 rounded animate-pulse w-32 mt-1"></div>
          ) : (
            formatCurrency(totalCurrentAmount)
          )}
        </div>
        <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
          <span>평가 대비:</span>
          <span className={getStockColorClass(totalProfitLoss)}>
            {totalProfitLoss > 0 ? '+' : ''}{formatCurrency(totalProfitLoss)}
          </span>
        </div>
      </div>

      {/* 3. 총 손익금액 (손익 합계) */}
      <div className={`bg-slate-800/80 border rounded-xl p-4 shadow-lg backdrop-blur-sm relative overflow-hidden transition-all ${
        totalProfitLoss > 0 ? 'border-red-500/30 hover:border-red-500/50 bg-red-950/10' :
        totalProfitLoss < 0 ? 'border-blue-500/30 hover:border-blue-500/50 bg-blue-950/10' :
        'border-slate-700/60 hover:border-slate-600'
      }`}>
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
          <span className="font-semibold text-slate-300">총 손익금액 합계</span>
          <span className={`p-1.5 rounded-lg ${totalProfitLoss >= 0 ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
            {totalProfitLoss >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </span>
        </div>
        <div className={`text-xl sm:text-2xl font-bold tracking-tight ${getStockColorClass(totalProfitLoss)}`}>
          {loading ? (
            <div className="h-7 bg-slate-700/60 rounded animate-pulse w-32 mt-1"></div>
          ) : (
            `${totalProfitLoss > 0 ? '+' : ''}${formatCurrency(totalProfitLoss)}`
          )}
        </div>
        <div className="mt-2">
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 ${getStockBadgeClass(totalProfitLoss)}`}>
            {totalProfitLoss > 0 ? '수익 실현중' : totalProfitLoss < 0 ? '평가 손실중' : '원금 보합'}
          </span>
        </div>
      </div>

      {/* 4. 전체 수익률 (%) */}
      <div className={`bg-slate-800/80 border rounded-xl p-4 shadow-lg backdrop-blur-sm relative overflow-hidden transition-all ${
        overallReturnRate > 0 ? 'border-red-500/30 hover:border-red-500/50 bg-red-950/10' :
        overallReturnRate < 0 ? 'border-blue-500/30 hover:border-blue-500/50 bg-blue-950/10' :
        'border-slate-700/60 hover:border-slate-600'
      }`}>
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
          <span className="font-semibold text-slate-300">전체 포트폴리오 수익률</span>
          <span className="p-1.5 bg-slate-700/50 rounded-lg text-slate-300">
            <PieChart className="w-4 h-4" />
          </span>
        </div>
        <div className={`text-xl sm:text-2xl font-extrabold tracking-tight ${getStockColorClass(overallReturnRate)}`}>
          {loading ? (
            <div className="h-7 bg-slate-700/60 rounded animate-pulse w-24 mt-1"></div>
          ) : (
            formatPercent(overallReturnRate)
          )}
        </div>
        <div className="text-xs text-slate-400 mt-2">
          총 원금 대비 전체 누적 수익률
        </div>
      </div>

      {/* 5. 평균 수익률 (%) */}
      <div className={`bg-slate-800/80 border rounded-xl p-4 shadow-lg backdrop-blur-sm relative overflow-hidden transition-all ${
        averageReturnRate > 0 ? 'border-red-500/30 hover:border-red-500/50 bg-red-950/10' :
        averageReturnRate < 0 ? 'border-blue-500/30 hover:border-blue-500/50 bg-blue-950/10' :
        'border-slate-700/60 hover:border-slate-600'
      }`}>
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
          <span className="font-semibold text-slate-300">종목별 평균 수익률</span>
          <span className="p-1.5 bg-slate-700/50 rounded-lg text-slate-300">
            <Percent className="w-4 h-4" />
          </span>
        </div>
        <div className={`text-xl sm:text-2xl font-extrabold tracking-tight ${getStockColorClass(averageReturnRate)}`}>
          {loading ? (
            <div className="h-7 bg-slate-700/60 rounded animate-pulse w-24 mt-1"></div>
          ) : (
            formatPercent(averageReturnRate)
          )}
        </div>
        <div className="text-xs text-slate-400 mt-2">
          {totalStocks}개 종목의 단순 산술 평균
        </div>
      </div>
    </div>
  );
}
