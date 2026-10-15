// src/pages/HomePage.tsx
// 홈 화면: 세션 시간(30~180s) 및 난이도 선택, 게임 시작
import React from 'react';
import { useTranslation } from 'react-i18next';
import { GameConfig } from '../app/types';
import { userService } from '../entities/user/userService';
import { soundManager } from '../game/audio/soundManager';
import { toggleLocale } from '../shared/i18n';

import { TargetType } from '../game/sim/types';
import { ALL_TARGET_TYPES, getTargetDefinition, getProjectileImageUrl } from '../game/targets/catalog';

interface HomePageProps {
  config: GameConfig;
  onChangeConfig: (newConfig: Partial<GameConfig>) => void;
  onStartGame: () => void;
  onGoMyPage: () => void;
  onLogout: () => void;
}

const DURATIONS = [30, 60, 90, 120, 150, 180];
const DIFFICULTIES: ('easy' | 'normal' | 'hard')[] = ['easy', 'normal', 'hard'];

export const HomePage: React.FC<HomePageProps> = ({
  config,
  onChangeConfig,
  onStartGame,
  onGoMyPage,
  onLogout,
}) => {
  const { t, i18n } = useTranslation();
  const user = userService.getCurrentUser();
  const currentMileage = userService.getMileage();

  const handleStart = () => {
    soundManager.initContext();
    onStartGame();
  };

  const currentLang = (i18n.language as 'en' | 'ko' | 'ja') || 'ko';

  // [명세]: 슈팅 타겟 설정은 한 게임에 1종류만 설정
  const handleSelectTarget = (type: TargetType) => {
    onChangeConfig({ selectedTargets: [type] });
  };

  const selectedTarget: TargetType = (config.selectedTargets && config.selectedTargets[0]) || 'clay';

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '560px', maxHeight: '92vh', overflowY: 'auto' }}>
        {/* 상단 사용자 상태 바 & 마일리지 배지 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc' }}>
              {user?.nickname || 'Guest'}
            </span>
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.25) 100%)',
                border: '1px solid #f59e0b',
                color: '#f59e0b',
                padding: '3px 10px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              ⭐ {currentMileage.toLocaleString()} M
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => toggleLocale()}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {i18n.language.toUpperCase()}
            </button>
            <button
              onClick={onGoMyPage}
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              {t('shopTitle')}
            </button>
            <button
              onClick={onLogout}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {t('logout')}
            </button>
          </div>
        </div>

        {/* 게임 타이틀 배너 */}
        <div style={{ textAlign: 'center', margin: '4px 0' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#f59e0b', letterSpacing: '1px' }}>
            {t('gameTitle')}
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
            {t('introHint')}
          </p>
        </div>

        {/* 1. 타겟 종류 설정 섹션 (설정된 타겟만 슈팅) */}
        <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc' }}>
                🎯 {t('targetSelectTitle')}
              </span>
              <span style={{ fontSize: '11px', color: '#38bdf8', marginLeft: '6px', fontWeight: '600' }}>
                (1종류 선택)
              </span>
            </div>
            <div
              style={{
                fontSize: '11px',
                color: '#f59e0b',
                fontWeight: '700',
                background: 'rgba(245, 158, 11, 0.15)',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              선택: {getTargetDefinition(selectedTarget).name[currentLang]}
            </div>
          </div>

          {/* 5종 타겟 선택 카드 그리드 (1종류 전용 선택) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
            {ALL_TARGET_TYPES.map((type) => {
              const def = getTargetDefinition(type);
              const isSelected = selectedTarget === type;
              return (
                <div
                  key={type}
                  onClick={() => handleSelectTarget(type)}
                  style={{
                    background: isSelected ? 'rgba(245, 158, 11, 0.25)' : 'rgba(0, 0, 0, 0.4)',
                    border: isSelected ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '6px 4px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 0 12px rgba(245, 158, 11, 0.5)' : 'none',
                    transform: isSelected ? 'scale(1.03)' : 'scale(1.0)',
                  }}
                >
                  <img
                    src={def.icon}
                    alt={def.name[currentLang]}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '6px',
                      objectFit: 'cover',
                      display: 'block',
                      margin: '0 auto 4px',
                      border: isSelected ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  />
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: isSelected ? '#f59e0b' : '#94a3b8',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {def.name[currentLang].split(' ')[0]}
                  </div>
                  <div
                    style={{
                      fontSize: '9px',
                      fontWeight: '700',
                      color: isSelected ? '#10b981' : '#64748b',
                      marginTop: '2px',
                    }}
                  >
                    {isSelected ? '🎯 선택됨' : '선택'}
                  </div>
                  {/* 탄환(발사체) 아이콘 표시 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', marginTop: '2px' }}>
                    <img
                      src={getProjectileImageUrl(def.projectile)}
                      alt={def.projectile}
                      style={{ width: '12px', height: '12px', objectFit: 'contain' }}
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span style={{ fontSize: '9px', color: isSelected ? '#f59e0b' : '#64748b' }}>
                      🚀
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 1-2. 슈터(총기) 선택 섹션 */}
        <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc' }}>
              🔫 {t('shooterSelectTitle')}
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {t('shooterSelectDesc')}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {[
              { id: 'shooter1' as const, name: t('shooter1Name'), file: 'shooter1.png', altFile: '슈터이미지_1_3D.png' },
              { id: 'shooter2' as const, name: t('shooter2Name'), file: 'shooter2.png', altFile: '슈터이미지_2_수퍼맨.png' },
            ].map((shooter) => {
              const isSelected = (config.selectedShooter ?? 'shooter1') === shooter.id;
              return (
                <div
                  key={shooter.id}
                  onClick={() => onChangeConfig({ selectedShooter: shooter.id })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(245, 158, 11, 0.25)' : 'rgba(0, 0, 0, 0.35)',
                    border: isSelected ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: isSelected ? '0 0 12px rgba(245, 158, 11, 0.35)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      position: 'relative',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                    }}
                  >
                    <span style={{ position: 'absolute', fontSize: '18px' }}>🔫</span>
                    <img
                      src={`/brand/shooters/${shooter.file}`}
                      alt={shooter.name}
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        zIndex: 1,
                      }}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.includes(encodeURI(shooter.altFile))) {
                          target.src = encodeURI(`/brand/shooters/${shooter.altFile}`);
                        } else {
                          target.style.display = 'none';
                        }
                      }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: isSelected ? '#f59e0b' : '#f8fafc' }}>
                      {shooter.name}
                    </div>
                    <div style={{ fontSize: '10px', color: isSelected ? '#38bdf8' : '#64748b' }}>
                      {shooter.file}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. 세션 시간 선택 (30, 60, 90, 120, 150, 180) */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
            ⏱️ {t('sessionLength')}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
            {DURATIONS.map((dur) => (
              <button
                key={dur}
                onClick={() => onChangeConfig({ duration: dur })}
                style={{
                  padding: '8px 4px',
                  borderRadius: '8px',
                  border: config.duration === dur ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.15)',
                  background: config.duration === dur ? 'rgba(245, 158, 11, 0.25)' : 'rgba(0, 0, 0, 0.3)',
                  color: config.duration === dur ? '#f59e0b' : '#f8fafc',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-num)',
                }}
              >
                {dur}{t('secondsUnit')}
              </button>
            ))}
          </div>
        </div>

        {/* 3. 난이도 선택 (쉬움 / 보통 / 어려움) */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
            ⚡ {t('difficulty')}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {DIFFICULTIES.map((diff) => {
              const label =
                diff === 'easy' ? t('diffEasy') : diff === 'normal' ? t('diffNormal') : t('diffHard');
              const isSelected = config.difficulty === diff;
              return (
                <button
                  key={diff}
                  onClick={() => onChangeConfig({ difficulty: diff })}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.15)',
                    background: isSelected ? 'rgba(245, 158, 11, 0.25)' : 'rgba(0, 0, 0, 0.3)',
                    color: isSelected ? '#f59e0b' : '#f8fafc',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 하단 게임 시작 버튼 */}
        <button
          onClick={handleStart}
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#ffffff',
            padding: '15px',
            borderRadius: '12px',
            border: 'none',
            fontWeight: '800',
            fontSize: '18px',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(245, 158, 11, 0.5)',
            marginTop: '4px',
            transition: 'transform 0.1s ease',
          }}
        >
          {t('startGame')}
        </button>
      </div>
    </div>
  );
};
