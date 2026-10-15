# claypop

> 레트로 팝 스타일의 캐주얼 3D 클레이 사격 웹 게임 (Retro Pop Casual 3D Clay Shooting Game)

## 🎮 개요 (Overview)
ClayPop은 Three.js와 React 19, TypeScript로 제작된 박진감 넘치는 3D 사격 아케이드 게임입니다.
날아오는 다양한 타깃(클레이, 헬리콥터, 부메랑, UFO, 병아리 등)을 조준하여 격추하고 최고 콤보와 점수를 기록하세요!

## ✨ 주요 기능 (Features)
- **3D 슈팅 시뮬레이션**: Three.js 기반의 동적 카메라 앵글, 사격 반동, 명중 이펙트 및 파티클
- **다양한 타깃 시스템**:
  - 기본 클레이 (Normal Clay)
  - 코콥터 드론 (Helicopter Drone)
  - 부메랑 클레이 (Boomerang Clay)
  - 미확인 비행체 UFO (UFO)
  - 병아리 (Chick - 감점 타깃)
- **Firebase 연동**:
  - **인증 (Authentication)**: 익명 게스트, Google 계정, 이메일/비밀번호, 전화번호 로그인 지원
  - **클라우드 데이터베이스 (Firestore)**: 유저 프로필, 세션 기록, 실시간 TOP 20 랭킹 리더보드
  - **오프라인 폴백 지원**: Firebase 연결이 없어도 로컬 스토리지로 게스트 플레이 가능
- **다국어 지원 (i18n)**: 한국어(ko), 영어(en), 일본어(ja) 원클릭 토글
- **반응형 UI & 레트로 팝 디자인**: 픽셀 감성과 네온/파스텔 톤의 세련된 아케이드 디자인

## 🛠 기술 스택 (Tech Stack)
- **Frontend**: React 19, TypeScript, Vite
- **3D Graphics**: Three.js (@types/three)
- **Backend / BaaS**: Firebase (Authentication, Cloud Firestore, Analytics)
- **Internationalization**: react-i18next, i18next
- **Testing**: Vitest

## 🚀 시작하기 (Getting Started)

### 1. 패키지 설치
```bash
npm install
```

### 2. 환경 변수 설정 (.env)
루트 디렉토리에 `.env` 파일을 생성하거나 `.env.example`을 복사하여 Firebase 설정을 입력합니다:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 3. 개발 서버 실행
```bash
npm run dev
```
기본적으로 `http://localhost:3000`에서 실행됩니다.

### 4. 빌드 및 테스트
```bash
# TypeScript 타입 검사 및 프로덕션 빌드
npm run build

# 유닛 테스트 실행
npm test
```
