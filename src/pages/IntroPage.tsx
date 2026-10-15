// src/pages/IntroPage.tsx
// 인트로 동영상 전용 플레이어 화면 (초기 원반 비행 애니메이션 완전 제거)
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { soundManager } from '../game/audio/soundManager';

interface IntroPageProps {
  onComplete: () => void;
}

export const IntroPage: React.FC<IntroPageProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl
        .play()
        .catch(() => {
          // 브라우저 자동 재생 정책 차단 시 무음 처리 후 재시도
          videoEl.muted = true;
          videoEl.play().catch(() => {
            setVideoError(true);
          });
        });
    }
  }, []);

  const handleFinish = () => {
    soundManager.startBGM();
    onComplete();
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        zIndex: 100,
      }}
    >
      {/* 우측 상단 SKIP 버튼 */}
      <button
        onClick={handleFinish}
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.35)',
          color: '#ffffff',
          padding: '10px 22px',
          borderRadius: '30px',
          fontWeight: '700',
          fontSize: '15px',
          cursor: 'pointer',
          zIndex: 110,
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.borderColor = '#38bdf8';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)';
        }}
      >
        {t('skip')} ➔
      </button>

      {/* 인트로 동영상 플레이어 */}
      {!videoError ? (
        <video
          ref={videoRef}
          src="/brand/videos/intro.mp4"
          playsInline
          autoPlay
          onEnded={handleFinish}
          onError={() => setVideoError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        >
          <source src="/brand/videos/intro.mp4" type="video/mp4" />
          <source src={encodeURI('/brand/videos/claypop인트로 동영상.mp4')} type="video/mp4" />
        </video>
      ) : (
        /* 동영상 로드 실패 시 깔끔한 시작 화면 (원반 연출 없음) */
        <div style={{ textAlign: 'center', color: '#ffffff', padding: '24px' }}>
          <h1 style={{ fontSize: '42px', fontWeight: '900', marginBottom: '16px', color: '#38bdf8' }}>
            {t('gameTitle')}
          </h1>
          <p style={{ fontSize: '18px', color: '#cbd5e1', marginBottom: '32px' }}>
            {t('introHint')}
          </p>
          <button
            onClick={handleFinish}
            style={{
              padding: '14px 36px',
              fontSize: '18px',
              fontWeight: '800',
              borderRadius: '30px',
              border: 'none',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(249, 115, 22, 0.5)',
            }}
          >
            {t('startGame')} ➔
          </button>
        </div>
      )}
    </div>
  );
};
