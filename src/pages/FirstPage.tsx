// src/pages/FirstPage.tsx
// 첫 화면: 게스트, Google, 이메일, 전화번호 로그인 및 언어 토글
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toggleLocale } from '../shared/i18n';
import { userService } from '../entities/user/userService';
import { UserProfile } from '../shared/firebase/firebase';

interface FirstPageProps {
  onSuccess: (user: UserProfile) => void;
}

export const FirstPage: React.FC<FirstPageProps> = ({ onSuccess }) => {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<'main' | 'email' | 'phone'>('main');
  const [isSignUp, setIsSignUp] = useState(false);

  // 이메일 폼 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 전화번호 폼 상태
  const [phone, setPhone] = useState('');
  const [phonePassword, setPhonePassword] = useState('');

  // 오류 메시지
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // 언어 토글 핸들러
  const handleToggleLang = () => {
    toggleLocale();
  };

  // 국가 코드 및 플레이스홀더 계산
  const getPhoneConfig = () => {
    const lang = i18n.language;
    if (lang === 'ja') {
      return { country: '+81', placeholder: '090-1234-5678' };
    }
    if (lang === 'en') {
      return { country: '+1', placeholder: '10-1234-5678' };
    }
    return { country: '+82', placeholder: '10-1234-5678' };
  };

  const phoneConfig = getPhoneConfig();

  // 게스트 로그인
  const handleGuest = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const user = await userService.loginAsGuest();
      onSuccess(user);
    } catch {
      setErrorMessage(t('loginFailedEmail'));
    } finally {
      setLoading(false);
    }
  };

  // Google 로그인
  const handleGoogle = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const user = await userService.loginWithGoogle();
      onSuccess(user);
    } catch {
      setErrorMessage(t('loginFailedEmail'));
    } finally {
      setLoading(false);
    }
  };

  // 이메일 로그인 / 가입 제출
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage(t('emailEmpty'));
      return;
    }

    // 비밀번호 형식: 6~20자의 영문과 숫자
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
    } catch {
      setErrorMessage(t('loginFailedEmail'));
    } finally {
      setLoading(false);
    }
  };

  // 전화번호 로그인 제출
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!phone.trim()) {
      setErrorMessage(t('loginFailedPhone'));
      return;
    }

    const passRegex = /^[a-zA-Z0-9]{6,20}$/;
    if (!passRegex.test(phonePassword)) {
      setErrorMessage(t('passwordInvalid'));
      return;
    }

    setLoading(true);
    const fullPhone = `${phoneConfig.country}${phone.trim().replace(/^0+/, '')}`;
    try {
      const user = await userService.loginWithPhone(fullPhone, phonePassword);
      onSuccess(user);
    } catch {
      setErrorMessage(t('loginFailedPhone'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        {/* 상단 헤더: 타이틀 및 언어 토글 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#f59e0b', letterSpacing: '0.5px' }}>
              {t('gameTitle')}
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
              {t('introHint')}
            </p>
          </div>
          <button
            onClick={handleToggleLang}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#f8fafc',
              padding: '6px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
            }}
          >
            {i18n.language.toUpperCase()}
          </button>
        </div>

        {errorMessage && (
          <div
            style={{
              background: 'rgba(255, 45, 85, 0.15)',
              border: '1px solid #ff2d55',
              color: '#ff2d55',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              textAlign: 'center',
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* 탭: 기본(Main) */}
        {tab === 'main' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={handleGuest}
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                padding: '14px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: '700',
                fontSize: '16px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
              }}
            >
              {t('guest')}
            </button>

            <button
              onClick={handleGoogle}
              disabled={loading}
              style={{
                background: '#ffffff',
                color: '#1e293b',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
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

            <button
              onClick={() => { setTab('email'); setIsSignUp(false); setErrorMessage(''); }}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#f8fafc',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              {t('loginWithEmail')}
            </button>

            <button
              onClick={() => { setTab('phone'); setErrorMessage(''); }}
              style={{
                background: 'transparent',
                color: '#94a3b8',
                padding: '8px',
                border: 'none',
                fontWeight: '500',
                fontSize: '13px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {t('loginWithPhone')}
            </button>
          </div>
        )}

        {/* 탭: 이메일 로그인 / 회원가입 */}
        {tab === 'email' && (
          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                {t('email')}
              </label>
              <input
                type="email"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  fontSize: '14px',
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>{t('password')}</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '11px', cursor: 'pointer' }}
                >
                  {showPassword ? t('hidePassword') : t('showPassword')}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={t('passwordHint')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  fontSize: '14px',
                }}
              />
            </div>

            {isSignUp && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  {t('passwordConfirm')}
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    fontSize: '14px',
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
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '700',
                fontSize: '15px',
                cursor: 'pointer',
                marginTop: '6px',
              }}
            >
              {isSignUp ? t('signupWithEmail') : t('loginWithEmail')}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setErrorMessage(''); }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '12px', cursor: 'pointer' }}
              >
                {isSignUp ? t('switchLogin') : t('switchSignup')}
              </button>
              <button
                type="button"
                onClick={() => { setTab('main'); setErrorMessage(''); }}
                style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '12px', cursor: 'pointer' }}
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        )}

        {/* 탭: 전화번호 로그인 */}
        {tab === 'phone' && (
          <form onSubmit={handlePhoneSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                {t('phone')} ({phoneConfig.country})
              </label>
              <input
                type="tel"
                placeholder={phoneConfig.placeholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  fontSize: '14px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                {t('password')}
              </label>
              <input
                type="password"
                placeholder={t('passwordHint')}
                value={phonePassword}
                onChange={(e) => setPhonePassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  fontSize: '14px',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '700',
                fontSize: '15px',
                cursor: 'pointer',
                marginTop: '6px',
              }}
            >
              {t('loginWithPhone')}
            </button>

            <button
              type="button"
              onClick={() => { setTab('main'); setErrorMessage(''); }}
              style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '12px', cursor: 'pointer', textAlign: 'center' }}
            >
              {t('cancel')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
