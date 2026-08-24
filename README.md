# 📈 주식의 세계 (WorldStock)

> **네이버 증권 실시간 시세 연동 포트폴리오 손익 분석 대시보드**  
> 보유 주식의 매수가와 수량을 기반으로 네이버 증권 현재가를 실시간 조회하여 수익률, 손익금액, 전체 통계를 자동으로 계산해 주는 모바일 반응형 웹 애플리케이션입니다.

---

## ✨ 핵심 기능

1. **실시간 네이버 증권 시세 연동**:
   - 페이지 로드 시 보유 종목의 현재가, 전일대비 변동액/변동률을 네이버 증권에서 자동 수신
   - 종목코드 클릭 시 네이버 증권 상세 페이지로 바로 연결
2. **손익금액 및 수익률 자동 계산**:
   - 종목별 매수총액, 평가총액, 손익금액(원), 수익률(%) 자동 산출
   - 한국 증시 기준 컬러 테마: **수익/상승은 빨간색**, **손실/하락은 파란색**
3. **포트폴리오 종합 대시보드 (상단 카드)**:
   - 총 투자금액 (매수 원금)
   - 총 평가금액 (현재 가치)
   - 총 손익금액 합계
   - 전체 누적 수익률 (%)
   - 종목별 평균 수익률 (%)
4. **실시간 새로고침 (Refresh)**:
   - 원클릭 새로고침 버튼으로 최신 시세 즉시 재계산
   - 1분 자동 갱신 토글 옵션 제공
5. **CSV 포트폴리오 연동 및 관리**:
   - `MARKET, 종목명, 종목코드, 매수가, 수량` 형식의 CSV 파일 지원
   - CSV 파일 업로드 및 백업 다운로드 기능
   - 웹 화면에서 종목 직접 추가 / 수정 / 삭제 기능
6. **모바일 완벽 대응 반응형 UI**:
   - PC: 상세 데이터 테이블
   - 모바일/태블릿: 터치 친화적 모바일 카드 뷰

---

## 🛠️ 기술 스택

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, PapaParse
- **Backend**: Node.js, Express, Axios (네이버 증권 API 프록시 & CORS 해결)
- **Deployment**: Vercel Serverless Ready (`vercel.json`, `api/index.js`), Render, Railway

---

## 🚀 로컬 실행 방법 (Local Getting Started)

### 1. 패키지 설치
```bash
npm install
```

### 2. 개발 모드 실행 (프론트엔드 + 백엔드)
터미널 1 (백엔드 시세 API 서버):
```bash
npm run server
```
*백엔드 서버가 `http://localhost:3001` 에서 실행됩니다.*

터미널 2 (프론트엔드 Vite 개발 서버):
```bash
npm run dev
```
*브라우저에서 `http://localhost:5173` 에 접속합니다.*

### 3. 프로덕션 단일 서버 실행 (선택사항)
```bash
npm run build
npm start
```
*빌드 후 `http://localhost:3001` 에서 전체 서비스가 통합 실행됩니다.*

---

## 📂 프로젝트 구조

```
WorldStock/
├── api/
│   └── index.js              # Vercel 서버리스 진입점
├── data/
│   └── portfolio.csv         # 기본 포트폴리오 데이터
├── src/
│   ├── components/
│   │   ├── SummaryCards.jsx      # 상단 통계 카드 (합계, 평균 수익률 등)
│   │   ├── StockTable.jsx        # 데스크탑 반응형 테이블
│   │   ├── StockMobileCards.jsx  # 모바일 전용 카드 뷰
│   │   ├── StockModal.jsx        # 종목 추가/수정 모달 (자동완성 검색)
│   │   ├── CsvModal.jsx          # CSV 업로드/다운로드 모달
│   │   └── PublishModal.jsx      # 온라인 퍼블리싱 가이드 모달
│   ├── utils/
│   │   └── formatters.js         # 원화/수익률 포맷팅 및 스타일 유틸
│   ├── App.jsx               # 메인 대시보드
│   ├── main.jsx              # React 엔트리포인트
│   └── index.css             # Tailwind 및 커스텀 스타일
├── server.js                 # Node.js Express 백엔드 서버
├── vercel.json               # Vercel 배포 설정
├── DEPLOY_GUIDE.md           # 온라인 무료 퍼블리싱 상세 가이드
├── package.json
└── vite.config.js
```

---

## 🌐 온라인 무료 배포 (퍼블리싱)
상세한 온라인 배포 방법은 [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) 문서를 확인해주세요.
- GitHub에 푸시 후 **Vercel** 또는 **Render.com**에서 원클릭으로 무료 배포할 수 있습니다.
