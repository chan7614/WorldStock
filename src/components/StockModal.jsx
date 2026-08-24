import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Check } from 'lucide-react';
import axios from 'axios';

export default function StockModal({ isOpen, onClose, onSave, initialData }) {
  const [formData, setFormData] = useState({
    market: 'KOSPI',
    name: '',
    code: '',
    buyPrice: '',
    quantity: '',
  });

  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        market: initialData.market || 'KOSPI',
        name: initialData.name || '',
        code: initialData.code || '',
        buyPrice: initialData.buyPrice || '',
        quantity: initialData.quantity || '',
      });
    } else {
      setFormData({
        market: 'KOSPI',
        name: '',
        code: '',
        buyPrice: '',
        quantity: '',
      });
    }
    setSearchResults([]);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // 종목명 검색 처리
  const handleNameChange = async (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, name: val }));

    if (val.trim().length >= 1) {
      setSearching(true);
      try {
        const res = await axios.get(`/api/search?q=${encodeURIComponent(val)}`);
        setSearchResults(res.data || []);
      } catch (err) {
        console.error('검색 실패:', err);
      } finally {
        setSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectSearchResult = (item) => {
    setFormData(prev => ({
      ...prev,
      name: item.name,
      code: item.code,
      market: item.market || prev.market,
    }));
    setSearchResults([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('종목명을 입력해주세요.');
      return;
    }
    if (!formData.buyPrice || Number(formData.buyPrice) <= 0) {
      alert('올바른 매수가를 입력해주세요.');
      return;
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      alert('올바른 수량을 입력해주세요.');
      return;
    }

    onSave({
      ...(initialData || {}),
      market: formData.market,
      name: formData.name.trim(),
      code: formData.code.trim(),
      buyPrice: parseFloat(formData.buyPrice),
      quantity: parseFloat(formData.quantity),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-900/50">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            {initialData ? '종목 정보 수정' : '새 보유 종목 추가'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 입력 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 시장 선택 */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">시장 구분 (MARKET)</label>
            <div className="grid grid-cols-3 gap-2">
              {['KOSPI', 'KOSDAQ', 'OTHER'].map(m => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setFormData({ ...formData, market: m })}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                    formData.market === m
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-sm'
                      : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* 종목명 검색 */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              종목명 <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="예: 삼성전자, NAVER, 카카오"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                required
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>

            {/* 자동완성 드롭다운 */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto z-20">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center justify-between text-xs border-b border-slate-800 last:border-0"
                  >
                    <span className="font-semibold text-white">{item.name}</span>
                    <span className="font-mono text-slate-400">{item.code} ({item.market})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 종목코드 */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              종목코드 (선택 - 6자리 숫자)
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="예: 005930 (비워두면 자동 검색)"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* 매수가 & 수량 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                매수가 (원) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={formData.buyPrice}
                onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                placeholder="예: 72000"
                min="0"
                step="any"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                보유 수량 (주) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="예: 50"
                min="0"
                step="any"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* 모달 버튼 */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-md transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>저장하기</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
