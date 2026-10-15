// src/app/App.tsx
// 클레이 팝 전체 화면 상태 관리 및 흐름 제어 컴포넌트
import React, { useState, useEffect } from 'react';
import { AppScreen, GameConfig } from './types';
import { FirstPage } from '../pages/FirstPage';
import { NicknamePage } from '../pages/NicknamePage';
import { HomePage } from '../pages/HomePage';
import { IntroPage } from '../pages/IntroPage';
import { PlayPage } from '../pages/PlayPage';
import { ResultPage } from '../pages/ResultPage';
import { MyPage } from '../pages/MyPage';
import { AdminPage } from '../pages/AdminPage';
import { userService } from '../entities/user/userService';
import { SimState } from '../game/sim/types';
import { UserProfile } from '../shared/firebase/firebase';

export const App: React.FC = () => {
  // 바로 인트로 동영상부터 시작 (초기 업로드 화면 제거)
  const [screen, setScreen] = useState<AppScreen>('intro');
  const [initialIntroDone, setInitialIntroDone] = useState(false);

  const [gameConfig, setGameConfig] = useState<GameConfig>({
    duration: 60,
    difficulty: 'normal',
    selectedTargets: ['clay'],
    selectedShooter: 'shooter1',
  });
  const [finalSimState, setFinalSimState] = useState<SimState | null>(null);
  const [stillCanvasUrl, setStillCanvasUrl] = useState<string | undefined>(undefined);

  // 초기 사용자 확인 및 자동 게스트 로그인
  useEffect(() => {
    const user = userService.getCurrentUser();
    if (!user) {
      userService.loginAsGuest().catch(() => {});
    }
  }, []);

  // 30분 비활성 타이머 검사 (10초마다 체크, play와 ending 동안에는 유지)
  useEffect(() => {
    const interval = setInterval(() => {
      userService.checkInactivity(screen, () => {
        setScreen('home');
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [screen]);

  // 설정 변경
  const handleChangeConfig = (newConfig: Partial<GameConfig>) => {
    setGameConfig((prev) => ({ ...prev, ...newConfig }));
  };

  // 로그인 성공 시
  const handleAuthSuccess = (user: UserProfile) => {
    if (!user.nickname) {
      setScreen('nickname');
    } else {
      setScreen('home');
    }
  };

  // 인트로 종료 시 흐름 제어
  const handleIntroComplete = () => {
    if (!initialIntroDone) {
      setInitialIntroDone(true);
      setScreen('home');
    } else {
      setScreen('play');
    }
  };

  // 게임 종료 시 (Play -> Result)
  const handleFinishGame = (finalSim: SimState, stillUrl?: string) => {
    setFinalSimState(finalSim);
    setStillCanvasUrl(stillUrl);
    setScreen('result');
  };

  // 로그아웃 처리: 인트로 화면으로 복귀하고 게스트 상태로 전환
  const handleLogout = async () => {
    await userService.logout();
    await userService.loginAsGuest().catch(() => {});
    setInitialIntroDone(false);
    setScreen('intro');
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* 1. 인트로 동영상 화면 (앱 구동 즉시 시작) */}
      {screen === 'intro' && (
        <IntroPage onComplete={handleIntroComplete} />
      )}

      {/* 2. 첫 화면 / 로그인 모달 */}
      {screen === 'first' && (
        <FirstPage
          onSuccess={handleAuthSuccess}
          onCancel={() => setScreen('home')}
        />
      )}

      {/* 3. 닉네임 설정 화면 */}
      {screen === 'nickname' && (
        <NicknamePage onSuccess={() => setScreen('home')} />
      )}

      {/* 4. 홈 화면 (세팅 및 타겟/슈터 선택) */}
      {screen === 'home' && (
        <HomePage
          config={gameConfig}
          onChangeConfig={handleChangeConfig}
          onStartGame={() => setScreen('play')}
          onGoMyPage={() => setScreen('mypage')}
          onLogout={handleLogout}
          onOpenLogin={() => setScreen('first')}
          onOpenAdmin={() => setScreen('admin')}
        />
      )}

      {/* 5. 인게임 플레이 화면 (3D 슈터 및 3초 엔딩 애니메이션 포함) */}
      {screen === 'play' && (
        <PlayPage
          config={gameConfig}
          onFinishGame={handleFinishGame}
          onGoMyPage={() => setScreen('mypage')}
        />
      )}

      {/* 6. 결과 스코어보드 화면 */}
      {screen === 'result' && finalSimState && (
        <ResultPage
          finalSim={finalSimState}
          stillCanvasUrl={stillCanvasUrl}
          onRetry={() => setScreen('play')}
          onGoHome={() => setScreen('home')}
          onGoMyPage={() => setScreen('mypage')}
          onLogout={handleLogout}
          onOpenLogin={() => setScreen('first')}
          onOpenAdmin={() => setScreen('admin')}
        />
      )}

      {/* 7. 마이페이지 화면 */}
      {screen === 'mypage' && (
        <MyPage
          onBack={() => setScreen('home')}
          onAccountDeleted={() => setScreen('home')}
          onLogout={handleLogout}
        />
      )}

      {/* 8. 관리자(Admin) 전용 화면 */}
      {screen === 'admin' && (
        <AdminPage
          onBack={() => setScreen('home')}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};
