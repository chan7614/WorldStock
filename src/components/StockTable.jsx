import React from 'react';
import { ExternalLink, Edit2, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatNumber, formatUsd, formatPercent, getStockColorClass, getStockBadgeClass } from '../utils/formatters';

export default function StockTable({ stocks, onEdit, onDelete, loading }) {
  if (!stocks || stocks.length === 0) {
    return (
      <div className="hidden md:block bg-slate-800/80 border border-slate-700/60 rounded-xl p-12 text-center text-slate-400">
        <p className="text-lg">등록된 보유 종목이 없습니다.</p>
        <p className="text-sm text-slate-500 mt-1">상단의 "종목 추가" 또는 "CSV 관리"를 통해 포트폴리오를 구성해보세요.</p>
      </div>
    );
  }

  return (
    <div className="hidden md:block bg-slate-800/80 border border-slate-700/60 rounded-xl shadow-xl overflow-hidden backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/60 border-b border-slate-700 text-xs font-semibold text-slate-400 tracking-wider">
              <th className="py-3.5 px-4 text-center w-24">MARKET</th>
              <th className="py-3.5 px-4">종목명 / 심볼</th>
              <th className="py-3.5 px-4 text-right">매수가</th>
              <th className="py-3.5 px-4 text-right">현재가 (구글)</th>
              <th className="py-3.5 px-4 text-right">보유수량</th>
              <th className="py-3.5 px-4 text-right">매수총액</th>
              <th className="py-3.5 px-4 text-right">평가총액</th>
              <th className="py-3.5 px-4 text-right">손익금액</th>
              <th className="py-3.5 px-4 text-right">수익률</th>
              <th className="py-3.5 px-4 text-center w-24">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50 text-sm">
            {stocks.map((stock) => {
              const googleUrl = stock.googleUrl || `https://www.google.com/finance/quote/${stock.code}`;

              const buyPriceDisplay = stock.isDollar ? formatUsd(stock.buyPrice) : formatNumber(stock.buyPrice) + '원';
              const currentPriceDisplay = stock.isDollar ? formatUsd(stock.currentPrice) : formatNumber(stock.currentPrice) + '원';

              return (
                <tr
                  key={stock.id || stock.code || stock.name}
                  className="hover:bg-slate-700/30 transition-colors group"
                >
                  {/* MARKET 뱃지 */}
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded-md ${
                      stock.market === 'KOSPI'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : stock.market === 'KOSDAQ'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : stock.market === 'NASDAQ'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : stock.market === 'AMEX'
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {stock.market}
                    </span>
                  </td>

                  {/* 종목명 & 구글 파이낸스 링크 */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-white group-hover:text-amber-400 transition-colors">
                        {stock.name}
                      </span>
                      <a
                        href={googleUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-500 hover:text-amber-400 transition-colors inline-flex items-center"
                        title="구글 파이낸스 페이지로 이동"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                      {stock.code || '-'}
                    </div>
                  </td>

                  {/* 매수가 ($ 또는 원) */}
                  <td className={`py-4 px-4 text-right font-medium ${stock.isDollar ? 'text-amber-300 font-mono' : 'text-slate-300'}`}>
                    {buyPriceDisplay}
                  </td>

                  {/* 현재가 ($ 또는 원) */}
                  <td className="py-4 px-4 text-right font-semibold">
                    <div className={stock.isDollar ? 'text-amber-300 font-mono font-bold' : 'text-white'}>
                      {currentPriceDisplay}
                    </div>
                    {stock.changePrice !== undefined && stock.changePrice !== 0 && (
                      <div className={`text-xs flex items-center justify-end gap-0.5 mt-0.5 ${getStockColorClass(stock.changeRate)}`}>
                        {stock.changeRate > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{stock.changePrice > 0 ? '+' : ''}{stock.isDollar ? formatUsd(stock.changePrice) : formatNumber(stock.changePrice) + '원'} ({stock.changeRate > 0 ? '+' : ''}{stock.changeRate}%)</span>
                      </div>
                    )}
                  </td>

                  {/* 수량 */}
                  <td className="py-4 px-4 text-right font-medium text-slate-300">
                    {formatNumber(stock.quantity)}주
                  </td>

                  {/* 매수총액 (대한민국 원) */}
                  <td className="py-4 px-4 text-right font-medium text-slate-400">
                    {formatCurrency(stock.totalBuyAmount)}
                  </td>

                  {/* 평가총액 (대한민국 원) */}
                  <td className="py-4 px-4 text-right font-semibold text-white">
                    {formatCurrency(stock.totalCurrentAmount)}
                  </td>

                  {/* 손익금액 (대한민국 원) */}
                  <td className={`py-4 px-4 text-right font-bold ${getStockColorClass(stock.profitLoss)}`}>
                    {stock.profitLoss > 0 ? '+' : ''}{formatCurrency(stock.profitLoss)}
                  </td>

                  {/* 수익률 (%) */}
                  <td className="py-4 px-4 text-right">
                    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-extrabold ${getStockBadgeClass(stock.returnRate)}`}>
                      {formatPercent(stock.returnRate)}
                    </span>
                  </td>

                  {/* 액션 버튼 */}
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(stock)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
                        title="종목 수정"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(stock.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                        title="종목 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
