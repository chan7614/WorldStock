import React from 'react';
import { X, Globe, Cloud, CheckCircle, ExternalLink, Terminal, ShieldCheck } from 'lucide-react';

export default function PublishModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-900/70 sticky top-0 z-10">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-amber-400" />
            <span>온라인 무료 퍼블리싱(배포) 가이드</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6 space-y-6 text-sm text-slate-300">
          {/* 방법 1: Vercel */}
          <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold border border-slate-600">▲</span>
                <h4 className="font-bold text-white text-base">방법 1. Vercel 원클릭 배포 (가장 추천)</h4>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                무료 / 3분 소요
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              프로젝트 내에 이미 <code className="text-amber-400">vercel.json</code> 및 Serverless API(<code className="text-amber-400">api/index.js</code>)가 완벽히 구성되어 있어 즉시 배포 가능합니다.
            </p>

            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300">
              <li>
                <strong>GitHub에 소스코드 푸시:</strong>
                <div className="bg-slate-950 p-2.5 rounded font-mono text-[11px] text-amber-300 mt-1 mb-1 select-all overflow-x-auto">
                  git init<br/>
                  git add .<br/>
                  git commit -m "feat: WorldStock initial release"<br/>
                  git branch -M main<br/>
                  git remote add origin https://github.com/당신의계정/WorldStock.git<br/>
                  git push -u origin main
                </div>
              </li>
              <li>
                <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-amber-400 underline inline-flex items-center gap-1">
                  Vercel(vercel.com) <ExternalLink className="w-3 h-3" />
                </a>에 가입 후 <strong>[Add New...] → [Project]</strong> 클릭
              </li>
              <li>방금 올린 GitHub 저장소를 선택하고 <strong>[Deploy]</strong> 클릭</li>
              <li>약 1분 후 발급되는 <code>https://world-stock-xxx.vercel.app</code> 주소로 전 세계 어디서나 모바일/PC로 접속 가능!</li>
            </ol>
          </div>

          {/* 방법 2: Render / Railway */}
          <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-indigo-400" />
                <h4 className="font-bold text-white text-base">방법 2. Render / Railway 풀스택 호스팅</h4>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                백엔드 + 파일저장
              </span>
            </div>

            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300">
              <li>
                <a href="https://render.com" target="_blank" rel="noreferrer" className="text-amber-400 underline inline-flex items-center gap-1">
                  Render.com <ExternalLink className="w-3 h-3" />
                </a>에 가입 후 <strong>[New +] → [Web Service]</strong> 선택
              </li>
              <li>GitHub 저장소 연결 후 설정:
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-slate-400 font-mono text-[11px]">
                  <li>Build Command: <span className="text-amber-300">npm install && npm run build</span></li>
                  <li>Start Command: <span className="text-amber-300">npm start</span></li>
                </ul>
              </li>
              <li><strong>[Create Web Service]</strong> 클릭 시 즉시 온에어!</li>
            </ol>
          </div>

          {/* 방법 3: 로컬 외부 공유 (Cloudflare Tunnel / ngrok) */}
          <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-white text-base">방법 3. 로컬에서 즉시 외부 인터넷 공개 (초간단)</h4>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-2">
              포트포워딩 없이 무료 터널을 통해 스마트폰에서 지금 바로 확인하는 방법:
            </p>
            <div className="bg-slate-950 p-2.5 rounded font-mono text-[11px] text-amber-300 select-all overflow-x-auto">
              # 터미널에서 아래 명령어 실행 (무료 임시 도메인 생성)<br/>
              npx localtunnel --port 5173
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow transition-colors"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
