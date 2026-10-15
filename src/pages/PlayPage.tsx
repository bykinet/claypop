// src/pages/PlayPage.tsx
// Three.js 기반 3D 슈터 캐릭터 및 1인칭 조준 플레이 컴포넌트
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useTranslation } from 'react-i18next';
import { GameConfig } from '../app/types';
import {
  createSimState,
  queueShot,
  stepSimulation,
} from '../game/sim/simulate';
import { SimState } from '../game/sim/types';
import { getTargetPosition } from '../game/sim/trajectories';
import {
  createGameScene,
  createTargetMesh,
  SceneContext,
  spawnProjectile,
  spawnShatterParticles,
  updateCameraFOV,
  updateParticles,
  updateProjectiles,
  animateShooterEnding,
  getShooterPoseTexture,
  getShooterAimPoseKeyFromNorm,
  preloadShooterPoses,
} from '../game/view/createScene';
import { getTargetDefinition } from '../game/targets/catalog';
import { soundManager } from '../game/audio/soundManager';
import { toggleLocale } from '../shared/i18n';

interface PlayPageProps {
  config: GameConfig;
  onFinishGame: (finalSim: SimState, stillCanvasUrl?: string) => void;
  onGoMyPage: () => void;
}

export const PlayPage: React.FC<PlayPageProps> = ({
  config,
  onFinishGame,
  onGoMyPage,
}) => {
  const { t, i18n } = useTranslation();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const endingVideoRef = useRef<HTMLVideoElement | null>(null);

  // 시뮬레이션 상태 Ref
  const simStateRef = useRef<SimState>(
    createSimState(config.duration, config.difficulty, config.selectedTargets)
  );

  // Three.js 씬 컨텍스트 Ref
  const sceneCtxRef = useRef<SceneContext | null>(null);

  // 표적 3D 메쉬 매핑 Ref
  const targetMeshMapRef = useRef<Map<number, THREE.Object3D>>(new Map());

  // 뷰포트 레이아웃 상태 ('desktop' | 'mobile_landscape' | 'mobile_portrait')
  const [layoutMode, setLayoutMode] = useState<'desktop' | 'mobile_landscape' | 'mobile_portrait'>('desktop');

  // HUD 표시 상태
  const [hudState, setHudState] = useState({
    timeLeft: config.duration,
    missesLeft: config.difficulty === 'easy' ? 7 : config.difficulty === 'normal' ? 5 : 4,
    score: 0,
    combo: 0,
    isMuted: soundManager.getMuted(),
    isClimax: false,
  });

  // 조준환 화면 좌표 (px)
  const [reticlePos, setReticlePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const reticleRef = useRef<HTMLDivElement | null>(null);
  const setIsFiringVisual_state = useState(false);
  const isFiringVisual = setIsFiringVisual_state[0];
  const setIsFiringVisual = setIsFiringVisual_state[1];

  // 발사 간격 제어 (280ms 쿨다운)
  const lastFireTimeRef = useRef<number>(0);

  // 포인터 조준 월드 좌표 Ref (Z=40 평면 상의 X, Y)
  const aimWorldPosRef = useRef<{ x: number; y: number }>({ x: 50, y: 20 });

  // 마우스/터치 정규화 뷰포트 조준 좌표 Ref (normX: -1~+1, normY: 0~1)
  const aimNormRef = useRef<{ normX: number; normY: number }>({ normX: 0, normY: 0.35 });

  // 모바일 오른쪽 검지 손가락 조준 터치 ID 추적 Ref
  const aimTouchIdRef = useRef<number | null>(null);

  // 선행점 가이드 표시 여부
  const leadShownRef = useRef<boolean>(Boolean(localStorage.getItem('claypop.leadShown')));

  // 엔딩 연출 상태 (3.0초)
  const endingStartTimeRef = useRef<number>(0);
  const [endingMode, setEndingMode] = useState<'none' | 'success' | 'failure'>('none');
  const [isStill, setIsStill] = useState<boolean>(false);

  // 게임 화면 일시 정지(Pause) 상태 (디자인 확인/수정용 순간 정지)
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const isPausedRef = useRef<boolean>(false);

  // 이전 사운드 트리거 시각 추적
  const lastEchoPulseTimeRef = useRef<number>(0);
  const echoBannerShownRef = useRef<boolean>(false);

  /**
   * 뷰포트 크기 및 카메라 갱신 함수
   */
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = sceneCtxRef.current;
    if (!canvas || !container || !ctx) return;

    const w = container.clientWidth;
    const h = container.clientHeight;

    const isMobileUA = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isMobile = window.innerWidth <= 840 || (isMobileUA && 'ontouchstart' in window);
    const isPortrait = window.innerHeight > window.innerWidth;

    if (!isMobile) {
      setLayoutMode('desktop');
    } else if (isPortrait) {
      setLayoutMode('mobile_portrait');
    } else {
      setLayoutMode('mobile_landscape');
    }

    canvas.width = w;
    canvas.height = h;
    ctx.renderer.setSize(w, h, false);

    updateCameraFOV(ctx.baseCamera, w, h);
    ctx.renderCamera.copy(ctx.baseCamera);
  }, []);

  /**
   * 화면 픽셀 좌표를 Z=40 평면의 월드 (x, y)로 역투영 (흔들림 없는 baseCamera 사용)
   */
  const screenToWorldZ40 = useCallback((screenX: number, screenY: number): { x: number; y: number } => {
    const ctx = sceneCtxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return { x: 50, y: 20 };

    const rect = canvas.getBoundingClientRect();
    const ndcX = ((screenX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -(((screenY - rect.top) / rect.height) * 2 - 1);

    ctx.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), ctx.baseCamera);
    const targetPoint = new THREE.Vector3();
    const hit = ctx.raycaster.ray.intersectPlane(ctx.planeZ40, targetPoint);

    if (hit) {
      return { x: hit.x, y: hit.y };
    }
    return { x: 50, y: 20 };
  }, []);

  /**
   * 포인터(마우스 클릭/드래그 및 이동)에 따른 '+' 타겟포인터 및 3D 슈터 총구 방향 즉각 갱신
   */
  const updateAimFromPointer = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    // 캔버스 내 상대 픽셀 좌표
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;

    // 조준점 X, Y: 캔버스 여백 내로 정밀 클램핑
    const targetScreenX = Math.max(15, Math.min(rect.width - 15, localX));
    const targetScreenY = Math.max(15, Math.min(rect.height - 25, localY));

    // 정규화된 뷰포트 조준 좌표 계산 (normX: -1.0 좌측 ~ +1.0 우측, normY: 0.0 하단 지평선 ~ 1.0 상단 상공)
    const normX = Math.max(-1, Math.min(1, (targetScreenX - rect.width / 2) / (rect.width / 2)));
    const normY = Math.max(0, Math.min(1, 1.0 - (targetScreenY / rect.height)));
    aimNormRef.current = { normX, normY };

    // 1. 직접 DOM 갱신 (지연 없는 144Hz 초고속 즉시 이동)
    if (reticleRef.current) {
      reticleRef.current.style.left = `${targetScreenX}px`;
      reticleRef.current.style.top = `${targetScreenY}px`;
    }

    // 2. React 상태 동기화
    setReticlePos({ x: targetScreenX, y: targetScreenY });

    // 3. Three.js 3D 월드 타겟 좌표 갱신 (Z=40 표적 평면)
    aimWorldPosRef.current = screenToWorldZ40(targetScreenX + rect.left, targetScreenY + rect.top);
  }, [screenToWorldZ40]);

  /**
   * 발사 요청 함수 (280ms 쿨다운)
   */
  const triggerFire = useCallback(() => {
    const sim = simStateRef.current;
    if (sim.outcome !== 'in_progress' || sim.devPaused || isPausedRef.current || endingMode !== 'none') return;

    const now = performance.now();
    if (now - lastFireTimeRef.current < 280) {
      return;
    }
    lastFireTimeRef.current = now;

    const primaryTargetType = config.selectedTargets && config.selectedTargets.length > 0 ? config.selectedTargets[0] : 'clay';
    const targetDef = getTargetDefinition(primaryTargetType);

    soundManager.playFire(targetDef.projectile);
    setIsFiringVisual(true);
    setTimeout(() => setIsFiringVisual(false), 80);

    // 3D 탄환(2배 확대 발사체) 비행 연출
    if (sceneCtxRef.current) {
      spawnProjectile(
        sceneCtxRef.current,
        aimWorldPosRef.current.x,
        aimWorldPosRef.current.y,
        targetDef.projectile,
        targetDef.projectileColor
      );
    }

    // 첫 발사 시 선행점 숨김 및 저장
    if (!leadShownRef.current) {
      leadShownRef.current = true;
      localStorage.setItem('claypop.leadShown', 'true');
      if (sceneCtxRef.current) {
        sceneCtxRef.current.leadDotMesh.visible = false;
      }
    }

    // 시뮬레이션에 발사 큐잉
    queueShot(sim, sim.elapsed, aimWorldPosRef.current.x, aimWorldPosRef.current.y);
  }, [endingMode, isPaused, config.selectedTargets]);

  // Three.js 씬 초기화 및 메인 단일 requestAnimationFrame 루프
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. 슈터 1, 2 조준 포즈 텍스처 사전 로딩 및 캐싱
    preloadShooterPoses('shooter1');
    preloadShooterPoses('shooter2');

    // Three.js 씬 생성 (테마별 배경 및 순수 3D 슈터 캐릭터 릭 연동)
    const primaryTheme = config.selectedTargets && config.selectedTargets.length > 0 ? config.selectedTargets[0] : 'clay';
    const ctx = createGameScene(canvas, primaryTheme, config.selectedShooter || 'shooter1');
    sceneCtxRef.current = ctx;

    handleResize();

    // 초기 조준점 중앙 배치
    const initX = canvas.clientWidth / 2;
    const initY = canvas.clientHeight * 0.38;
    setReticlePos({ x: initX, y: initY });
    aimWorldPosRef.current = screenToWorldZ40(initX, initY);
    aimNormRef.current = { normX: 0, normY: 1.0 - (initY / canvas.clientHeight) };

    let lastTime = performance.now();
    let animationFrameId: number;

    // 단일 프레임 루프
    const frameLoop = (timeNow: number) => {
      const dtMs = Math.min(timeNow - lastTime, 100);
      lastTime = timeNow;
      const dt = dtMs / 1000;

      const sim = simStateRef.current;
      const sceneCtx = sceneCtxRef.current;

      if (sceneCtx && sim) {
        // 엔딩 중이 아니면 시뮬레이션 갱신 (화면 정지 시 모든 물리 및 3D 비행 동작 완전 동결)
        if (sim.outcome === 'in_progress' && !sim.devPaused && !isPausedRef.current) {
          stepSimulation(sim, dt);

          // 메아리 클라이맥스 연출
          const local = sim.elapsed % 30;
          if (local >= 23.0 && local < 28.0) {
            if (!echoBannerShownRef.current) {
              echoBannerShownRef.current = true;
              soundManager.playEchoStart();
            }
            if (sim.elapsed - lastEchoPulseTimeRef.current >= 0.45) {
              lastEchoPulseTimeRef.current = sim.elapsed;
              soundManager.playEchoPulse();
            }
          } else if (local >= 28.0 && echoBannerShownRef.current) {
            echoBannerShownRef.current = false;
            soundManager.playEchoEnd();
          }

          // 명중 사운드 및 3D 파편 파티클 처리 (타겟 종류별 고유 격렬 파괴 연출)
          for (const hit of sim.recentHits) {
            soundManager.playHit(hit.targetType);
            soundManager.playComboStep(hit.combo);
            spawnShatterParticles(sceneCtx, hit.hitX, hit.hitY, hit.targetType);
            const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (!reducedMotion) {
              sceneCtx.shakeTime = 0.08;
            }
          }

          // 놓친 표적이 있을 때 리트리버 이동 및 사운드
          const newlyMissed = sim.targets.filter((t) => t.missed && t.hitTime === undefined);
          if (newlyMissed.length > 0) {
            soundManager.playMiss();
            sceneCtx.retrieverTargetX = newlyMissed[newlyMissed.length - 1].startX;
          }

          // 리트리버 부드러운 이동 (lerp)
          sceneCtx.retriever.position.x += (sceneCtx.retrieverTargetX - sceneCtx.retriever.position.x) * 4 * dt;

          // [명세]: 참조 이미지(shooter1_aiming_movement.png, shooter2_aiming_movement.png) 기반
          // 마우스 및 모바일 검지 터치 조준에 따라 슈터가 물리적으로 좌우 이동하며,
          // 조준 각도(0°~60°, 하늘 90°) 및 방향(좌/우)에 맞춰 슈터 포즈가 즉각 동적으로 전환된다.
          const { normX, normY } = aimNormRef.current;

          // 1. 캐릭터 물리적 X 좌표 좌우 이동 (부드러운 lerp)
          // Three.js 카메라(+Z 시선) 상에서 화면 우측(normX > 0)은 월드 좌표계 X 감소 방향
          const targetShooterX = 50 - normX * 12.0;
          sceneCtx.launcherGroup.position.x += (targetShooterX - sceneCtx.launcherGroup.position.x) * 20 * dt;

          // 2. 조준 방향 벡터 계산 및 스프라이트 포즈 텍스처 즉각 동적 스왑
          const currentShooter = config.selectedShooter || 'shooter1';
          const poseKey = getShooterAimPoseKeyFromNorm(currentShooter, normX, normY);

          const charMesh = sceneCtx.launcherGroup.getObjectByName('character_mesh') as THREE.Mesh | undefined;
          if (charMesh && charMesh.material) {
            const poseTex = getShooterPoseTexture(currentShooter, poseKey);
            const mat = charMesh.material as THREE.MeshBasicMaterial;
            if (mat.map !== poseTex) {
              mat.map = poseTex;
              mat.needsUpdate = true;
            }
          }

          // 3. 미세한 3D 입체 원근 Y축 회전 (원근감 강화)
          const targetRotY = normX * 0.18;
          sceneCtx.launcherGroup.rotation.y += (targetRotY - sceneCtx.launcherGroup.rotation.y) * 16 * dt;
          sceneCtx.launcherGroup.rotation.z = 0;
          sceneCtx.launcherGroup.rotation.x = 0;

          // 4. 발사 반동(Kickback) 및 기본 자세 복귀 연출 (지면 Y=0.6, Z=14.0)
          if (isFiringVisual) {
            sceneCtx.launcherGroup.position.z = 13.4;
            sceneCtx.launcherGroup.position.y = 0.3;
          } else if (endingMode === 'none') {
            sceneCtx.launcherGroup.position.z += (14.0 - sceneCtx.launcherGroup.position.z) * 16 * dt;
            sceneCtx.launcherGroup.position.y += (0.6 - sceneCtx.launcherGroup.position.y) * 16 * dt;
          }
          sceneCtx.launcherGroup.visible = true;

          // 선행점 업데이트 (첫 표적 전용)
          if (!leadShownRef.current && sim.targets.length > 0) {
            const firstT = sim.targets[0];
            if (!firstT.hit && !firstT.missed) {
              const futurePos = getTargetPosition(firstT, sim.elapsed + 0.12);
              sceneCtx.leadDotMesh.visible = true;
              sceneCtx.leadDotMesh.position.set(futurePos.x, futurePos.y, 40);
            } else {
              sceneCtx.leadDotMesh.visible = false;
            }
          }

          // 3D 표적 메쉬 동기화
          const currentMeshMap = targetMeshMapRef.current;
          for (const t of sim.targets) {
            let mesh = currentMeshMap.get(t.id);
            if (!mesh) {
              mesh = createTargetMesh(t.type);
              currentMeshMap.set(t.id, mesh);
              sceneCtx.targetsGroup.add(mesh);
            }

            if (t.hit || t.missed) {
              mesh.visible = false;
            } else {
              mesh.visible = true;
              const pos = getTargetPosition(t, sim.elapsed);
              mesh.position.set(pos.x, pos.y, 40);

              if (t.type === 'ufo') {
                mesh.rotation.y += 6 * dt;
                mesh.position.y += Math.sin(sim.elapsed * 8) * 0.25;
              } else if (t.type === 'boom') {
                mesh.rotation.z += 18 * dt;
              } else if (t.type === 'clay' || t.type === 'echo') {
                mesh.rotation.z += 12 * dt;
              } else if (t.type === 'copter') {
                const wing = mesh.getObjectByName('wing');
                const wing2 = mesh.getObjectByName('wing2');
                if (wing) wing.rotation.y += 35 * dt;
                if (wing2) wing2.rotation.y += 35 * dt;
              } else if (t.type === 'chick') {
                mesh.rotation.z = Math.sin(sim.elapsed * 12) * 0.15;
                mesh.position.y += Math.sin(sim.elapsed * 14) * 0.35;
              }
            }
          }

          // 파티클 및 2배 확대 탄환 업데이트
          updateParticles(sceneCtx, dt);
          updateProjectiles(sceneCtx, dt);

          // HUD 상태 갱신
          setHudState({
            timeLeft: Math.max(0, Math.ceil(sim.duration - sim.elapsed)),
            missesLeft: Math.max(0, sim.missLimit - sim.misses),
            score: sim.score,
            combo: sim.combo,
            isMuted: soundManager.getMuted(),
            isClimax: local >= 23.0 && local < 28.0,
          });

          // 노을 하늘색 전환 (배경 텍스처가 없을 때만 하늘색으로 폴백 적용)
          const isClimax = local >= 23.0 && local < 28.0;
          const targetSky = isClimax ? new THREE.Color(0xd97757) : new THREE.Color(0x78a4c8);
          sceneCtx.skyColorCurrent.lerp(targetSky, isClimax ? 4 * dt : 1.5 * dt);
          if (!sceneCtx.scene.background || !(sceneCtx.scene.background instanceof THREE.Texture)) {
            sceneCtx.scene.background = sceneCtx.skyColorCurrent;
          }

          // 게임 종료(성공/실패) 판정 감지
          const out = sim.outcome as string;
          if (out === 'success' || out === 'failure') {
            soundManager.stopBGM();
            setEndingMode(out as 'success' | 'failure');
            endingStartTimeRef.current = performance.now();

            if (out === 'success') {
              soundManager.playSuccessEnding();
            } else {
              soundManager.playFailureEnding();
            }
          }
        }

        // [명세]: 엔딩 3초 동영상 애니메이션 연출 후 정지 화면으로 고정
        if (endingMode !== 'none') {
          const endingElapsed = (performance.now() - endingStartTimeRef.current) / 1000;
          animateShooterEnding(sceneCtx.launcherGroup, endingMode, endingElapsed);

          // 엔딩 비디오가 재생 중이면 3.0초에서 정지
          if (endingVideoRef.current && endingVideoRef.current.currentTime >= 3.0) {
            endingVideoRef.current.pause();
          }

          if (endingElapsed >= 3.0 && !isStill) {
            setIsStill(true);
          }
        }

        // 카메라 흔들림 렌더링 적용 (화면 정지 중에는 흔들림 정지하여 디자인 확인 용이)
        sceneCtx.renderCamera.copy(sceneCtx.baseCamera);
        if (!isPausedRef.current && !sim.devPaused && sceneCtx.shakeTime > 0) {
          sceneCtx.shakeTime -= dt;
          const shakeMag = 0.6 * (sceneCtx.shakeTime / 0.08);
          sceneCtx.renderCamera.position.x += (Math.random() - 0.5) * shakeMag;
          sceneCtx.renderCamera.position.y += (Math.random() - 0.5) * shakeMag;
        }

        // 엔딩 실패 시 리트리버 달리기
        if (endingMode === 'failure' && !isStill) {
          sceneCtx.retriever.position.z += 8 * dt;
        }

        // Three.js 최종 렌더링
        sceneCtx.renderer.render(sceneCtx.scene, sceneCtx.renderCamera);
      }

      animationFrameId = requestAnimationFrame(frameLoop);
    };

    animationFrameId = requestAnimationFrame(frameLoop);

    const remeasureDelays = [0, 60, 150, 300, 500];
    const timers = remeasureDelays.map((ms) => setTimeout(handleResize, ms));

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    const onOrientationChange = () => {
      aimTouchIdRef.current = null;
      handleResize();
      timers.forEach(clearTimeout);
      remeasureDelays.map((ms) => setTimeout(handleResize, ms));
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', onOrientationChange);

    return () => {
      cancelAnimationFrame(animationFrameId);
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', onOrientationChange);
      resizeObserver.disconnect();
      ctx.dispose();
    };
  }, [handleResize, screenToWorldZ40, endingMode, isStill, config.selectedShooter, config.selectedTargets]);

  // 마우스 및 모바일 멀티터치 입력 전역 리스너 등록
  // 데스크톱: 마우스 이동 시 실시간 조준 및 포즈 연동, 클릭/Space로 발사
  // 모바일: 오른쪽 검지 손가락 터치 이동으로 조준, 왼쪽 엄지 발사 버튼으로 슈팅
  useEffect(() => {
    // 1. 데스크톱 마우스/포인터 이동 (마우스 이동 시 1:1 즉각 조준 및 슈터 포즈 갱신)
    const onMouseMove = (e: MouseEvent | PointerEvent) => {
      if ('pointerType' in e && e.pointerType === 'touch') return; // 모바일 터치는 touchmove에서 독립 처리
      if (endingMode !== 'none' || isPausedRef.current) return;
      updateAimFromPointer(e.clientX, e.clientY);
    };

    // 데스크톱 마우스 클릭 (게임 영역 클릭 시 즉각 발사 및 네이티브 드래그 차단)
    const onMouseDown = (e: MouseEvent | PointerEvent) => {
      if ('pointerType' in e && e.pointerType === 'touch') return;
      if (endingMode !== 'none' || isPausedRef.current) return;
      const target = e.target as HTMLElement | null;
      if (target && target.closest('button, .hud-container, .dev-btn-row')) {
        return;
      }
      if (e.button === 0) {
        e.preventDefault();
        updateAimFromPointer(e.clientX, e.clientY);
        triggerFire();
      }
    };

    // 2. 모바일 멀티터치: 오른쪽 검지 손가락으로 조준, 왼쪽 엄지 발사 버튼과 완전 독립 분리
    const onTouchStart = (e: TouchEvent) => {
      if (endingMode !== 'none' || isPausedRef.current) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        // 발사 버튼이나 HUD 컨트롤 클릭은 조준에서 제외 (왼손 엄지 전용)
        if (target && target.closest('button, .mobile-landscape-fire-btn, .mobile-portrait-fire-btn, .hud-container, .dev-btn-row')) {
          continue;
        }
        // 조준 터치로 등록 (오른쪽 검지 손가락)
        aimTouchIdRef.current = touch.identifier;
        updateAimFromPointer(touch.clientX, touch.clientY);
        break;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (endingMode !== 'none' || isPausedRef.current) return;
      let targetTouch: Touch | null = null;
      // 등록된 조준 터치 ID 검색
      if (aimTouchIdRef.current !== null) {
        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === aimTouchIdRef.current) {
            targetTouch = e.touches[i];
            break;
          }
        }
      }
      // 등록된 터치가 없거나 유실된 경우 버튼 외 터치 중 가장 우측(오른손 검지) 터치 선택
      if (!targetTouch) {
        for (let i = 0; i < e.touches.length; i++) {
          const touch = e.touches[i];
          const target = document.elementFromPoint(touch.clientX, touch.clientY);
          if (target && target.closest('button, .mobile-landscape-fire-btn, .mobile-portrait-fire-btn, .hud-container, .dev-btn-row')) {
            continue;
          }
          if (!targetTouch || touch.clientX > targetTouch.clientX) {
            targetTouch = touch;
          }
        }
        if (targetTouch) {
          aimTouchIdRef.current = targetTouch.identifier;
        }
      }

      if (targetTouch) {
        updateAimFromPointer(targetTouch.clientX, targetTouch.clientY);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (aimTouchIdRef.current !== null) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === aimTouchIdRef.current) {
            aimTouchIdRef.current = null;
            break;
          }
        }
      }
    };

    const onTouchCancel = (e: TouchEvent) => {
      onTouchEnd(e);
    };

    window.addEventListener('pointermove', onMouseMove, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('pointerdown', onMouseDown);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchCancel);

    return () => {
      window.removeEventListener('pointermove', onMouseMove);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('pointerdown', onMouseDown);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [endingMode, updateAimFromPointer, triggerFire]);

  // 키보드 Space 발사 및 P 키 화면 정지/재개 이벤트
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        triggerFire();
      } else if (e.code === 'KeyP') {
        e.preventDefault();
        handleTogglePause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerFire]);

  // 우클릭 방지
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // 게임 화면 일시 정지 / 재개 토글 핸들러 (순간 정지하여 디자인 확인/수정)
  const handleTogglePause = () => {
    setIsPaused((prev) => {
      const next = !prev;
      isPausedRef.current = next;
      simStateRef.current.devPaused = next;
      return next;
    });
  };

  // 정지 화면에서 '스코어 보기' 클릭 (결과 화면 전환)
  const handleViewScore = () => {
    const canvas = canvasRef.current;
    let url: string | undefined;
    if (canvas) {
      try {
        url = canvas.toDataURL('image/webp', 0.85);
      } catch {
        // toDataURL 실패 시 무시
      }
    }
    onFinishGame(simStateRef.current, url);
  };

  // 음소거 토글
  const handleToggleMute = () => {
    const nextMuted = soundManager.toggleMute();
    setHudState((prev) => ({ ...prev, isMuted: nextMuted }));
  };


  return (
    <div
      className={
        layoutMode === 'desktop'
          ? 'game-viewport-desktop'
          : 'game-viewport-mobile'
      }
    >
      <div
        ref={containerRef}
        className={
          layoutMode === 'desktop'
            ? 'game-canvas-container-desktop'
            : 'game-viewport-mobile'
        }
        style={{
          backgroundImage: `url('/brand/backgrounds/bg_${config.selectedTargets[0] || 'clay'}.png'), url('/brand/backgrounds/bg_${config.selectedTargets[0] || 'clay'}.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        {/* Three.js 캔버스 (3D 슈터 캐릭터 직접 렌더) */}
        <canvas
          ref={canvasRef}
          className="game-canvas"
          onContextMenu={handleContextMenu}
        />

        {/* 조준환 ('+' 타겟 포인터) */}
        {endingMode === 'none' && (
          <div
            ref={reticleRef}
            className={`aim-reticle ${isFiringVisual ? 'firing' : ''}`}
            style={{
              left: `${reticlePos.x}px`,
              top: `${reticlePos.y}px`,
            }}
          >
            <div className="aim-reticle-dot" />
          </div>
        )}

        {/* [명세]: 하단 슈터 영역 및 조작 힌트 (배경 방해 없이 투명하게 안내) */}
        {endingMode === 'none' && (
          <div className="shooter-control-deck">
            <div className="shooter-control-hint">
              <span>🎯</span>
              <span>
                {layoutMode === 'desktop'
                  ? '마우스 이동으로 조준 / 클릭 또는 Space로 발사'
                  : '오른쪽 검지 손가락으로 터치 조준 / 왼쪽 발사 버튼으로 슈팅'}
              </span>
            </div>
          </div>
        )}

        {/* 메아리(Echo) 클라이맥스 배너 */}
        {hudState.isClimax && endingMode === 'none' && (
          <div className="echo-banner">
            ✨ {t('echoBanner')} ✨
          </div>
        )}

        {/* HUD UI 컨테이너 */}
        {endingMode === 'none' && (
          <div className="hud-container">
            {layoutMode !== 'mobile_portrait' ? (
              /* 데스크톱 & 모바일 가로: 1줄 HUD */
              <div className="hud-topbar-single">
                <div className="hud-stat-group">
                  <button
                    onClick={handleToggleMute}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#fff',
                      fontSize: '15px',
                      cursor: 'pointer',
                    }}
                    title="Mute Toggle"
                  >
                    {hudState.isMuted ? '🔇' : '🔊'}
                  </button>

                  <div className="hud-item">
                    <span className="hud-label">{t('timeLeft')}</span>
                    <span className="hud-value tabular-nums highlight">
                      {hudState.timeLeft}s
                    </span>
                  </div>

                  <div className="hud-item">
                    <span className="hud-label">{t('missesLeft')}</span>
                    <span className="hud-value tabular-nums danger">
                      {hudState.missesLeft}
                    </span>
                  </div>
                </div>

                <div className="hud-stat-group">
                  <div className="hud-item">
                    <span className="hud-label">{t('scoreLabel')}</span>
                    <span className="hud-value tabular-nums">
                      {hudState.score}
                    </span>
                  </div>

                  <div className="hud-item">
                    <span className="hud-label">{t('comboLabel')}</span>
                    <span className="hud-value tabular-nums highlight">
                      {hudState.combo}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleLocale()}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    {i18n.language.toUpperCase()}
                  </button>

                  <button
                    onClick={onGoMyPage}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: '600',
                    }}
                  >
                    {t('myPage')}
                  </button>

                  <button
                    onClick={handleTogglePause}
                    style={{
                      background: isPaused
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : 'rgba(255, 255, 255, 0.12)',
                      border: `1px solid ${isPaused ? '#34d399' : 'rgba(255, 255, 255, 0.28)'}`,
                      color: '#ffffff',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: isPaused ? '700' : '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backdropFilter: 'blur(4px)',
                      boxShadow: isPaused ? '0 0 14px rgba(16, 185, 129, 0.7)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                    title={isPaused ? t('resume') : t('pause')}
                  >
                    <span>{isPaused ? '▶' : '⏸'}</span>
                    <span>{isPaused ? t('resume') : t('pause')}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* 모바일 세로: 2줄 HUD */
              <div className="hud-topbar-double">
                <div className="hud-row">
                  <button
                    onClick={handleToggleMute}
                    style={{ background: 'none', border: 'none', color: '#fff', fontSize: '15px' }}
                  >
                    {hudState.isMuted ? '🔇' : '🔊'}
                  </button>

                  <div className="hud-item">
                    <span className="hud-label">{t('timeLeft')}</span>
                    <span className="hud-value tabular-nums highlight">
                      {hudState.timeLeft}s
                    </span>
                  </div>

                  <div className="hud-item">
                    <span className="hud-label">{t('missesLeft')}</span>
                    <span className="hud-value tabular-nums danger">
                      {hudState.missesLeft}
                    </span>
                  </div>
                </div>

                <div className="hud-row">
                  <div className="hud-item">
                    <span className="hud-label">{t('scoreLabel')}</span>
                    <span className="hud-value tabular-nums">{hudState.score}</span>
                  </div>

                  <div className="hud-item">
                    <span className="hud-label">{t('comboLabel')}</span>
                    <span className="hud-value tabular-nums highlight">{hudState.combo}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button
                      onClick={() => toggleLocale()}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#fff',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '11px',
                      }}
                    >
                      {i18n.language.toUpperCase()}
                    </button>
                    <button
                      onClick={onGoMyPage}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#38bdf8',
                        fontSize: '12px',
                      }}
                    >
                      {t('myPage')}
                    </button>

                    <button
                      onClick={handleTogglePause}
                      style={{
                        background: isPaused
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : 'rgba(255, 255, 255, 0.12)',
                        border: `1px solid ${isPaused ? '#34d399' : 'rgba(255, 255, 255, 0.28)'}`,
                        color: '#ffffff',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: isPaused ? '700' : '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        boxShadow: isPaused ? '0 0 10px rgba(16, 185, 129, 0.6)' : 'none',
                      }}
                      title={isPaused ? t('resume') : t('pause')}
                    >
                      <span>{isPaused ? '▶' : '⏸'}</span>
                      <span>{isPaused ? t('resume') : t('pause')}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 모바일 가로 발사 버튼 (왼손 엄지) */}
        {layoutMode === 'mobile_landscape' && endingMode === 'none' && (
          <div className="mobile-landscape-fire-btn">
            <button
              className="mobile-landscape-fire-inner"
              onPointerDown={(e) => {
                e.stopPropagation();
                triggerFire();
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                triggerFire();
              }}
              aria-label={t('fire')}
            >
              {t('fire')}
            </button>
          </div>
        )}

        {/* 모바일 세로 발사 버튼 (하단 왼쪽 엄지) */}
        {layoutMode === 'mobile_portrait' && endingMode === 'none' && (
          <div className="mobile-portrait-fire-btn">
            <button
              className="mobile-portrait-fire-inner"
              onPointerDown={(e) => {
                e.stopPropagation();
                triggerFire();
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                triggerFire();
              }}
              aria-label={t('fire')}
            >
              {t('fire')}
            </button>
          </div>
        )}

        {/* [명세]: 엔딩 3초 동영상 애니메이션 연출 (성공: 즐거워하는 모습 3초 / 실패: 실망하는 모습 3초) */}
        {endingMode !== 'none' && (
          <div className={`ending-video-overlay ${endingMode}`}>
            {/* 외부 업로드 엔딩 동영상 파일이 있을 경우 재생 후 3초에 정지 */}
            <video
              ref={endingVideoRef}
              src={`/brand/videos/ending_${endingMode}.mp4`}
              playsInline
              autoPlay
              muted
              style={{
                display: 'none',
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                zIndex: 65,
              }}
              onLoadedMetadata={(e) => {
                const el = e.currentTarget;
                el.style.display = 'block';
                el.play().catch(() => {});
              }}
            >
              <source src={`/brand/videos/ending_${endingMode}.mp4`} type="video/mp4" />
              <source src={encodeURI(`/brand/videos/${endingMode === 'success' ? '성공' : '실패'}.mp4`)} type="video/mp4" />
            </video>

            {/* 성공 축하 꽃가루 파티클 */}
            {endingMode === 'success' && (
              <div className="confetti-shower">
                {[...Array(30)].map((_, i) => (
                  <div
                    key={i}
                    className="confetti-piece"
                    style={{
                      left: `${(i * 3.3) % 100}%`,
                      backgroundColor: ['#f59e0b', '#38bdf8', '#ec4899', '#22c55e', '#eab308'][i % 5],
                      animationDelay: `${(i % 10) * 0.15}s`,
                      transform: `scale(${0.7 + (i % 5) * 0.15})`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* 실패 비 내림 연출 */}
            {endingMode === 'failure' && (
              <div className="rain-shower">
                {[...Array(25)].map((_, i) => (
                  <div
                    key={i}
                    className="rain-drop"
                    style={{
                      left: `${(i * 4) % 100}%`,
                      animationDelay: `${(i % 8) * 0.12}s`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* 중앙 엔딩 배너 (3초간 연출 후 정지) */}
            <div className={`ending-banner-box ${endingMode}`}>
              <div className="ending-title">
                {endingMode === 'success' ? '🎉 VICTORY! 🎉' : '💔 GAME OVER 💔'}
              </div>
              <div className="ending-subtitle">
                {endingMode === 'success'
                  ? '미션 완벽 달성! 즐거운 승리!'
                  : '목표 달성 실패... 다음 기회에 재도전하세요!'}
              </div>
            </div>
          </div>
        )}

        {/* [명세]: 3초 애니메이션이 멈춘 후 스코어 보기 버튼 노출 -> 클릭 시 스코어 보드로 전환 */}
        {isStill && (
          <button
            className="still-view-score-btn"
            onClick={handleViewScore}
            style={{
              animation: 'bannerPopIn 0.35s ease-out forwards',
              boxShadow: '0 0 25px rgba(245, 158, 11, 0.8), 0 8px 32px rgba(0, 0, 0, 0.5)',
            }}
          >
            {t('viewScore')} ➔
          </button>
        )}

      </div>
    </div>
  );
};
