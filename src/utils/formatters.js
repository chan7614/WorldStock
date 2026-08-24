// 원화 통화 포맷 (예: 1,234,567원)
export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '0원';
  return `${Math.round(amount).toLocaleString('ko-KR')}원`;
}

// 달러 포맷 (예: $123.45)
export function formatUsd(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '$0.00';
  return '$' + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 원화 숫자 포맷 (원 단위 제외)
export function formatNumber(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '0';
  return `${Math.round(amount).toLocaleString('ko-KR')}`;
}

// 수익률 포맷 (+12.34%, -5.67%)
export function formatPercent(rate) {
  if (rate === undefined || rate === null || isNaN(rate)) return '0.00%';
  const sign = rate > 0 ? '+' : '';
  return `${sign}${Number(rate).toFixed(2)}%`;
}

// 수익률에 따른 스타일 클래스 (한국 증시: 상승=빨강, 하락=파랑)
export function getStockColorClass(value) {
  if (value > 0) return 'text-red-500 font-semibold';
  if (value < 0) return 'text-blue-500 font-semibold';
  return 'text-slate-400';
}

// 배경색 포함 뱃지 스타일
export function getStockBadgeClass(value) {
  if (value > 0) return 'bg-red-500/10 text-red-400 border border-red-500/20';
  if (value < 0) return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
  return 'bg-slate-800 text-slate-400 border border-slate-700';
}
