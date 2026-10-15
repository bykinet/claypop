# 🎯 타겟 이미지(5종류 × 3버전) 저장 안내

이 폴더는 **클레이 팝(Clay Pop)** 의 5종류 타겟(각 3개 버전, 총 15개 이미지)을 저장하는 전용 디렉터리입니다.

---

### 📁 저장 폴더 위치 (Windows 전체 경로)
```
C:\Users\HS Kim\Desktop\Agames\claypop\public\brand\targets\
```

---

### 📂 권장 폴더 구조 및 파일명

준비하신 15개의 이미지를 아래 **[방법 A (폴더별 분류)]** 또는 **[방법 B (단일 폴더 파일명)]** 중 편하신 방법으로 저장해 주시면 코드가 자동으로 인식합니다!

#### [방법 A] 각 타겟 서브 폴더에 저장 (가장 깔끔한 추천 방식)
1. **클레이 원반 (`clay/`):**
   - `public/brand/targets/clay/v1.png` (Ver.1)
   - `public/brand/targets/clay/v2.png` (Ver.2)
   - `public/brand/targets/clay/v3.png` (Ver.3)
2. **원반 콥터 (`copter/`):**
   - `public/brand/targets/copter/v1.png` (Ver.1)
   - `public/brand/targets/copter/v2.png` (Ver.2)
   - `public/brand/targets/copter/v3.png` (Ver.3)
3. **부메랑 (`boom/`):**
   - `public/brand/targets/boom/v1.png` (Ver.1)
   - `public/brand/targets/boom/v2.png` (Ver.2)
   - `public/brand/targets/boom/v3.png` (Ver.3)
4. **UFO 스타 (`ufo/`):**
   - `public/brand/targets/ufo/v1.png` (Ver.1)
   - `public/brand/targets/ufo/v2.png` (Ver.2)
   - `public/brand/targets/ufo/v3.png` (Ver.3)
5. **치킨 (`chick/`):**
   - `public/brand/targets/chick/v1.png` (Ver.1)
   - `public/brand/targets/chick/v2.png` (Ver.2)
   - `public/brand/targets/chick/v3.png` (Ver.3)

---

#### [방법 B] `targets/` 루트에 파일명으로 직접 저장
- `clay_v1.png`, `clay_v2.png`, `clay_v3.png`
- `copter_v1.png`, `copter_v2.png`, `copter_v3.png`
- `boom_v1.png`, `boom_v2.png`, `boom_v3.png`
- `ufo_v1.png`, `ufo_v2.png`, `ufo_v3.png`
- `chick_v1.png`, `chick_v2.png`, `chick_v3.png`

*(PNG, JPG, WebP 포맷 모두 지원)*

---

### 💡 이미지 권장 사양
- **포맷**: 배경이 투명한 **PNG** 권장 (투명 배경이 아닌 JPG도 자동 지원)
- **크기**: 256×256px ~ 512×512px (정사각형 비율 권장)
- **인게임 반영**:
  - 홈 화면의 타겟 선택 카드에 아이콘으로 표시
  - 마이페이지(MyPage)의 **마일리지 상점 & 보관함**에서 버전별 스킨 프리뷰로 표시
  - 3D 비행 씬에서 비행 궤적을 그리며 회전하는 타겟 텍스처로 자동 반영
