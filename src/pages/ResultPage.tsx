// src/pages/ResultPage.tsx
// 결과 화면: 등급, 점수(aria-live), 통계, TOP 20 랭킹 및 재도전
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SimState } from '../game/sim/types';
import { calculateGrade, getTheoreticalMax } from '../game/sim/score';
import { userService } from '../entities/user/userService';
import { SessionRecord } from '../shared/firebase/firebase';
import { soundManager } from '../game/audio/soundManager';

interface ResultPageProps {
  finalSim: SimState;
  stillCanvasUrl?: string;
  onRetry: () => void;
  onGoHome: () => void;
  onGoMyPage: () => void;
}

export const ResultPage: React.FC<ResultPageProps> = ({
  finalSim,
  stillCanvasUrl,
  onRetry,
  onGoHome,
  onGoMyPage,
}) => {
  const { t } = useTranslation();
  const [rankings, setRankings] = useState<SessionRecord[]>([]);
  const [loadingRank, setLoadingRank] = useState(true);

  const theoreticalMax = getTheoreticalMax(finalSim.duration);
  const grade = calculateGrade(finalSim.score, theoreticalMax);
  const [earnedMileage, setEarnedMileage] = useState(0);

  // 세션 기록 저장 및 랭킹 로드, 마일리지 지급
  useEffect(() => {
    const user = userService.getCurrentUser();
    // 마일리지 계산: 점수의 5% + 성공 보너스 50M
    const mileageReward = Math.max(1, Math.floor(finalSim.score / 20) + (finalSim.outcome === 'success' ? 50 : 10));
    setEarnedMileage(mileageReward);
    userService.addMileage(mileageReward);
    soundManager.playMileageCoin();

    const session: SessionRecord = {
      uid: user?.uid || 'guest',
      nickname: user?.nickname || 'Guest',
      duration: finalSim.duration,
      difficulty: finalSim.difficulty,
      missLimit: finalSim.missLimit,
      score: finalSim.score,
      maxCombo: finalSim.maxCombo,
      hits: finalSim.hits,
      misses: finalSim.misses,
      centerHits: finalSim.centerHits,
      echoHits: finalSim.echoHits,
      clayHits: finalSim.clayHits,
      copterHits: finalSim.copterHits,
      boomHits: finalSim.boomHits,
      ufoHits: finalSim.ufoHits,
      chickHits: finalSim.chickHits,
      outcome: finalSim.outcome === 'success' ? 'success' : 'failure',
      completed: true,
      startedAt: Date.now() - finalSim.duration * 1000,
      endedAt: Date.now(),
    };

    userService.recordSession(session).then(() => {
      userService
        .getTop20Rankings(finalSim.duration, finalSim.difficulty, finalSim.missLimit)
        .then((records) => {
          setRankings(records);
          setLoadingRank(false);
        })
        .catch(() => {
          setLoadingRank(false);
        });
    });
  }, [finalSim]);

  const gradeColors: Record<string, string> = {
    S: '#f59e0b',
    A: '#38bdf8',
    B: '#10b981',
    C: '#94a3b8',
  };

  return (
    <div
      className="modal-overlay"
      style={{
        backgroundImage: stillCanvasUrl ? `url(${stillCanvasUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="modal-card" style={{ maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* 결과 타이틀 및 등급 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#f8fafc' }}>
              {finalSim.outcome === 'success' ? t('successTitle') : t('failureTitle')}
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>{t('resultTitle')}</p>
          </div>

          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.4)',
              border: `3px solid ${gradeColors[grade] || '#fff'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: '900',
              color: gradeColors[grade] || '#fff',
              boxShadow: `0 0 16px ${gradeColors[grade]}66`,
            }}
          >
            {grade}
          </div>
        </div>

        {/* 점수 디스플레이 (aria-live 필수) */}
        <div
          aria-live="polite"
          style={{
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '13px', color: '#94a3b8', letterSpacing: '1px' }}>
            {t('scoreLabel')}
          </div>
          <div
            className="tabular-nums"
            style={{
              fontSize: '44px',
              fontWeight: '800',
              color: '#f59e0b',
              marginTop: '2px',
            }}
          >
            {finalSim.score}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            Theoretical Max: {theoreticalMax}
          </div>

          {/* 마일리지 획득 배너 */}
          <div
            style={{
              marginTop: '12px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%)',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#f59e0b' }}>
              ⭐ +{earnedMileage} {t('earnedMileage')}!
            </span>
            <span style={{ fontSize: '12px', color: '#f8fafc', fontWeight: '600' }}>
              {t('mileageLabel')}: {userService.getMileage().toLocaleString()} M
            </span>
          </div>
        </div>

        {/* 주요 지표 그리드 (명중, 놓침, 메아리 명중, 최대 콤보) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '10px 6px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{t('hits')}</div>
            <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginTop: '2px' }}>
              {finalSim.hits}
            </div>
          </div>

          <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '10px 6px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{t('misses')}</div>
            <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: '700', color: '#ff2d55', marginTop: '2px' }}>
              {finalSim.misses}
            </div>
          </div>

          <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '10px 6px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{t('echoHits')}</div>
            <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: '700', color: '#38bdf8', marginTop: '2px' }}>
              {finalSim.echoHits}
            </div>
          </div>

          <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '10px 6px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Max {t('comboLabel')}</div>
            <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: '700', color: '#f59e0b', marginTop: '2px' }}>
              {finalSim.maxCombo}
            </div>
          </div>
        </div>

        {/* TOP 20 랭킹 리스트 */}
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#94a3b8', marginBottom: '8px' }}>
            {t('top20Rankings')} ({finalSim.duration}s / {finalSim.difficulty})
          </h3>

          <div
            style={{
              maxHeight: '140px',
              overflowY: 'auto',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '13px',
            }}
          >
            {loadingRank ? (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '12px' }}>Loading...</div>
            ) : rankings.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '12px' }}>
                {t('noRankings')}
              </div>
            ) : (
              rankings.map((r, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '4px 0',
                    borderBottom: idx < rankings.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                  }}
                >
                  <span style={{ color: idx < 3 ? '#f59e0b' : '#94a3b8', fontWeight: '600' }}>
                    #{idx + 1} {r.nickname || 'Guest'}
                  </span>
                  <span className="tabular-nums" style={{ color: '#fff', fontWeight: '700' }}>
                    {r.score}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
          <button
            onClick={onRetry}
            style={{
              flex: 2,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#ffffff',
              padding: '14px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: '700',
              fontSize: '15px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
            }}
          >
            {t('retry')}
          </button>
          <button
            onClick={onGoHome}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              padding: '14px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {t('home')}
          </button>
          <button
            onClick={onGoMyPage}
            style={{
              flex: 1,
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              padding: '14px',
              borderRadius: '10px',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {t('myPage')}
          </button>
        </div>
      </div>
    </div>
  );
};
