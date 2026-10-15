// src/pages/NicknamePage.tsx
// 닉네임 설정 화면 (2~12자, Enter로 제출)
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { userService } from '../entities/user/userService';

interface NicknamePageProps {
  onSuccess: () => void;
}

export const NicknamePage: React.FC<NicknamePageProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
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
    <div className="modal-overlay">
      <div className="modal-card">
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#f59e0b' }}>
          {t('nicknameTitle')}
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>
          {t('enterToSubmit')}
        </p>

        {error && (
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
            {error}
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
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              fontSize: '16px',
            }}
          />

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
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
            }}
          >
            {t('save')}
          </button>
        </form>
      </div>
    </div>
  );
};
