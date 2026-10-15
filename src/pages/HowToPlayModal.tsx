// src/pages/HowToPlayModal.tsx
// 게임 사용방법 & 조작 가이드 모달 (한국어 -> 영어 -> 일본어 실시간 다국어 지원)
import React from 'react';
import { useTranslation } from 'react-i18next';
import { toggleLocale, getCurrentLocaleLabel } from '../shared/i18n';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  const { t, i18n } = useTranslation();

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-card"
        style={{
          background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '540px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(245, 158, 11, 0.2)',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        {/* 상단 헤더: 타이틀, 언어 토글, 닫기 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>📖</span>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#f59e0b', margin: 0 }}>
              {t('howToPlayTitle')}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* 언어 토글 버튼 (KO -> EN -> JA -> KO 순서) */}
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
                transition: 'all 0.15s ease',
              }}
              title="언어 전환 (KO -> EN -> JA)"
            >
              🌐 {getCurrentLocaleLabel(i18n.language)}
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#94a3b8',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 1. 조작 가이드 섹션 */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#38bdf8', marginBottom: '8px' }}>
            {t('controlsTitle')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5' }}>
            <div>{t('desktopControls')}</div>
            <div>{t('mobileControls')}</div>
          </div>
        </div>

        {/* 2. 타깃 및 게임 규칙 섹션 */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#f59e0b', marginBottom: '10px' }}>
            {t('rulesTitle')}
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#e2e8f0', lineHeight: '1.5' }}>
            <li>{t('ruleLeadShot')}</li>
            <li>{t('ruleCombo')}</li>
            <li>{t('ruleEcho')}</li>
            <li style={{ color: '#f87171', fontWeight: '600' }}>{t('ruleChick')}</li>
            <li>{t('ruleWinCondition')}</li>
          </ul>
        </div>

        {/* 3. 타깃 아이콘 가이드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', textAlign: 'center' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '8px 4px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '20px' }}>🟡</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Clay</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '8px 4px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '20px' }}>🚁</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Copter</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '8px 4px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '20px' }}>🪃</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Boomerang</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '8px 4px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '20px' }}>🛸</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>UFO</div>
          </div>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '8px 4px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div style={{ fontSize: '20px' }}>🐥</div>
            <div style={{ fontSize: '11px', color: '#f87171', marginTop: '2px' }}>No Hit!</div>
          </div>
        </div>

        {/* 확인 / 닫기 버튼 */}
        <button
          onClick={onClose}
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#ffffff',
            padding: '12px',
            borderRadius: '10px',
            border: 'none',
            fontWeight: '700',
            fontSize: '15px',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
            marginTop: '4px',
          }}
        >
          {t('gotIt')}
        </button>
      </div>
    </div>
  );
};
