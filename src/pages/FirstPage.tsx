// src/pages/FirstPage.tsx
// 클레이 팝 로그인/회원가입 화면 (게스트, Google, 이메일, 전화번호 지원 및 KO->EN->JA 실시간 다국어 지원)
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toggleLocale, getCurrentLocaleLabel } from '../shared/i18n';
import { userService } from '../entities/user/userService';
import { UserProfile } from '../shared/firebase/firebase';
import { SoundToggleButton } from '../shared/components/SoundToggleButton';

interface FirstPageProps {
  onSuccess: (user: UserProfile) => void;
  onCancel?: () => void;
}

const COUNTRY_OPTIONS = [
  { code: '+82', flag: '🇰🇷', name: 'KR' },
  { code: '+1', flag: '🇺🇸', name: 'US' },
  { code: '+81', flag: '🇯🇵', name: 'JP' },
];

export const FirstPage: React.FC<FirstPageProps> = ({ onSuccess, onCancel }) => {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<'main' | 'email' | 'phone'>('main');
  const [isSignUp, setIsSignUp] = useState(false);

  // 이메일 폼 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 전화번호 폼 상태
  const [selectedCountry, setSelectedCountry] = useState('+82');
  const [phone, setPhone] = useState('');
  const [phonePassword, setPhonePassword] = useState('');

  // 로딩 & 에러 상태
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // 언어 토글 핸들러 (한국어 -> 영어 -> 일본어 순서)
  const handleToggleLang = () => {
    toggleLocale();
  };

  // 오류 메시지 파싱
  const handleAuthError = (err: any) => {
    const code = err?.code || '';
    if (code.includes('email-already-in-use')) {
      setErrorMessage(t('emailAlreadyInUse'));
    } else if (code.includes('wrong-password') || code.includes('invalid-credential') || code.includes('user-not-found')) {
      setErrorMessage(t('loginFailedEmail'));
    } else if (code.includes('weak-password')) {
      setErrorMessage(t('passwordHint'));
    } else if (code.includes('popup-closed-by-user')) {
      setErrorMessage('');
    } else {
      setErrorMessage(err?.message || t('loginFailedEmail'));
    }
  };

  // 1. 게스트 로그인
  const handleGuest = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const user = await userService.loginAsGuest();
      onSuccess(user);
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Google 로그인
  const handleGoogle = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const user = await userService.loginWithGoogle();
      onSuccess(user);
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  // 3. 이메일 로그인 / 회원가입 제출
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage(t('emailEmpty'));
      return;
    }

    const passRegex = /^[a-zA-Z0-9]{6,20}$/;
    if (!passRegex.test(password)) {
      setErrorMessage(t('passwordInvalid'));
      return;
    }

    if (isSignUp && password !== passwordConfirm) {
      setErrorMessage(t('passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      const user = await userService.loginWithEmail(email.trim(), password, isSignUp);
      onSuccess(user);
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  // 4. 전화번호 로그인 / 등록 제출
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanNumber = phone.trim().replace(/[^0-9]/g, '');
    if (cleanNumber.length < 8) {
      setErrorMessage(t('loginFailedPhone'));
      return;
    }

    const passRegex = /^[a-zA-Z0-9]{6,20}$/;
    if (!passRegex.test(phonePassword)) {
      setErrorMessage(t('passwordInvalid'));
      return;
    }

    setLoading(true);
    const fullPhone = `${selectedCountry}${cleanNumber.replace(/^0+/, '')}`;
    try {
      const user = await userService.loginWithPhone(fullPhone, phonePassword);
      onSuccess(user);
    } catch (err) {
      setErrorMessage(t('loginFailedPhone'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
    >
      <div
        className="modal-card"
        style={{
          background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '18px',
          padding: '28px 24px',
          maxWidth: '440px',
          width: '100%',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.7), 0 0 30px rgba(245, 158, 11, 0.25)',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          position: 'relative',
        }}
      >
        {/* 상단 헤더: 타이틀, 사운드 토글 및 언어 토글 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SoundToggleButton />
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#f59e0b', letterSpacing: '0.5px', margin: 0 }}>
                🎯 {t('gameTitle')}
              </h1>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px', margin: 0 }}>
                {t('loginSubtitle')}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* 언어 토글 버튼 (KO -> EN -> JA -> KO 순서) */}
            <button
              onClick={handleToggleLang}
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid #f59e0b',
                color: '#f59e0b',
                padding: '5px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="언어 전환 (KO -> EN -> JA)"
            >
              🌐 {getCurrentLocaleLabel(i18n.language)}
            </button>

            {onCancel && (
              <button
                onClick={onCancel}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#94a3b8',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '15px',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 오류 메시지 배너 */}
        {errorMessage && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              color: '#fca5a5',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              textAlign: 'center',
              fontWeight: '500',
            }}
          >
            ⚠️ {errorMessage}
          </div>
        )}

        {/* 탭 1: 메인 로그인 선택지 */}
        {tab === 'main' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* 1. 게스트 빠른 시작 */}
            <button
              onClick={handleGuest}
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: '800',
                fontSize: '16px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'transform 0.1s ease',
              }}
            >
              ⚡ {t('guest')}
            </button>

            {/* 2. Google 로그인 */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              style={{
                background: '#ffffff',
                color: '#1e293b',
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              {t('loginWithGoogle')}
            </button>

            {/* 구분선 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
              <span style={{ fontSize: '11px', color: '#64748b' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
            </div>

            {/* 3. 이메일 로그인 */}
            <button
              onClick={() => { setTab('email'); setIsSignUp(false); setErrorMessage(''); }}
              style={{
                background: 'rgba(255, 255, 255, 0.07)',
                color: '#f8fafc',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background 0.15s ease',
              }}
            >
              ✉️ {t('loginWithEmail')}
            </button>

            {/* 4. 전화번호 로그인 */}
            <button
              onClick={() => { setTab('phone'); setErrorMessage(''); }}
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                color: '#38bdf8',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background 0.15s ease',
              }}
            >
              📱 {t('loginWithPhone')}
            </button>
          </div>
        )}

        {/* 탭 2: 이메일 로그인 / 회원가입 */}
        {tab === 'email' && (
          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* 세그먼트 탭: 로그인 / 회원가입 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', background: 'rgba(0, 0, 0, 0.3)', padding: '4px', borderRadius: '10px' }}>
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setErrorMessage(''); }}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: !isSignUp ? 'rgba(245, 158, 11, 0.3)' : 'transparent',
                  color: !isSignUp ? '#f59e0b' : '#94a3b8',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {t('loginWithEmail')}
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setErrorMessage(''); }}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isSignUp ? 'rgba(245, 158, 11, 0.3)' : 'transparent',
                  color: isSignUp ? '#f59e0b' : '#94a3b8',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {t('signupWithEmail')}
              </button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '5px' }}>
                {t('email')}
              </label>
              <input
                type="email"
                required
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 12px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {t('password')} ({t('passwordHint')})
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '12px', cursor: 'pointer' }}
                >
                  {showPassword ? `🙈 ${t('hidePassword')}` : `👁️ ${t('showPassword')}`}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder={t('passwordHint')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 12px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            {isSignUp && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '5px' }}>
                  {t('passwordConfirm')}
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={t('passwordConfirm')}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                padding: '13px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: '700',
                fontSize: '15px',
                cursor: 'pointer',
                marginTop: '4px',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
              }}
            >
              {loading ? '...' : isSignUp ? t('signupWithEmail') : t('loginWithEmail')}
            </button>

            <button
              type="button"
              onClick={() => { setTab('main'); setErrorMessage(''); }}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', marginTop: '2px' }}
            >
              ← {t('backToMain')}
            </button>
          </form>
        )}

        {/* 탭 3: 전화번호(휴대번호) 로그인 */}
        {tab === 'phone' && (
          <form onSubmit={handlePhoneSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', background: 'rgba(56, 189, 248, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              📱 {t('phoneAuthDesc')}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '5px' }}>
                {t('phone')}
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {/* 국가번호 선택 */}
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#f59e0b',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    fontSize: '13px',
                    fontWeight: '700',
                    outline: 'none',
                  }}
                >
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code} style={{ background: '#1e293b', color: '#fff' }}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>

                <input
                  type="tel"
                  required
                  placeholder="010-1234-5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '11px 12px',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '5px' }}>
                {t('password')} ({t('passwordHint')})
              </label>
              <input
                type="password"
                required
                placeholder={t('passwordHint')}
                value={phonePassword}
                onChange={(e) => setPhonePassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 12px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                color: '#ffffff',
                padding: '13px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: '700',
                fontSize: '15px',
                cursor: 'pointer',
                marginTop: '4px',
                boxShadow: '0 4px 14px rgba(56, 189, 248, 0.35)',
              }}
            >
              {loading ? '...' : t('loginWithPhone')}
            </button>

            <button
              type="button"
              onClick={() => { setTab('main'); setErrorMessage(''); }}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', marginTop: '2px' }}
            >
              ← {t('backToMain')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
