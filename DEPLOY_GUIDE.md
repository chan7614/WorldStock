# 🚀 [주식의 세계] 온라인 퍼블리싱(배포) 완벽 가이드

본 문서는 로컬에서 개발된 **"주식의 세계(WorldStock)"** 웹서비스를 온라인 인터넷상에 무료로 퍼블리싱(배포)하여, 스마트폰과 어디서든 접속할 수 있게 만드는 방법들을 단계별로 안내합니다.

---

## 🌟 추천 배포 방식 비교

| 플랫폼 | 장점 | 단점/특징 | 추천 대상 |
| :--- | :--- | :--- | :--- |
| **1. Vercel (가장 추천)** | • 완전 무료<br>• 깃허브 연동 시 3분 내 배포<br>• 글로벌 초고속 CDN<br>• 무료 HTTPS 도메인 제공 | • Serverless 함수 기반 (무료 티어로 충분) | **모든 사용자 (가장 간편)** |
| **2. Render.com** | • Node.js 풀스택 서버 무료 호스팅<br>• 파일 직접 저장 지원 | • 15분 미접속 시 슬립 모드(첫 접속시 30초 대기) | 풀스택 상시 서버 필요 시 |
| **3. Cloudflare Pages / Tunnel** | • 제한 없는 대역폭<br>• 로컬 PC에서 즉시 외부 연결 가능 | • 도메인 연결 시 초기 설정 필요 | 로컬 환경 그대로 외부 공유 시 |

---

## 🥇 방법 1: Vercel을 통한 원클릭 무료 배포 (가장 추천)

프로젝트 루트에 이미 `vercel.json` 및 Serverless API(`api/index.js`)가 준비되어 있으므로, 깃허브에 올리고 버튼 한 번만 누르면 즉시 배포됩니다.

### 1단계: GitHub에 소스코드 업로드
1. [GitHub](https://github.com/)에 로그인 후 새 저장소(New repository)를 생성합니다. (예: `WorldStock`)
2. 로컬 터미널(PowerShell)에서 아래 명령어를 실행하여 코드를 올립니다:

```powershell
# 1. 깃 초기화 및 커밋
git init
git add .
git commit -m "feat: 주식의 세계 첫 릴리즈"

# 2. 메인 브랜치 설정 및 GitHub 연결
git branch -M main
git remote add origin https://github.com/당신의깃허브아이디/WorldStock.git

# 3. 코드 푸시
git push -u origin main
```

### 2단계: Vercel에서 배포하기
1. [Vercel 공식 홈페이지](https://vercel.com/) 접속 후 **Continue with GitHub**로 가입/로그인합니다.
2. 대시보드 우측 상단의 **[Add New...] → [Project]** 버튼을 클릭합니다.
3. 방금 푸시한 `WorldStock` 저장소 옆의 **[Import]** 버튼을 클릭합니다.
4. **Framework Preset**은 `Vite`로 자동 감지되며, 기본 설정 그대로 두고 **[Deploy]** 버튼을 누릅니다.
5. 약 1분 이내에 빌드가 완료되며, `https://world-stock-xxx.vercel.app` 과 같은 전용 무료 도메인이 발급됩니다!
6. 이제 스마트폰 모바일 브라우저나 어디서든 이 주소로 접속하면 실시간 시세를 확인할 수 있습니다.

---

## 🥈 방법 2: Render.com을 통한 풀스택 호스팅

Node.js 백엔드 서버(`server.js`)와 정적 빌드 파일을 함께 호스팅하는 방법입니다.

### 배포 단계:
1. [Render.com](https://render.com/)에 접속하여 GitHub 계정으로 가입합니다.
2. 대시보드에서 **[New +] → [Web Service]**를 선택합니다.
3. GitHub의 `WorldStock` 저장소를 선택합니다.
4. 빌드 및 시작 명령어를 다음과 같이 설정합니다:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. **[Create Web Service]**를 클릭하면 빌드 후 배포됩니다.

---

## 🥉 방법 3: 로컬 서버를 무료 터널로 즉시 외부에 열기 (초간단)

서버 배포 절차 없이 로컬 컴퓨터에서 실행 중인 화면을 스마트폰이나 친구에게 지금 바로 보여주고 싶을 때 사용합니다.

```powershell
# 로컬 개발 서버가 켜진 상태에서 새 터미널 창을 열고 실행:
npx localtunnel --port 5173
```
실행하면 나오는 임시 URL(예: `https://cool-stock-123.loca.lt`)로 스마트폰에서 접속하면 로컬 웹서비스가 그대로 열립니다.

---

## 📱 모바일 홈 화면에 앱처럼 추가하기 (PWA 팁)
배포된 웹사이트 URL을 스마트폰에서 연 후:
- **아이폰 (Safari)**: 하단 공유 버튼 → `[홈 화면에 추가]`
- **안드로이드 (Chrome)**: 우측 상단 메뉴(⋮) → `[홈 화면에 추가]` 또는 `[앱 설치]`

이제 홈 화면에서 일반 주식 앱처럼 1초 만에 실행하여 실시간 포트폴리오를 확인할 수 있습니다.
