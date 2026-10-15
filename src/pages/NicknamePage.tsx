// src/pages/NicknamePage.tsx
// 닉네임 설정 화면 (2~12자, Enter로 제출, 실시간 언어 토글 지원)
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toggleLocale, getCurrentLocaleLabel } from '../shared/i18n';
import { userService } from '../entities/user/userService';

interface NicknamePageProps {
  onSuccess: () => void;
}

export const NicknamePage: React.FC<NicknamePageProps> = ({ onSuccess }) => {
  const { t, i18n } = useTranslation();
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 12) {
      setError(t('nicknameLengthError'));
      return;
    }

    setLoading(true);
    setError('');
    try {
      await userService.setNickname(trimmed);
      onSuccess();
    } catch {
      setError(t('nicknameLengthError'));
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
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.7), 0 0 30px rgba(245, 158, 11, 0.25)',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#f59e0b', margin: 0 }}>
              🏷️ {t('nicknameTitle')}
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
              {t('enterToSubmit')}
            </p>
          </div>

          <button
            onClick={() => toggleLocale()}
            style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid #f59e0b',
              color: '#f59e0b',
              padding: '5px 10px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="언어 전환 (KO -> EN -> JA)"
          >
            🌐 {getCurrentLocaleLabel(i18n.language)}
          </button>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              color: '#fca5a5',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              textAlign: 'center',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input
            type="text"
            autoFocus
            maxLength={12}
            placeholder={t('nicknamePlaceholder')}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              fontSize: '16px',
              outline: 'none',
            }}
          />

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
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
            }}
          >
            {loading ? '...' : t('save')}
          </button>
        </form>
      </div>
    </div>
  );
};
