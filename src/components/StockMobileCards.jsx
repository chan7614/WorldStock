import React from 'react';
import { ExternalLink, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency, formatNumber, formatUsd, formatPercent, getStockColorClass, getStockBadgeClass } from '../utils/formatters';

export default function StockMobileCards({ stocks, onEdit, onDelete, loading }) {
  if (!stocks || stocks.length === 0) {
    return (
      <div className="md:hidden bg-slate-800/80 border border-slate-700/60 rounded-xl p-8 text-center text-slate-400">
        <p className="text-base">등록된 보유 종목이 없습니다.</p>
        <p className="text-xs text-slate-500 mt-1">상단의 "종목 추가" 또는 "CSV 업로드"를 이용하세요.</p>
      </div>
    );
  }

  return (
    <div className="md:hidden space-y-3.5">
      {stocks.map((stock) => {
        const googleUrl = stock.googleUrl || `https://www.google.com/finance/quote/${stock.code}`;

        const buyPriceStr = stock.isUs ? `${formatUsd(stock.buyPrice)} (₩${formatNumber(stock.buyPriceKrw)})` : `${formatNumber(stock.buyPrice)}원`;
        const currPriceStr = stock.isUs ? `${formatUsd(stock.currentPrice)} (₩${formatNumber(stock.currentPriceKrw)})` : `${formatNumber(stock.currentPrice)}원`;

        return (
          <div
            key={stock.id || stock.code || stock.name}
            className="bg-slate-800/90 border border-slate-700/70 rounded-xl p-4 shadow-md backdrop-blur-sm relative"
          >
            {/* 상단: MARKET, 종목명, 수익률 뱃지 */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                    stock.market === 'KOSPI'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : stock.market === 'KOSDAQ'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : stock.market === 'NASDAQ'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  }`}>
                    {stock.market}
                  </span>
                  <a
                    href={googleUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-base font-bold text-white flex items-center gap-1 hover:text-amber-400"
                  >
                    <span>{stock.name}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  코드/티커: {stock.code || '-'}
                </div>
              </div>

              {/* 수익률 뱃지 */}
              <div className="text-right">
                <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-extrabold ${getStockBadgeClass(stock.returnRate)}`}>
                  {formatPercent(stock.returnRate)}
                </span>
                <div className={`text-[11px] font-bold mt-1 ${getStockColorClass(stock.profitLoss)}`}>
                  {stock.profitLoss > 0 ? '+' : ''}{formatCurrency(stock.profitLoss)}
                </div>
              </div>
            </div>

            {/* 본문: 가격 및 수량 정보 그리드 */}
            <div className="grid grid-cols-2 gap-2 bg-slate-900/60 rounded-lg p-2.5 text-xs mb-3 border border-slate-700/40">
              <div>
                <span className="text-slate-400 block text-[11px]">매수가 / 수량</span>
                <span className="text-slate-200 font-medium">
                  {buyPriceStr} <span className="text-slate-400 font-normal">({stock.quantity}주)</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[11px]">현재가 (구글)</span>
                <span className="text-white font-bold">
                  {currPriceStr}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">총 매수금액 (원화)</span>
                <span className="text-slate-300 font-medium">
                  {formatCurrency(stock.totalBuyAmount)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[11px]">총 평가금액 (원화)</span>
                <span className="text-white font-bold">
                  {formatCurrency(stock.totalCurrentAmount)}
                </span>
              </div>
            </div>

            {/* 하단 액션 버튼 */}
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-700/40 text-xs">
              <button
                onClick={() => onEdit(stock)}
                className="flex items-center gap-1 px-2.5 py-1 text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded-md transition-colors"
              >
                <Edit2 className="w-3 h-3" />
                <span>수정</span>
              </button>
              <button
                onClick={() => onDelete(stock.id)}
                className="flex items-center gap-1 px-2.5 py-1 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>삭제</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
