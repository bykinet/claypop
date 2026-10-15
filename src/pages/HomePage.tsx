// src/pages/HomePage.tsx
// 홈 화면: 세션 시간(30~180s) 및 난이도 선택, 슈터/타겟 선택, Admin 메뉴, 사운드 토글
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GameConfig } from '../app/types';
import { userService } from '../entities/user/userService';
import { soundManager } from '../game/audio/soundManager';
import { toggleLocale, getCurrentLocaleLabel } from '../shared/i18n';
import { HowToPlayModal } from './HowToPlayModal';
import { SoundToggleButton } from '../shared/components/SoundToggleButton';
import { customAssetsService } from '../entities/assets/customAssetsService';

import { TargetType } from '../game/sim/types';
import { ALL_TARGET_TYPES, getTargetDefinition, getProjectileImageUrl } from '../game/targets/catalog';

interface HomePageProps {
  config: GameConfig;
  onChangeConfig: (newConfig: Partial<GameConfig>) => void;
  onStartGame: () => void;
  onGoMyPage: () => void;
  onLogout: () => void;
  onOpenLogin: () => void;
  onOpenAdmin: () => void;
}

const DURATIONS = [30, 60, 90, 120, 150, 180];
const DIFFICULTIES: ('easy' | 'normal' | 'hard')[] = ['easy', 'normal', 'hard'];

export const HomePage: React.FC<HomePageProps> = ({
  config,
  onChangeConfig,
  onStartGame,
  onGoMyPage,
  onLogout,
  onOpenLogin,
  onOpenAdmin,
}) => {
  const { t, i18n } = useTranslation();
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [, setCustomAssetsVersion] = useState(0);

  const user = userService.getCurrentUser();
  const currentMileage = userService.getMileage();
  const isLoggedIn = userService.isLoggedIn();
  const isAdmin = userService.isAdmin();

  useEffect(() => {
    const unsub = customAssetsService.subscribe(() => {
      setCustomAssetsVersion((v) => v + 1);
    });
    return () => unsub();
  }, []);

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

  // 슈터 목록 (기본 슈터 2종 + 관리자가 추가한 커스텀 슈터 최대 3종)
  const customShooters = customAssetsService.getShooters();
  const allShooters = [
    { id: 'shooter1', name: t('shooter1Name'), file: 'shooter1.png', altFile: '슈터이미지_1_3D.png' },
    { id: 'shooter2', name: t('shooter2Name'), file: 'shooter2.png', altFile: '슈터이미지_2_수퍼맨.png' },
    ...customShooters.map((cs) => ({
      id: cs.id,
      name: `⭐ ${cs.name}`,
      file: cs.file,
      altFile: cs.altFile,
    })),
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '580px', maxHeight: '92vh', overflowY: 'auto' }}>
        {/* 상단 사용자 상태 바 & 마일리지 배지 & 사운드/로그아웃 토글 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          {/* 상단 가장 왼쪽: 사운드 On/Off 아이콘 버튼 및 유저 배지 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SoundToggleButton />
            <span style={{ fontSize: '15px', fontWeight: '800', color: '#f8fafc' }}>
              {user?.nickname || 'Guest'}
            </span>
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.25) 100%)',
                border: '1px solid #f59e0b',
                color: '#f59e0b',
                padding: '3px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              ⭐ {currentMileage.toLocaleString()} M
            </div>
          </div>

          {/* 상단 우측 메뉴 그룹: 사용방법 / 언어 / 상점 / [Admin] / [로그아웃/로그인 토글] */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {/* 사용방법 버튼 */}
            <button
              onClick={() => setShowHowToPlay(true)}
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.5)',
                color: '#f59e0b',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="게임 사용방법 및 조작 가이드"
            >
              📖 {t('howToPlay')}
            </button>

            {/* 언어 토글 버튼 (KO -> EN -> JA -> KO 순서) */}
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
                fontWeight: '700',
              }}
              title="언어 전환 (KO -> EN -> JA)"
            >
              🌐 {getCurrentLocaleLabel(i18n.language)}
            </button>

            <button
              onClick={onGoMyPage}
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              {t('shopTitle')}
            </button>

            {/* 관리자에게만 보이는 Admin 버튼 (로그아웃 버튼 바로 왼쪽에 위치!) */}
            {isAdmin && (
              <button
                onClick={onOpenAdmin}
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(217, 119, 6, 0.3) 100%)',
                  border: '1px solid #f59e0b',
                  color: '#f59e0b',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: '800',
                  boxShadow: '0 0 10px rgba(245, 158, 11, 0.35)',
                }}
                title="관리자(Admin) 전용 캐릭터/배경/타겟 설정"
              >
                ⚙️ Admin
              </button>
            )}

            {/* 상단 가장 오른쪽: 로그인/로그아웃 토글 버튼 */}
            {isLoggedIn ? (
              <button
                onClick={onLogout}
                style={{
                  background: 'rgba(239, 68, 68, 0.18)',
                  border: '1px solid #ef4444',
                  color: '#fca5a5',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: '700',
                }}
                title="로그아웃하고 인트로 화면으로 이동"
              >
                🚪 {t('logout')}
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: '800',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
                }}
                title="로그인 화면 열기"
              >
                🔑 {t('loginToSave')}
              </button>
            )}
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
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {t('targetSelectDesc')}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))', gap: '6px' }}>
            {[...ALL_TARGET_TYPES, ...customAssetsService.getTargets().map((ct) => ct.id as TargetType)].map((type) => {
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

        {/* 1-2. 슈터(총기/캐릭터) 선택 섹션 */}
        <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc' }}>
              🔫 {t('shooterSelectTitle')}
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {t('shooterSelectDesc')}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(allShooters.length, 3)}, 1fr)`, gap: '8px' }}>
            {allShooters.map((shooter) => {
              const isSelected = (config.selectedShooter ?? 'shooter1') === shooter.id;
              return (
                <div
                  key={shooter.id}
                  onClick={() => onChangeConfig({ selectedShooter: shooter.id })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
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
                      width: '38px',
                      height: '38px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      position: 'relative',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ position: 'absolute', fontSize: '16px' }}>🔫</span>
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
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: isSelected ? '#f59e0b' : '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {shooter.name}
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

      {/* 사용방법 안내 모달 */}
      {showHowToPlay && (
        <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
      )}
    </div>
  );
};
