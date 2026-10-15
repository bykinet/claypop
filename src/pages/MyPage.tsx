// src/pages/MyPage.tsx
// 마이페이지: 별명 수정, 비밀번호 표시, 탈퇴(2단계 확인)
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { userService } from '../entities/user/userService';

import {
  ALL_TARGET_TYPES,
  getTargetDefinition,
  getTargetImageUrl,
  getTargetFallbackImageUrl,
  getProjectileImageUrl,
} from '../game/targets/catalog';

interface MyPageProps {
  onBack: () => void;
  onAccountDeleted: () => void;
  onLogout: () => void;
}

export const MyPage: React.FC<MyPageProps> = ({ onBack, onAccountDeleted, onLogout }) => {
  const { t, i18n } = useTranslation();
  const user = userService.getCurrentUser();
  const currentLang = (i18n.language as 'en' | 'ko' | 'ja') || 'ko';

  const [activeTab, setActiveTab] = useState<'profile' | 'shop'>('shop');
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [nickSuccess, setNickSuccess] = useState('');
  const [nickError, setNickError] = useState('');

  const [mileage, setMileage] = useState(userService.getMileage());
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(userService.getUnlockedSkins());

  // 탈퇴 2단계 상태
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteNotice, setDeleteNotice] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // 스킨 해금 핸들러
  const handleUnlockSkin = (skinId: string, cost: number) => {
    if (mileage < cost) {
      alert(t('notEnoughMileage'));
      return;
    }
    const ok = userService.unlockSkin(skinId, cost);
    if (ok) {
      setMileage(userService.getMileage());
      setUnlockedSkins(userService.getUnlockedSkins());
    }
  };

  // 별명 수정 저장
  const handleSaveNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    setNickSuccess('');
    setNickError('');

    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 12) {
      setNickError(t('nicknameLengthError'));
      return;
    }

    try {
      await userService.setNickname(trimmed);
      setNickSuccess(t('save') + ' OK!');
    } catch {
      setNickError(t('nicknameLengthError'));
    }
  };

  // 탈퇴 처리 (1단계 클릭 -> 2단계 '탈퇴 확인' 라벨 변경)
  const handleDeleteClick = async () => {
    if (deleteStep === 1) {
      setDeleteStep(2);
      setDeleteNotice(t('deleteAccountNotice'));
      return;
    }

    setIsDeleting(true);
    try {
      await userService.deleteAccount();
      alert(t('deleteSuccess'));
      onAccountDeleted();
    } catch (err) {
      console.error(err);
      setIsDeleting(false);
      setDeleteStep(1);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '580px', maxHeight: '92vh', overflowY: 'auto' }}>
        {/* 상단 네비게이션 & 탭 전환 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('shop')}
              style={{
                background: activeTab === 'shop' ? 'rgba(245, 158, 11, 0.25)' : 'none',
                border: activeTab === 'shop' ? '1px solid #f59e0b' : 'none',
                color: activeTab === 'shop' ? '#f59e0b' : '#94a3b8',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              🏪 {t('shopTitle')}
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              style={{
                background: activeTab === 'profile' ? 'rgba(56, 189, 248, 0.2)' : 'none',
                border: activeTab === 'profile' ? '1px solid #38bdf8' : 'none',
                color: activeTab === 'profile' ? '#38bdf8' : '#94a3b8',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              👤 {t('myPage')}
            </button>
          </div>

          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#38bdf8',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            ← {t('home')}
          </button>
        </div>

        {/* 탭 1: 마일리지 상점 & 보관함 */}
        {activeTab === 'shop' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* 현재 보유 마일리지 카드 */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%)',
                border: '1px solid #f59e0b',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{t('mileageLabel')} Balance</span>
                <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: '800', color: '#f59e0b' }}>
                  ⭐ {mileage.toLocaleString()} M
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'right' }}>
                Clear matches to earn more!
              </div>
            </div>

            {/* 타겟별 스킨 목록 그리드 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {ALL_TARGET_TYPES.map((type) => {
                const def = getTargetDefinition(type);
                return (
                  <div
                    key={type}
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <img
                        src={def.icon}
                        alt={def.name[currentLang]}
                        style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc' }}>
                          {def.name[currentLang]}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {def.desc[currentLang]}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                          <img
                            src={getProjectileImageUrl(def.projectile)}
                            alt={def.projectile}
                            style={{ width: '14px', height: '14px', objectFit: 'contain' }}
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                          <span style={{ fontSize: '10px', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                            탄환: {def.projectile}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 버전 1, 2, 3 스킨 목록 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                      {def.variants.map((variant) => {
                        const skinKey = `${def.id}_v${variant.version}`;
                        const isUnlocked = variant.unlockedByDefault || unlockedSkins.includes(skinKey);
                        return (
                          <div
                            key={variant.version}
                            style={{
                              background: 'rgba(255, 255, 255, 0.04)',
                              borderRadius: '8px',
                              padding: '8px 6px',
                              textAlign: 'center',
                              border: isUnlocked ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                            }}
                          >
                            <div
                              style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                background: 'rgba(0, 0, 0, 0.35)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                marginBottom: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <img
                                src={getTargetImageUrl(type, variant.version)}
                                alt={variant.name[currentLang]}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  const fallbackUrl = getTargetFallbackImageUrl(type, variant.version);
                                  if (target.src.includes(`/${type}/v${variant.version}`)) {
                                    target.src = fallbackUrl;
                                  } else if (!target.src.includes(def.icon)) {
                                    target.src = def.icon;
                                  }
                                }}
                              />
                            </div>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#fff' }}>
                              {variant.name[currentLang]}
                            </div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', margin: '2px 0' }}>
                              Ver.{variant.version}
                            </div>
                            {isUnlocked ? (
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#10b981' }}>
                                ✓ {t('unlocked')}
                              </span>
                            ) : (
                              <button
                                onClick={() => handleUnlockSkin(skinKey, variant.priceMileage)}
                                style={{
                                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '2px 8px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                }}
                              >
                                {variant.priceMileage} M {t('unlock')}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 탭 2: 사용자 프로필 및 탈퇴 */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* 별명 수정 섹션 */}
            <form onSubmit={handleSaveNickname} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', color: '#94a3b8' }}>
                {t('editNickname')}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  maxLength={12}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    fontSize: '14px',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#fff',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  {t('save')}
                </button>
              </div>
              {nickSuccess && <span style={{ fontSize: '12px', color: '#10b981' }}>{nickSuccess}</span>}
              {nickError && <span style={{ fontSize: '12px', color: '#ff2d55' }}>{nickError}</span>}
            </form>

            {/* 비밀번호 표시 섹션 */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                {t('password')}
              </label>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <span style={{ letterSpacing: '2px', color: '#94a3b8' }}>{t('currentPasswordMasked')}</span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  {user?.provider === 'guest' ? 'Guest Auth' : user?.provider || 'Protected'}
                </span>
              </div>
            </div>

            {/* 탈퇴 안내 및 탈퇴 버튼 */}
            <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
              {deleteNotice && (
                <p
                  style={{
                    fontSize: '12px',
                    color: '#ff2d55',
                    lineHeight: 1.5,
                    marginBottom: '10px',
                    background: 'rgba(255, 45, 85, 0.1)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                  }}
                >
                  {deleteNotice}
                </p>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  style={{
                    flex: 1,
                    background: deleteStep === 2 ? '#ff2d55' : 'rgba(255, 45, 85, 0.15)',
                    color: deleteStep === 2 ? '#ffffff' : '#ff2d55',
                    border: '1px solid #ff2d55',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {deleteStep === 2 ? t('confirmDelete') : t('deleteAccount')}
                </button>

                <button
                  onClick={onLogout}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#94a3b8',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  {t('logout')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
