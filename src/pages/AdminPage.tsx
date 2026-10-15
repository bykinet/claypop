// src/pages/AdminPage.tsx
// 관리자(Admin) 전용 캐릭터, 배경, 타겟 추가(각 최대 3개) 및 삭제 관리 화면
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { userService } from '../entities/user/userService';
import { customAssetsService, CustomShooter, CustomBackground, CustomTarget } from '../entities/assets/customAssetsService';
import { SoundToggleButton } from '../shared/components/SoundToggleButton';

interface AdminPageProps {
  onBack: () => void;
  onLogout: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onBack, onLogout }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'shooters' | 'backgrounds' | 'targets'>('shooters');
  const user = userService.getCurrentUser();

  // 커스텀 에셋 상태
  const [shooters, setShooters] = useState<CustomShooter[]>([]);
  const [backgrounds, setBackgrounds] = useState<CustomBackground[]>([]);
  const [targets, setTargets] = useState<CustomTarget[]>([]);

  // 캐릭터 폼 상태
  const [shooterName, setShooterName] = useState('');
  const [shooterFile, setShooterFile] = useState('shooter1.png');
  const [shooterDesc, setShooterDesc] = useState('');

  // 배경 폼 상태
  const [bgName, setBgName] = useState('');
  const [bgFile, setBgFile] = useState('bg1.png');
  const [bgTheme, setBgTheme] = useState('사이버 네온');

  // 타겟 폼 상태
  const [targetName, setTargetName] = useState('');
  const [targetScore, setTargetScore] = useState(150);
  const [targetTrajectory, setTargetTrajectory] = useState<'parabola' | 'wavy_copter' | 'boomerang' | 'erratic_star'>('parabola');
  const [targetIcon, setTargetIcon] = useState('/brand/targets/clay.jpg');

  // 메시지 피드백
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  const refreshAssets = () => {
    setShooters([...customAssetsService.getShooters()]);
    setBackgrounds([...customAssetsService.getBackgrounds()]);
    setTargets([...customAssetsService.getTargets()]);
  };

  useEffect(() => {
    refreshAssets();
    const unsub = customAssetsService.subscribe(() => {
      refreshAssets();
    });
    return () => unsub();
  }, []);

  const showMsg = (text: string, isError = false) => {
    setFeedback({ text, isError });
    setTimeout(() => setFeedback(null), 3000);
  };

  // 1. 캐릭터 추가
  const handleAddShooter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shooterName.trim()) {
      showMsg('캐릭터 이름을 입력해 주세요.', true);
      return;
    }
    const res = customAssetsService.addShooter({
      name: shooterName.trim(),
      file: shooterFile,
      altFile: shooterFile,
      desc: shooterDesc.trim() || '관리자 등록 커스텀 슈터',
    });
    if (res.success) {
      showMsg(`캐릭터 '${shooterName}'이(가) 성공적으로 추가되었습니다!`);
      setShooterName('');
      setShooterDesc('');
    } else {
      showMsg(res.message || '추가 실패', true);
    }
  };

  // 2. 배경 추가
  const handleAddBackground = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bgName.trim()) {
      showMsg('배경 이름을 입력해 주세요.', true);
      return;
    }
    const res = customAssetsService.addBackground({
      name: bgName.trim(),
      file: bgFile,
      theme: bgTheme,
      desc: `${bgTheme} 테마 커스텀 경기장`,
    });
    if (res.success) {
      showMsg(`배경 '${bgName}'이(가) 성공적으로 추가되었습니다!`);
      setBgName('');
    } else {
      showMsg(res.message || '추가 실패', true);
    }
  };

  // 3. 타겟 추가
  const handleAddTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetName.trim()) {
      showMsg('타겟 이름을 입력해 주세요.', true);
      return;
    }
    const res = customAssetsService.addTarget({
      name: targetName.trim(),
      icon: targetIcon,
      baseScore: Number(targetScore) || 100,
      trajectory: targetTrajectory,
      projectileColor: '#38bdf8',
      desc: '관리자 등록 스페셜 타겟',
    });
    if (res.success) {
      showMsg(`타겟 '${targetName}'이(가) 성공적으로 추가되었습니다!`);
      setTargetName('');
    } else {
      showMsg(res.message || '추가 실패', true);
    }
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-card"
        style={{
          maxWidth: '680px',
          width: '95%',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid #f59e0b',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.7), 0 0 25px rgba(245, 158, 11, 0.25)',
          padding: '24px',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* 상단 헤더 바 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px' }}>
          {/* 상단 가장 왼쪽 사운드 On/Off 아이콘 버튼 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <SoundToggleButton />
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#f59e0b', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                ⚙️ Admin 관리자 모드
              </h2>
              <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '2px' }}>
                접속 관리자: {user?.email || user?.phoneE164 || 'Admin'}
              </div>
            </div>
          </div>

          {/* 상단 가장 오른쪽: 로그아웃 버튼 & 닫기 버튼 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onLogout}
              style={{
                background: 'rgba(239, 68, 68, 0.18)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              🚪 {t('logout')}
            </button>
            <button
              onClick={onBack}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              ✕ {t('close')}
            </button>
          </div>
        </div>

        {/* 피드백 알림 */}
        {feedback && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: feedback.isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              border: feedback.isError ? '1px solid #ef4444' : '1px solid #10b981',
              color: feedback.isError ? '#fca5a5' : '#6ee7b7',
              fontSize: '13px',
              fontWeight: '600',
              textAlign: 'center',
            }}
          >
            {feedback.text}
          </div>
        )}

        {/* 탭 네비게이션: 캐릭터(3개) / 배경(3개) / 타겟(3개) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('shooters')}
            style={{
              padding: '10px',
              borderRadius: '10px',
              border: activeTab === 'shooters' ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.15)',
              background: activeTab === 'shooters' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(0, 0, 0, 0.3)',
              color: activeTab === 'shooters' ? '#f59e0b' : '#94a3b8',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            🔫 캐릭터 ({shooters.length}/3)
          </button>
          <button
            onClick={() => setActiveTab('backgrounds')}
            style={{
              padding: '10px',
              borderRadius: '10px',
              border: activeTab === 'backgrounds' ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
              background: activeTab === 'backgrounds' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(0, 0, 0, 0.3)',
              color: activeTab === 'backgrounds' ? '#38bdf8' : '#94a3b8',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            🌄 배경 ({backgrounds.length}/3)
          </button>
          <button
            onClick={() => setActiveTab('targets')}
            style={{
              padding: '10px',
              borderRadius: '10px',
              border: activeTab === 'targets' ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.15)',
              background: activeTab === 'targets' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 0, 0, 0.3)',
              color: activeTab === 'targets' ? '#10b981' : '#94a3b8',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            🎯 타겟 ({targets.length}/3)
          </button>
        </div>

        {/* 탭 1: 캐릭터(슈터) 관리 */}
        {activeTab === 'shooters' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <form onSubmit={handleAddShooter} style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#f59e0b' }}>
                ➕ 새로운 캐릭터 추가 (최대 3개)
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  캐릭터 이름
                </label>
                <input
                  type="text"
                  placeholder="예: 사이버 헌터"
                  value={shooterName}
                  onChange={(e) => setShooterName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  슈터 외형 프리셋
                </label>
                <select
                  value={shooterFile}
                  onChange={(e) => setShooterFile(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff' }}
                >
                  <option value="shooter1.png">3D 메카닉 슈터 스타일 (shooter1.png)</option>
                  <option value="shooter2.png">수퍼맨 히어로 스타일 (shooter2.png)</option>
                  <option value="shooter1_clean.png">클린 메카닉 에디션 (shooter1_clean.png)</option>
                  <option value="shooter2_clean.png">클린 수퍼맨 에디션 (shooter2_clean.png)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  설명
                </label>
                <input
                  type="text"
                  placeholder="예: 레이저 빔 특화 미래형 슈터"
                  value={shooterDesc}
                  onChange={(e) => setShooterDesc(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff' }}
                />
              </div>

              <button
                type="submit"
                disabled={shooters.length >= 3}
                style={{
                  background: shooters.length >= 3 ? '#475569' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#fff',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: shooters.length >= 3 ? 'not-allowed' : 'pointer',
                }}
              >
                {shooters.length >= 3 ? '최대 생성 수(3개) 도달' : '+ 캐릭터 생성'}
              </button>
            </form>

            {/* 등록된 커스텀 캐릭터 목록 */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginBottom: '8px' }}>
                등록된 커스텀 캐릭터 ({shooters.length}/3)
              </div>
              {shooters.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '13px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                  아직 추가된 커스텀 캐릭터가 없습니다. 위 폼에서 추가해 보세요.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {shooters.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        borderRadius: '10px',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '22px' }}>🔫</span>
                        <div>
                          <div style={{ fontWeight: '700', color: '#f59e0b' }}>{s.name}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{s.file} | {s.desc}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          customAssetsService.deleteShooter(s.id);
                          showMsg(`'${s.name}' 캐릭터가 삭제되었습니다.`);
                        }}
                        style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 탭 2: 배경 관리 */}
        {activeTab === 'backgrounds' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <form onSubmit={handleAddBackground} style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#38bdf8' }}>
                ➕ 새로운 배경 추가 (최대 3개)
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  배경 이름
                </label>
                <input
                  type="text"
                  placeholder="예: 네온 시티 아레나"
                  value={bgName}
                  onChange={(e) => setBgName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  배경 테마
                </label>
                <input
                  type="text"
                  placeholder="예: 사이버 네온"
                  value={bgTheme}
                  onChange={(e) => setBgTheme(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  배경 이미지 선택
                </label>
                <select
                  value={bgFile}
                  onChange={(e) => setBgFile(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff' }}
                >
                  <option value="bg1.png">클래식 사격장 (bg1.png)</option>
                  <option value="bg2.png">초원 농장 (bg2.png)</option>
                  <option value="bg3.png">우주 은하수 (bg3.png)</option>
                  <option value="bg4.png">미래 사이버 도시 (bg4.png)</option>
                  <option value="bg5.png">네온 테마파크 (bg5.png)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={backgrounds.length >= 3}
                style={{
                  background: backgrounds.length >= 3 ? '#475569' : 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                  color: '#fff',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: backgrounds.length >= 3 ? 'not-allowed' : 'pointer',
                }}
              >
                {backgrounds.length >= 3 ? '최대 생성 수(3개) 도달' : '+ 배경 생성'}
              </button>
            </form>

            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginBottom: '8px' }}>
                등록된 커스텀 배경 ({backgrounds.length}/3)
              </div>
              {backgrounds.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '13px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                  아직 추가된 커스텀 배경이 없습니다.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {backgrounds.map((b) => (
                    <div
                      key={b.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        borderRadius: '10px',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '22px' }}>🌄</span>
                        <div>
                          <div style={{ fontWeight: '700', color: '#38bdf8' }}>{b.name}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{b.file} | {b.theme}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          customAssetsService.deleteBackground(b.id);
                          showMsg(`'${b.name}' 배경이 삭제되었습니다.`);
                        }}
                        style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 탭 3: 타겟 관리 */}
        {activeTab === 'targets' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <form onSubmit={handleAddTarget} style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#10b981' }}>
                ➕ 새로운 타겟 추가 (최대 3개)
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  타겟 이름
                </label>
                <input
                  type="text"
                  placeholder="예: 골든 플라잉 젬"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    비행 패턴
                  </label>
                  <select
                    value={targetTrajectory}
                    onChange={(e: any) => setTargetTrajectory(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff' }}
                  >
                    <option value="parabola">포물선 비행 (Parabola)</option>
                    <option value="wavy_copter">웨이브 콥터 (Wavy)</option>
                    <option value="boomerang">부메랑 곡선 (Boomerang)</option>
                    <option value="erratic_star">지그재그 UFO (Erratic)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    기본 득점
                  </label>
                  <input
                    type="number"
                    value={targetScore}
                    onChange={(e) => setTargetScore(Number(e.target.value))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  타겟 외형 아이콘
                </label>
                <select
                  value={targetIcon}
                  onChange={(e) => setTargetIcon(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff' }}
                >
                  <option value="/brand/targets/clay.jpg">원반 타겟 (clay.jpg)</option>
                  <option value="/brand/targets/copter.jpg">헬리콥터 (copter.jpg)</option>
                  <option value="/brand/targets/boom.jpg">부메랑 (boom.jpg)</option>
                  <option value="/brand/targets/ufo.jpg">UFO 별 (ufo.jpg)</option>
                  <option value="/brand/targets/chick.jpg">치킨 (chick.jpg)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={targets.length >= 3}
                style={{
                  background: targets.length >= 3 ? '#475569' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: targets.length >= 3 ? 'not-allowed' : 'pointer',
                }}
              >
                {targets.length >= 3 ? '최대 생성 수(3개) 도달' : '+ 타겟 생성'}
              </button>
            </form>

            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginBottom: '8px' }}>
                등록된 커스텀 타겟 ({targets.length}/3)
              </div>
              {targets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '13px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                  아직 추가된 커스텀 타겟이 없습니다.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {targets.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        borderRadius: '10px',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '22px' }}>🎯</span>
                        <div>
                          <div style={{ fontWeight: '700', color: '#10b981' }}>{t.name} ({t.baseScore}점)</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>패턴: {t.trajectory}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          customAssetsService.deleteTarget(t.id);
                          showMsg(`'${t.name}' 타겟이 삭제되었습니다.`);
                        }}
                        style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
