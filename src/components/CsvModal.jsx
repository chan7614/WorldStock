import React, { useState } from 'react';
import { X, Upload, Download, FileText, Check, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

export default function CsvModal({ isOpen, onClose, stocks, onUpdateFromCsv }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'editor'
  const [csvText, setCsvText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // 현재 데이터를 CSV 문자열로 변환
  const getCurrentCsvString = () => {
    const rows = stocks.map(s => ({
      MARKET: s.market || 'KOSPI',
      '종목명': s.name || '',
      '종목코드': s.code || '',
      '매수가': s.buyPrice || 0,
      '수량': s.quantity || 0,
    }));
    return Papa.unparse(rows);
  };

  // CSV 파일 다운로드 핸들러
  const handleDownloadCsv = () => {
    const csvData = getCurrentCsvString();
    const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' }); // BOM 추가로 엑셀 한글 깨짐 방지
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `portfolio_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV 파일 업로드 핸들러
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setErrorMsg('CSV 파싱 중 오류가 발생했습니다: ' + results.errors[0].message);
          return;
        }

        const validData = results.data.map((row, idx) => ({
          id: idx + 1,
          market: (row.MARKET || row.market || 'KOSPI').trim(),
          name: (row['종목명'] || row.name || '').trim(),
          code: (row['종목코드'] || row.code || '').trim(),
          buyPrice: parseFloat(String(row['매수가'] || row.buyPrice || '0').replace(/,/g, '')) || 0,
          quantity: parseFloat(String(row['수량'] || row.quantity || '0').replace(/,/g, '')) || 0,
        })).filter(item => item.name || item.code);

        if (validData.length === 0) {
          setErrorMsg('유효한 주식 데이터가 없습니다. (헤더: MARKET, 종목명, 종목코드, 매수가, 수량)');
          return;
        }

        onUpdateFromCsv(validData, Papa.unparse(results.data));
        onClose();
      },
      error: (err) => {
        setErrorMsg('파일을 읽는 중 에러가 발생했습니다: ' + err.message);
      }
    });
  };

  // 텍스트 직접 입력 저장 핸들러
  const handleSaveTextCsv = () => {
    setErrorMsg('');
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validData = results.data.map((row, idx) => ({
          id: idx + 1,
          market: (row.MARKET || row.market || 'KOSPI').trim(),
          name: (row['종목명'] || row.name || '').trim(),
          code: (row['종목코드'] || row.code || '').trim(),
          buyPrice: parseFloat(String(row['매수가'] || row.buyPrice || '0').replace(/,/g, '')) || 0,
          quantity: parseFloat(String(row['수량'] || row.quantity || '0').replace(/,/g, '')) || 0,
        })).filter(item => item.name || item.code);

        if (validData.length === 0) {
          setErrorMsg('유효한 주식 데이터가 없습니다.');
          return;
        }

        onUpdateFromCsv(validData, csvText);
        onClose();
      }
    });
  };

  const handleOpenEditor = () => {
    setActiveTab('editor');
    setCsvText(getCurrentCsvString());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-900/50">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span>CSV 포트폴리오 관리</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-slate-700 bg-slate-900/30 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 text-center border-b-2 transition-all ${
              activeTab === 'upload'
                ? 'border-amber-400 text-amber-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            파일 업로드 / 다운로드
          </button>
          <button
            onClick={handleOpenEditor}
            className={`flex-1 py-3 text-center border-b-2 transition-all ${
              activeTab === 'editor'
                ? 'border-amber-400 text-amber-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            직접 CSV 편집
          </button>
        </div>

        {/* 에러 메시지 */}
        {errorMsg && (
          <div className="m-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 탭 1: 파일 업로드 / 다운로드 */}
        {activeTab === 'upload' && (
          <div className="p-6 space-y-5">
            {/* 업로드 영역 */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                CSV 파일 불러오기 (.csv)
              </label>
              <label className="border-2 border-dashed border-slate-600 hover:border-amber-400/80 bg-slate-900/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group">
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-amber-400 mb-2 transition-colors" />
                <span className="text-sm font-medium text-slate-200 group-hover:text-white">
                  클릭하여 CSV 파일 선택
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  헤더: MARKET, 종목명, 종목코드, 매수가, 수량
                </span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* 다운로드 버튼 */}
            <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
              <span className="text-xs text-slate-400">현재 포트폴리오를 파일로 저장</span>
              <button
                onClick={handleDownloadCsv}
                className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>CSV 파일로 다운로드</span>
              </button>
            </div>
          </div>
        )}

        {/* 탭 2: 텍스트 직접 편집 */}
        {activeTab === 'editor' && (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                CSV 원본 텍스트 수정
              </label>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={8}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed"
                placeholder="MARKET,종목명,종목코드,매수가,수량&#10;KOSPI,삼성전자,005930,71500,100"
              ></textarea>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
              >
                닫기
              </button>
              <button
                onClick={handleSaveTextCsv}
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-md transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>적용 및 저장</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
