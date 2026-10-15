// src/shared/components/SoundToggleButton.tsx
// 상단 가장 왼쪽에 배치되는 작은 사운드 On/Off 아이콘 버튼 (디폴트: 사운드 꺼짐)
import React, { useEffect, useState } from 'react';
import { soundManager } from '../../game/audio/soundManager';

interface SoundToggleButtonProps {
  style?: React.CSSProperties;
  className?: string;
}

export const SoundToggleButton: React.FC<SoundToggleButtonProps> = ({ style, className }) => {
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());

  useEffect(() => {
    // soundManager 상태 변화 구독
    const unsubscribe = soundManager.subscribe((muted) => {
      setIsMuted(muted);
    });
    return () => unsubscribe();
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = soundManager.toggleMute();
    setIsMuted(nextMuted);
  };

  return (
    <button
      onClick={handleToggle}
      className={className}
      style={{
        background: isMuted ? 'rgba(0, 0, 0, 0.45)' : 'rgba(245, 158, 11, 0.25)',
        border: isMuted ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #f59e0b',
        color: isMuted ? '#94a3b8' : '#f59e0b',
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '15px',
        boxShadow: isMuted ? 'none' : '0 0 10px rgba(245, 158, 11, 0.4)',
        transition: 'all 0.15s ease',
        ...style,
      }}
      title={isMuted ? '사운드 켜기 (현재 꺼짐)' : '사운드 끄기 (현재 켜짐)'}
      aria-label={isMuted ? '사운드 켜기' : '사운드 끄기'}
    >
      {isMuted ? '🔇' : '🔊'}
    </button>
  );
};
