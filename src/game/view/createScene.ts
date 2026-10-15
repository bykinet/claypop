// src/game/view/createScene.ts
// Three.js 씬, 카메라, 조명, 3D 슈터 캐릭터 릭, 3D 표적 메쉬 및 발사체 관리
import * as THREE from 'three';
import { TargetType } from '../sim/types';

export interface SceneContext {
  scene: THREE.Scene;
  baseCamera: THREE.PerspectiveCamera; // 흔들림 없는 판정용 기준 카메라
  renderCamera: THREE.PerspectiveCamera; // 렌더링용 카메라 (흔들림 포함)
  renderer: THREE.WebGLRenderer;
  raycaster: THREE.Raycaster;
  planeZ40: THREE.Plane;
  retriever: THREE.Group;
  retrieverTargetX: number;
  launcherGroup: THREE.Group;
  targetsGroup: THREE.Group;
  projectilesGroup: THREE.Group;
  particlesGroup: THREE.Group;
  leadDotMesh: THREE.Mesh;
  shakeTime: number; // 남은 흔들림 시간 (초)
  skyColorCurrent: THREE.Color;
  shooterType: string;
  dispose: () => void;
}

// 색상 상수
const COLOR_BG_NORMAL = new THREE.Color(0x78a4c8);

// 테마별 배경 텍스처 로더 및 캐시
const bgTextureLoader = new THREE.TextureLoader();
const bgTextureCache = new Map<string, THREE.Texture>();

/**
 * 씬 배경을 테마별 이미지로 설정 (폴백 체인 포함)
 */
export function setGameBackground(scene: THREE.Scene, theme: TargetType = 'clay'): void {
  const fallbackNumber =
    theme === 'clay' ? '1' :
    theme === 'copter' ? '2' :
    theme === 'boom' ? '3' :
    theme === 'ufo' ? '4' : '5';

  const cached = bgTextureCache.get(theme);
  if (cached) {
    scene.background = cached;
    return;
  }

  // 1차: bg_${theme}.png
  bgTextureLoader.load(
    `/brand/backgrounds/bg_${theme}.png`,
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      bgTextureCache.set(theme, tex);
      scene.background = tex;
    },
    undefined,
    () => {
      // 2차: bg_${theme}.jpg
      bgTextureLoader.load(
        `/brand/backgrounds/bg_${theme}.jpg`,
        (texJpg) => {
          texJpg.colorSpace = THREE.SRGBColorSpace;
          bgTextureCache.set(theme, texJpg);
          scene.background = texJpg;
        },
        undefined,
        () => {
          // 3차: ${theme}.png
          bgTextureLoader.load(
            `/brand/backgrounds/${theme}.png`,
            (texAlt) => {
              texAlt.colorSpace = THREE.SRGBColorSpace;
              bgTextureCache.set(theme, texAlt);
              scene.background = texAlt;
            },
            undefined,
            () => {
              // 4차: bg${fallbackNumber}.png
              bgTextureLoader.load(
                `/brand/backgrounds/bg${fallbackNumber}.png`,
                (texNum) => {
                  texNum.colorSpace = THREE.SRGBColorSpace;
                  bgTextureCache.set(theme, texNum);
                  scene.background = texNum;
                },
                undefined,
                () => {
                  scene.background = COLOR_BG_NORMAL.clone();
                }
              );
            }
          );
        }
      );
    }
  );
}

// 슈터 텍스처 로더 및 캐시
const shooterTextureLoader = new THREE.TextureLoader();
const shooterTextureCache = new Map<string, THREE.Texture>();

const SHOOTER1_POSES = ['r0', 'r10', 'r20', 'r30', 'r40', 'r60', 'sky', 'l0', 'l10', 'l20', 'l30', 'l40', 'l60'];
const SHOOTER2_POSES = ['r0', 'r10', 'r20', 'r30', 'r40', 'r50', 'r60', 'sky', 'l0', 'l10', 'l20', 'l30', 'l40', 'l50', 'l60'];

/**
 * 슈터 조준 포즈 텍스처 사전 로딩
 */
export function preloadShooterPoses(shooterType: string = 'shooter1'): void {
  const poses = shooterType === 'shooter2' ? SHOOTER2_POSES : SHOOTER1_POSES;
  for (const p of poses) {
    getShooterPoseTexture(shooterType, p);
  }
}

/**
 * 특정 슈터 및 조준 포즈의 텍스처 반환
 */
export function getShooterPoseTexture(shooterType: string, poseKey: string): THREE.Texture {
  const file = `/brand/shooters/poses/${shooterType}_${poseKey}.png`;
  let tex = shooterTextureCache.get(file);
  if (!tex) {
    tex = shooterTextureLoader.load(file);
    tex.colorSpace = THREE.SRGBColorSpace;
    shooterTextureCache.set(file, tex);
  }
  return tex;
}

/**
 * [명세]: 참조 이미지(shooter1_aiming_movement.png, shooter2_aiming_movement.png) 기반
 * 조준 방향(dx, dy)에 따른 정밀 슈터 포즈 키 산출
 */
/**
 * [명세]: 참조 이미지(shooter1_aiming_movement.png, shooter2_aiming_movement.png) 기반
 * 마우스/터치의 정규화된 뷰포트 좌표(normX: -1.0 좌측 ~ +1.0 우측, normY: 0.0 하단 지평선 ~ 1.0 상단 하늘)에 따른
 * 정확한 1:1 직관적 슈터 조준 포즈 키 반환
 */
export function getShooterAimPoseKeyFromNorm(
  shooterType: string,
  normX: number,
  normY: number
): string {
  // 화면 중앙 최상단 (하늘 조준 - straight up sky aim)
  if (normY > 0.76 && Math.abs(normX) < 0.26) {
    return 'sky';
  }

  // 좌/우 방향 판정: 마우스가 화면 중앙 기준 왼쪽이면 'l', 오른쪽이면 'r'
  const isLeft = normX < -0.03;
  const side = isLeft ? 'l' : 'r';

  // 고도 각도 (0도 지평선 ~ 65도 상공)
  const elevationDeg = Math.max(0, Math.min(65, normY * 70.0));

  if (shooterType === 'shooter2') {
    if (elevationDeg < 7) return `${side}0`;
    if (elevationDeg < 16) return `${side}10`;
    if (elevationDeg < 25) return `${side}20`;
    if (elevationDeg < 35) return `${side}30`;
    if (elevationDeg < 45) return `${side}40`;
    if (elevationDeg < 55) return `${side}50`;
    return `${side}60`;
  }

  // Shooter 1: 0, 10, 20, 30, 40, 60
  if (elevationDeg < 8) return `${side}0`;
  if (elevationDeg < 18) return `${side}10`;
  if (elevationDeg < 28) return `${side}20`;
  if (elevationDeg < 40) return `${side}30`;
  if (elevationDeg < 54) return `${side}40`;
  return `${side}60`;
}

export function getShooterAimPoseKey(
  shooterType: string,
  dx: number,
  dy: number,
  dz: number = 26.0
): string {
  const isLeft = dx < -1.0;
  const absDx = Math.abs(dx);
  // 3D 수평 전방 거리 (X-Z 평면 거리)
  const groundDist = Math.hypot(dx, dz);
  // 수평면 기준 고도 각도 (Horizon 0도 ~ Sky 90도)
  const elevationDeg = Math.atan2(Math.max(0.1, dy), groundDist) * (180 / Math.PI);

  // 중앙 상단 (하늘 조준 - straight up sky aim)
  if (absDx < 8.0 && elevationDeg > 54) {
    return 'sky';
  }

  const side = isLeft ? 'l' : 'r';

  if (shooterType === 'shooter2') {
    if (elevationDeg < 6) return `${side}0`;
    if (elevationDeg < 15) return `${side}10`;
    if (elevationDeg < 25) return `${side}20`;
    if (elevationDeg < 35) return `${side}30`;
    if (elevationDeg < 45) return `${side}40`;
    if (elevationDeg < 55) return `${side}50`;
    return `${side}60`;
  }

  // Shooter 1: 0, 10, 20, 30, 40, 60
  if (elevationDeg < 6) return `${side}0`;
  if (elevationDeg < 16) return `${side}10`;
  if (elevationDeg < 26) return `${side}20`;
  if (elevationDeg < 36) return `${side}30`;
  if (elevationDeg < 48) return `${side}40`;
  return `${side}60`;
}

/**
 * 3D 슈터 캐릭터 릭 생성 (배경 이미지가 완전히 제거된 순수 3D 캐릭터)
 * Shooter 1: 카우보이 사수 (shooter1_aiming_movement.png 기반 정밀 포즈)
 * Shooter 2: 수퍼맨 사수 (shooter2_aiming_movement.png 기반 정밀 포즈)
 */
export function build3DShooterRig(shooterType: string = 'shooter1'): THREE.Group {
  preloadShooterPoses(shooterType);

  const root = new THREE.Group();
  root.name = 'shooter_rig';

  const bodyGroup = new THREE.Group();
  bodyGroup.name = 'body';

  const initialPoseKey = shooterType === 'shooter2' ? 'r40' : 'r20';
  const tex = getShooterPoseTexture(shooterType, initialPoseKey);

  // 배경 없는 순수 3D 캐릭터 메쉬 (클린 투명 렌더링)
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
  });

  const planeSize = shooterType === 'shooter2' ? 9.6 : 9.8;
  const geo = new THREE.PlaneGeometry(planeSize, planeSize);
  // 피벗 중심을 발 위치(하단)에 맞추어 조준 각도 변경 시 발이 땅에 붙어 있도록 설정
  geo.translate(0, planeSize * 0.42, 0);

  const characterMesh = new THREE.Mesh(geo, mat);
  characterMesh.name = 'character_mesh';
  characterMesh.position.set(0, 0, 0);
  characterMesh.renderOrder = 100;
  bodyGroup.add(characterMesh);

  // 캐릭터 발 아래 부드러운 3D 음영 타원
  const shadowGeo = new THREE.PlaneGeometry(5.2, 1.8);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.set(0, 0, 0);
  shadowMesh.renderOrder = 95;
  bodyGroup.add(shadowMesh);

  root.add(bodyGroup);

  // 화면 하단 카메라(50, 8, 0) 바로 앞 최적 3D 위치 (Y=0.6, Z=14.0)
  root.position.set(50, 0.6, 14.0);
  root.scale.set(1.0, 1.0, 1.0);
  return root;
}

/**
 * 3초 엔딩 애니메이션 갱신 함수 (3초간 연출 후 멈춤)
 * mode: 'success' (환호/점프) | 'failure' (실망/처짐)
 */
export function animateShooterEnding(
  launcherGroup: THREE.Group,
  mode: 'success' | 'failure',
  elapsedSec: number
): void {
  const t = Math.min(elapsedSec, 3.0);
  const body = launcherGroup.getObjectByName('body');

  if (mode === 'success') {
    // 3초간 기뻐하며 펄쩍펄쩍 뛰다 3초에 승리의 포즈로 정지
    if (elapsedSec < 3.0) {
      const bounce = Math.abs(Math.sin(t * 8.0)) * 1.6;
      launcherGroup.position.y = 0.6 + bounce;
      launcherGroup.rotation.z = Math.sin(t * 6.0) * 0.12;
      launcherGroup.scale.set(1.08, 1.08, 1.08);
      if (body) {
        body.rotation.z = Math.sin(t * 8.0) * 0.08;
      }
    } else {
      // 3.0초 정확히 멈춤 (승리의 포즈로 고정)
      launcherGroup.position.y = 1.4;
      launcherGroup.rotation.z = 0;
      launcherGroup.scale.set(1.1, 1.1, 1.1);
      if (body) body.rotation.z = 0;
    }
  } else if (mode === 'failure') {
    // 3초간 고개 숙이고 어깨 축 늘어뜨리며 실망하다 3초에 정지
    const slump = Math.min(t / 2.0, 1.0);
    launcherGroup.position.y = 0.6 - slump * 0.8;
    launcherGroup.rotation.z = Math.sin(t * 2.0) * 0.05;
    if (body) {
      body.rotation.z = -slump * 0.12;
    }
  }
}

/**
 * Three.js 씬 초기화 (이전의 갈색 바닥 및 갈색 박스 장면 완전 제거)
 */
export function createGameScene(
  canvas: HTMLCanvasElement,
  theme: TargetType = 'clay',
  shooterType: string = 'shooter1'
): SceneContext {
  const scene = new THREE.Scene();
  scene.background = COLOR_BG_NORMAL.clone();
  setGameBackground(scene, theme);

  // 1. 카메라 설정: 위치 (50, 8, 0), 시선 +Z (50, 8, 40)
  const baseCamera = new THREE.PerspectiveCamera(55, canvas.clientWidth / canvas.clientHeight, 0.1, 500);
  baseCamera.position.set(50, 8, 0);
  baseCamera.lookAt(50, 8, 40);

  const renderCamera = baseCamera.clone();

  // 2. 렌더러 설정
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  // 3. 비행 평면 (Z = 40) 및 레이캐스터
  const raycaster = new THREE.Raycaster();
  const planeZ40 = new THREE.Plane(new THREE.Vector3(0, 0, -1), 40);

  // 4. 조명 설정: 따뜻한 햇빛 및 전면 조명
  const ambientLight = new THREE.AmbientLight(0xffeedd, 0.85);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfff3d6, 1.3);
  sunLight.position.set(30, 60, -20);
  scene.add(sunLight);

  // (※ 갈색 바닥, 갈색 투척 하우스, 억새 띠 등 시야를 가리는 레거시 장면 요소는 완전히 삭제됨)

  // 5. 리트리버: 작고 귀여운 도우미
  const retriever = new THREE.Group();
  retriever.position.set(50, 0, 18);
  scene.add(retriever);

  // 6. 3D 슈터 캐릭터 릭 생성 (배경 없는 순수 3D 캐릭터)
  const launcherGroup = build3DShooterRig(shooterType);
  scene.add(launcherGroup);

  // 7. 표적 컨테이너 그룹
  const targetsGroup = new THREE.Group();
  scene.add(targetsGroup);

  // 8. 탄환(발사체) 컨테이너 그룹
  const projectilesGroup = new THREE.Group();
  scene.add(projectilesGroup);

  // 9. 파티클(파편) 컨테이너 그룹
  const particlesGroup = new THREE.Group();
  scene.add(particlesGroup);

  // 10. 선행점(Lead Dot): 첫 표적 가이드용 희미한 점
  const leadDotGeo = new THREE.RingGeometry(0.6, 0.9, 24);
  const leadDotMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
  });
  const leadDotMesh = new THREE.Mesh(leadDotGeo, leadDotMat);
  leadDotMesh.position.set(50, 16, 40);
  leadDotMesh.visible = false;
  scene.add(leadDotMesh);

  return {
    scene,
    baseCamera,
    renderCamera,
    renderer,
    raycaster,
    planeZ40,
    retriever,
    retrieverTargetX: 50,
    launcherGroup,
    targetsGroup,
    projectilesGroup,
    particlesGroup,
    leadDotMesh,
    shakeTime: 0,
    skyColorCurrent: COLOR_BG_NORMAL.clone(),
    shooterType,
    dispose: () => {
      renderer.dispose();
    },
  };
}

/**
 * 뷰포트 크기 및 카메라 FOV 업데이트
 */
export function updateCameraFOV(
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number
): void {
  const aspect = width / height;
  camera.aspect = aspect;

  let fov = 55;
  const reqVerticalHalf = 26 / 40;
  const reqHorizontalHalf = 42 / 40;

  const fovFromHeight = 2 * Math.atan(reqVerticalHalf) * (180 / Math.PI);
  const fovFromWidth = 2 * Math.atan(reqHorizontalHalf / aspect) * (180 / Math.PI);

  fov = Math.max(55, Math.max(fovFromHeight, fovFromWidth));
  camera.fov = Math.min(fov, 70);
  camera.updateProjectionMatrix();
}

// 타겟 텍스처 로더 및 캐시
const targetTextureLoader = new THREE.TextureLoader();
const targetTextureCache = new Map<string, THREE.Texture>();

export function getTargetThreeTexture(type: TargetType): THREE.Texture {
  let tex = targetTextureCache.get(type);
  if (!tex) {
    tex = targetTextureLoader.load(
      `/brand/targets/clean_${type}.png`,
      undefined,
      undefined,
      () => {
        // 클린 이미지가 없을 경우 기본 png 로드 폴백
        targetTextureLoader.load(`/brand/targets/${type}.png`, (fb) => {
          if (tex) {
            tex.image = fb.image;
            tex.needsUpdate = true;
          }
        });
      }
    );
    tex.colorSpace = THREE.SRGBColorSpace;
    targetTextureCache.set(type, tex);
  }
  return tex;
}

/**
 * [명세]: 각 타겟 종류들의 실제 이미지를 충실하고 멋지게 반영한 3D 표적 메쉬 생성
 */
export function createTargetMesh(type: TargetType): THREE.Object3D {
  const root = new THREE.Group();
  root.name = `target_${type}`;

  const tex = getTargetThreeTexture(type === 'echo' ? 'clay' : type);

  switch (type) {
    case 'clay':
    case 'echo': {
      // 1. 클레이 원반 텍스처 평면 (지름 9.0)
      const planeGeo = new THREE.PlaneGeometry(9.0, 9.0);
      const planeMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: false,
      });
      const discSprite = new THREE.Mesh(planeGeo, planeMat);
      discSprite.rotation.x = Math.PI / 4.5;
      root.add(discSprite);

      // 2. 3D 입체감 테두리 링
      const rimGeo = new THREE.TorusGeometry(4.3, 0.25, 8, 32);
      const rimMat = new THREE.MeshBasicMaterial({
        color: type === 'echo' ? 0xf59e0b : 0xea580c,
        transparent: true,
        opacity: 0.8,
      });
      const rimMesh = new THREE.Mesh(rimGeo, rimMat);
      rimMesh.rotation.x = Math.PI / 4.5;
      root.add(rimMesh);

      if (type === 'echo') {
        const auraGeo = new THREE.RingGeometry(4.6, 5.2, 32);
        const auraMat = new THREE.MeshBasicMaterial({
          color: 0xfef08a,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide,
        });
        const aura = new THREE.Mesh(auraGeo, auraMat);
        aura.name = 'echo_aura';
        aura.rotation.x = Math.PI / 4.5;
        root.add(aura);
      }
      break;
    }

    case 'copter': {
      // 1. 헬리콥터 본체 텍스처 평면 (8.4 x 8.4)
      const planeGeo = new THREE.PlaneGeometry(8.4, 8.4);
      const planeMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: false,
      });
      const bodySprite = new THREE.Mesh(planeGeo, planeMat);
      root.add(bodySprite);

      // 2. 상단 회전 프로펠러 날개 (3D 블레이드)
      const wingGeo = new THREE.BoxGeometry(8.6, 0.12, 0.7);
      const wingMat = new THREE.MeshBasicMaterial({
        color: 0x67e8f9,
        transparent: true,
        opacity: 0.9,
      });
      const wing = new THREE.Mesh(wingGeo, wingMat);
      wing.name = 'wing';
      wing.position.set(0, 3.2, 0.2);
      root.add(wing);

      const wing2 = wing.clone();
      wing2.name = 'wing2';
      wing2.rotation.y = Math.PI / 2;
      root.add(wing2);

      // 3. 프로펠러 중심 허브
      const hubGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 12);
      const hubMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const hub = new THREE.Mesh(hubGeo, hubMat);
      hub.position.set(0, 3.2, 0.2);
      root.add(hub);
      break;
    }

    case 'boom': {
      // 1. 부메랑 텍스처 평면 (8.2 x 8.2)
      const planeGeo = new THREE.PlaneGeometry(8.2, 8.2);
      const planeMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: false,
      });
      const boomSprite = new THREE.Mesh(planeGeo, planeMat);
      boomSprite.rotation.x = Math.PI / 6;
      root.add(boomSprite);

      // 2. 공기역학 궤적 엣지 링
      const edgeGeo = new THREE.RingGeometry(3.8, 4.1, 24);
      const edgeMat = new THREE.MeshBasicMaterial({
        color: 0xf43f5e,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      });
      const edge = new THREE.Mesh(edgeGeo, edgeMat);
      edge.rotation.x = Math.PI / 6;
      root.add(edge);
      break;
    }

    case 'ufo': {
      // 1. UFO 원반 텍스처 평면 (8.6 x 8.6)
      const planeGeo = new THREE.PlaneGeometry(8.6, 8.6);
      const planeMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: false,
      });
      const ufoSprite = new THREE.Mesh(planeGeo, planeMat);
      ufoSprite.name = 'ufo_sprite';
      root.add(ufoSprite);

      // 2. 외계 비행체 발광 돔 및 하단 반중력 링
      const ringGeo = new THREE.TorusGeometry(3.8, 0.2, 8, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.85,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.name = 'ufo_ring';
      ring.rotation.x = Math.PI / 2.2;
      root.add(ring);

      // 3. UFO 하단 신호 라이트
      const ufoLight = new THREE.PointLight(0xa855f7, 2.0, 10);
      ufoLight.position.set(0, -0.5, 0.5);
      root.add(ufoLight);
      break;
    }

    case 'chick': {
      // 1. 치킨 텍스처 평면 (9.2 x 9.2)
      const planeGeo = new THREE.PlaneGeometry(9.2, 9.2);
      const planeMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: false,
      });
      const chickSprite = new THREE.Mesh(planeGeo, planeMat);
      chickSprite.name = 'chick_sprite';
      root.add(chickSprite);

      // 2. 귀여운 반짝임 아우라
      const auraGeo = new THREE.RingGeometry(4.2, 4.6, 24);
      const auraMat = new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });
      const aura = new THREE.Mesh(auraGeo, auraMat);
      root.add(aura);
      break;
    }
  }

  return root;
}

/**
 * [명세]: 타겟의 종류에 따라 다양하고 격렬하고 멋지게 타겟이 박살나는 3D 애니메이션 연출
 */
export function spawnShatterParticles(
  ctx: SceneContext,
  hitX: number,
  hitY: number,
  targetType: TargetType = 'clay'
): void {
  const z = 40;

  switch (targetType) {
    case 'clay':
    case 'echo': {
      // 클레이 도자기 파편 박살 연출: 28개의 날카로운 도자기 조각 + 흙먼지 구름
      const shardCount = 28;
      const clayColors = [0xf59e0b, 0xea580c, 0xb45309, 0xd97706, 0xffedd5];

      for (let i = 0; i < shardCount; i++) {
        const sz = 0.5 + Math.random() * 0.7;
        const geo = new THREE.BoxGeometry(sz, sz * (0.6 + Math.random() * 0.8), sz * 0.4);
        const col = clayColors[i % clayColors.length];
        const mat = new THREE.MeshBasicMaterial({ color: col });
        const shard = new THREE.Mesh(geo, mat);
        shard.position.set(hitX, hitY, z);

        const angle = (i / shardCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const speed = 18 + Math.random() * 20;

        shard.userData = {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed + 6,
          vz: (Math.random() - 0.5) * 16,
          rotX: (Math.random() - 0.5) * 25,
          rotY: (Math.random() - 0.5) * 25,
          rotZ: (Math.random() - 0.5) * 25,
          gravity: 36,
          drag: 0.98,
          life: 0.85 + Math.random() * 0.35,
          age: 0,
        };
        ctx.particlesGroup.add(shard);
      }

      // 도자기 흙먼지 파티클
      const dustCount = 12;
      for (let i = 0; i < dustCount; i++) {
        const geo = new THREE.SphereGeometry(0.8 + Math.random() * 0.6, 6, 6);
        const mat = new THREE.MeshBasicMaterial({
          color: 0xd97706,
          transparent: true,
          opacity: 0.75,
        });
        const dust = new THREE.Mesh(geo, mat);
        dust.position.set(hitX + (Math.random() - 0.5) * 2, hitY + (Math.random() - 0.5) * 2, z);

        const speed = 4 + Math.random() * 8;
        const angle = Math.random() * Math.PI * 2;
        dust.userData = {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed + 2,
          vz: (Math.random() - 0.5) * 6,
          gravity: 8,
          drag: 0.94,
          isDust: true,
          life: 0.6 + Math.random() * 0.3,
          age: 0,
        };
        ctx.particlesGroup.add(dust);
      }

      if (targetType === 'echo') {
        // 에코 타겟용 황금 스파크 폭발
        for (let i = 0; i < 18; i++) {
          const geo = new THREE.SphereGeometry(0.35, 4, 4);
          const mat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
          const spk = new THREE.Mesh(geo, mat);
          spk.position.set(hitX, hitY, z);
          const angle = Math.random() * Math.PI * 2;
          const speed = 15 + Math.random() * 18;
          spk.userData = {
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed + 10,
            vz: (Math.random() - 0.5) * 12,
            gravity: 16,
            drag: 0.96,
            life: 0.7,
            age: 0,
          };
          ctx.particlesGroup.add(spk);
        }
      }
      break;
    }

    case 'copter': {
      // 헬리콥터 기계 폭발: 24개 합금 파편 + 4개 날아가는 프로펠러 날개 + 16개 전기 스파크
      const copterColors = [0x38bdf8, 0x0284c7, 0xe2e8f0, 0x94a3b8, 0xffffff];
      for (let i = 0; i < 24; i++) {
        const geo = new THREE.BoxGeometry(0.6 + Math.random() * 0.6, 0.4, 0.4);
        const col = copterColors[i % copterColors.length];
        const mat = new THREE.MeshBasicMaterial({ color: col });
        const shard = new THREE.Mesh(geo, mat);
        shard.position.set(hitX, hitY, z);

        const angle = (i / 24) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
        const speed = 19 + Math.random() * 22;

        shard.userData = {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed + 5,
          vz: (Math.random() - 0.5) * 16,
          rotX: (Math.random() - 0.5) * 30,
          rotY: (Math.random() - 0.5) * 30,
          rotZ: (Math.random() - 0.5) * 30,
          gravity: 34,
          drag: 0.985,
          life: 0.9,
          age: 0,
        };
        ctx.particlesGroup.add(shard);
      }

      // 회전하며 날아가는 부러진 날개 조각 4개
      for (let i = 0; i < 4; i++) {
        const geo = new THREE.BoxGeometry(3.6, 0.14, 0.5);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const blade = new THREE.Mesh(geo, mat);
        blade.position.set(hitX, hitY, z);

        const bladeAngle = (i / 4) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const bladeSpeed = 22 + Math.random() * 12;

        blade.userData = {
          vx: Math.cos(bladeAngle) * bladeSpeed,
          vy: Math.sin(bladeAngle) * bladeSpeed + 8,
          vz: (Math.random() - 0.5) * 14,
          rotX: 20,
          rotY: 35,
          rotZ: 25,
          gravity: 30,
          drag: 0.99,
          life: 1.1,
          age: 0,
        };
        ctx.particlesGroup.add(blade);
      }

      // 전기 방전 스파크
      for (let i = 0; i < 16; i++) {
        const geo = new THREE.ConeGeometry(0.3, 1.2, 4);
        const mat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
        const spk = new THREE.Mesh(geo, mat);
        spk.position.set(hitX, hitY, z);

        const angle = Math.random() * Math.PI * 2;
        const speed = 25 + Math.random() * 15;
        spk.userData = {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          vz: (Math.random() - 0.5) * 12,
          gravity: 12,
          drag: 0.95,
          life: 0.5,
          age: 0,
        };
        ctx.particlesGroup.add(spk);
      }
      break;
    }

    case 'boom': {
      // 부메랑 산산조각 파편 폭발: 26개 가시형 나무 파편 + 방사형 에너지 광선
      const boomColors = [0xe11d48, 0xbe123c, 0xfbbf24, 0xf97316];
      for (let i = 0; i < 26; i++) {
        const geo = new THREE.BoxGeometry(0.3, 1.6 + Math.random() * 0.8, 0.25);
        const col = boomColors[i % boomColors.length];
        const mat = new THREE.MeshBasicMaterial({ color: col });
        const splinter = new THREE.Mesh(geo, mat);
        splinter.position.set(hitX, hitY, z);

        const angle = (i / 26) * Math.PI * 2;
        const speed = 21 + Math.random() * 20;

        splinter.userData = {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed + 6,
          vz: (Math.random() - 0.5) * 14,
          rotX: (Math.random() - 0.5) * 20,
          rotY: (Math.random() - 0.5) * 20,
          rotZ: 32, // 고속 회전 칼날
          gravity: 32,
          drag: 0.98,
          life: 0.9,
          age: 0,
        };
        ctx.particlesGroup.add(splinter);
      }

      // 스타버스트 에너지 침 14개
      for (let i = 0; i < 14; i++) {
        const geo = new THREE.CylinderGeometry(0.08, 0.08, 2.4, 4);
        const mat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
        const ray = new THREE.Mesh(geo, mat);
        ray.position.set(hitX, hitY, z);

        const angle = (i / 14) * Math.PI * 2 + 0.1;
        ray.rotation.z = angle + Math.PI / 2;
        const speed = 30 + Math.random() * 12;

        ray.userData = {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          vz: 0,
          gravity: 10,
          drag: 0.96,
          life: 0.45,
          age: 0,
        };
        ctx.particlesGroup.add(ray);
      }
      break;
    }

    case 'ufo': {
      // UFO 외계 플라즈마 파열 폭발: 32개 네온 플라즈마 유리 파편 + 충격파 링 + 반중력 입자
      const ufoColors = [0xa855f7, 0xc084fc, 0x06b6d4, 0xf43f5e, 0x38bdf8];
      for (let i = 0; i < 32; i++) {
        const sz = 0.5 + Math.random() * 0.6;
        const geo = new THREE.OctahedronGeometry(sz);
        const col = ufoColors[i % ufoColors.length];
        const mat = new THREE.MeshBasicMaterial({ color: col });
        const shard = new THREE.Mesh(geo, mat);
        shard.position.set(hitX, hitY, z);

        const angle = (i / 32) * Math.PI * 2;
        const speed = 18 + Math.random() * 24;

        shard.userData = {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed + 3,
          vz: (Math.random() - 0.5) * 16,
          rotX: (Math.random() - 0.5) * 18,
          rotY: (Math.random() - 0.5) * 18,
          rotZ: (Math.random() - 0.5) * 18,
          gravity: 12, // 반중력 효과로 천천히 하강
          drag: 0.97,
          life: 1.0,
          age: 0,
        };
        ctx.particlesGroup.add(shard);
      }

      // 우주 충격파 링 (Shockwave Ring)
      const shockGeo = new THREE.TorusGeometry(1.2, 0.2, 8, 32);
      const shockMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.9,
      });
      const shockwave = new THREE.Mesh(shockGeo, shockMat);
      shockwave.position.set(hitX, hitY, z);
      shockwave.userData = {
        vx: 0,
        vy: 0,
        vz: 0,
        gravity: 0,
        isShockwave: true,
        life: 0.45,
        age: 0,
      };
      ctx.particlesGroup.add(shockwave);

      // 상공으로 떠오르는 플라즈마 에너지 구체 14개
      for (let i = 0; i < 14; i++) {
        const geo = new THREE.SphereGeometry(0.4, 6, 6);
        const mat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
        const orb = new THREE.Mesh(geo, mat);
        orb.position.set(hitX + (Math.random() - 0.5) * 3, hitY + (Math.random() - 0.5) * 3, z);
        orb.userData = {
          vx: (Math.random() - 0.5) * 10,
          vy: 8 + Math.random() * 12, // 상공 부유
          vz: (Math.random() - 0.5) * 8,
          gravity: -4, // 반중력 상승
          drag: 0.96,
          life: 0.8,
          age: 0,
        };
        ctx.particlesGroup.add(orb);
      }
      break;
    }

    case 'chick': {
      // 치킨 깃털 폭발: 28개의 하늘거리는 깃털 + 코믹 팝 골든 스타 + 하트 파티클
      const featherColors = [0xfacc15, 0xfef08a, 0xffffff, 0xf97316];
      for (let i = 0; i < 28; i++) {
        const geo = new THREE.PlaneGeometry(0.8 + Math.random() * 0.4, 1.4 + Math.random() * 0.6);
        const col = featherColors[i % featherColors.length];
        const mat = new THREE.MeshBasicMaterial({
          color: col,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.95,
        });
        const feather = new THREE.Mesh(geo, mat);
        feather.position.set(hitX, hitY, z);

        const angle = (i / 28) * Math.PI * 2;
        const speed = 12 + Math.random() * 14;

        feather.userData = {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed + 7,
          vz: (Math.random() - 0.5) * 10,
          rotX: (Math.random() - 0.5) * 8,
          rotY: (Math.random() - 0.5) * 14,
          rotZ: (Math.random() - 0.5) * 10,
          gravity: 10, // 가볍게 흩날리는 깃털
          drag: 0.97,
          flutter: true,
          phase: Math.random() * 10,
          isFeather: true,
          life: 1.2 + Math.random() * 0.4,
          age: 0,
        };
        ctx.particlesGroup.add(feather);
      }

      // 코믹 팝 골든 스타 12개
      for (let i = 0; i < 12; i++) {
        const geo = new THREE.OctahedronGeometry(0.5, 0);
        const mat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        const star = new THREE.Mesh(geo, mat);
        star.position.set(hitX, hitY, z);

        const angle = (i / 12) * Math.PI * 2;
        const speed = 20 + Math.random() * 10;
        star.userData = {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed + 5,
          vz: (Math.random() - 0.5) * 8,
          rotX: 15,
          rotZ: 15,
          gravity: 24,
          drag: 0.97,
          life: 0.65,
          age: 0,
        };
        ctx.particlesGroup.add(star);
      }
      break;
    }
  }
}

/**
 * 3D 파티클 물리 및 수명 갱신
 */
export function updateParticles(ctx: SceneContext, dt: number): void {
  const toRemove: THREE.Object3D[] = [];

  ctx.particlesGroup.children.forEach((obj) => {
    const ud = obj.userData;
    if (!ud || ud.age === undefined) return;

    ud.age += dt;
    if (ud.age >= ud.life) {
      toRemove.push(obj);
      return;
    }

    const lifeRatio = ud.age / ud.life;
    const gravity = ud.gravity !== undefined ? ud.gravity : 22;
    ud.vy -= gravity * dt;

    // 공기 저항(drag)
    const drag = ud.drag !== undefined ? ud.drag : 0.985;
    const decay = Math.pow(drag, dt * 60);
    ud.vx *= decay;
    ud.vy *= decay;
    ud.vz *= decay;

    // 깃털 흔들림(flutter) 공기역학 물리
    if (ud.flutter) {
      obj.position.x += (ud.vx + Math.sin(ud.age * 12 + (ud.phase || 0)) * 4.5) * dt;
      obj.position.y += ud.vy * dt;
      obj.position.z += (ud.vz + Math.cos(ud.age * 9 + (ud.phase || 0)) * 3.0) * dt;
    } else {
      obj.position.x += ud.vx * dt;
      obj.position.y += ud.vy * dt;
      obj.position.z += ud.vz * dt;
    }

    if (ud.rotX) obj.rotation.x += ud.rotX * dt;
    if (ud.rotY) obj.rotation.y += ud.rotY * dt;
    if (ud.rotZ) obj.rotation.z += ud.rotZ * dt;

    // 충격파 링 확장 및 먼지 확장
    if (ud.isShockwave) {
      const expand = 1.0 + (ud.age / ud.life) * 9.0;
      obj.scale.set(expand, expand, expand);
    } else if (ud.isDust) {
      obj.scale.multiplyScalar(1.0 + 0.9 * dt);
    } else {
      const scaleMul = ud.isFeather ? 0.992 : 0.965;
      obj.scale.multiplyScalar(scaleMul);
    }

    // 투명도 페이드아웃
    if (obj instanceof THREE.Mesh && obj.material) {
      const mat = obj.material as THREE.Material;
      if (mat.transparent) {
        mat.opacity = Math.max(0, 1.0 - lifeRatio);
      }
    }
  });

  toRemove.forEach((obj) => {
    ctx.particlesGroup.remove(obj);
    if (obj instanceof THREE.Mesh) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    }
  });
}

// 탄환(발사체) 텍스처 로더 및 캐시
const projectileTextureLoader = new THREE.TextureLoader();
const projectileTextureCache = new Map<string, THREE.Texture>();

export function getProjectileThreeTexture(projectileType: string): THREE.Texture {
  let tex = projectileTextureCache.get(projectileType);
  if (!tex) {
    const fallbackNumber =
      projectileType === 'shotgun_pellet' ? '1' :
      projectileType === 'emp_spark' ? '2' :
      projectileType === 'energy_ring' ? '3' :
      projectileType === 'plasma_bolt' ? '4' : '5';

    tex = projectileTextureLoader.load(
      `/brand/projectiles/clean_${projectileType}.png`,
      undefined,
      undefined,
      () => {
        // 원본 이미지 폴백
        projectileTextureLoader.load(
          `/brand/projectiles/${projectileType}.png`,
          (fb0) => {
            if (tex) {
              tex.image = fb0.image;
              tex.needsUpdate = true;
            }
          },
          undefined,
          () => {
            projectileTextureLoader.load(
              `/brand/projectiles/projectile${fallbackNumber}.png`,
              (fb1) => {
                if (tex) {
                  tex.image = fb1.image;
                  tex.needsUpdate = true;
                }
              },
              undefined,
              () => {
                projectileTextureLoader.load(`/brand/projectiles/${fallbackNumber}.png`, (fb2) => {
                  if (tex) {
                    tex.image = fb2.image;
                    tex.needsUpdate = true;
                  }
                });
              }
            );
          }
        );
      }
    );
    tex.colorSpace = THREE.SRGBColorSpace;
    projectileTextureCache.set(projectileType, tex);
  }
  return tex;
}

/**
 * [명세]: 각 탄환 종류들의 이미지를 충실하게 반영하고 멋지고 정확하게 적용하여 발사
 * (화면에서 뚜렷하고 멋지게 보이도록 4.0 x 4.0 스케일 + 고유 3D 에너지 코어)
 */
export function spawnProjectile(
  ctx: SceneContext,
  targetX: number,
  targetY: number,
  projectileType: string = 'shotgun_pellet',
  colorHex: string = '#f59e0b'
): void {
  const body = ctx.launcherGroup.getObjectByName('body');
  const facingSign = body && body.scale.x < 0 ? -1 : 1;
  const startPos = new THREE.Vector3(
    ctx.launcherGroup.position.x + facingSign * 2.2,
    ctx.launcherGroup.position.y + 1.2,
    ctx.launcherGroup.position.z + 1.2
  );
  const endPos = new THREE.Vector3(targetX, targetY, 40);

  const group = new THREE.Group();
  const col = new THREE.Color(colorHex);

  // 1. 탄환 텍스처 스프라이트 평면 (충실한 2배 이상 스케일: 4.0 x 4.0)
  const tex = getProjectileThreeTexture(projectileType);
  const spriteGeo = new THREE.PlaneGeometry(4.0, 4.0);
  const spriteMat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    side: THREE.DoubleSide,
    depthTest: true,
    depthWrite: false,
  });
  const spriteMesh = new THREE.Mesh(spriteGeo, spriteMat);
  spriteMesh.renderOrder = 999;
  group.add(spriteMesh);

  // 2. 탄환 종류별 3D 고유 에너지 코어 메쉬
  let coreMesh: THREE.Object3D;
  if (projectileType === 'plasma_bolt') {
    const geo = new THREE.SphereGeometry(1.2, 16, 16);
    const mat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
    coreMesh = new THREE.Mesh(geo, mat);
  } else if (projectileType === 'seed_egg') {
    const geo = new THREE.SphereGeometry(0.9, 14, 14);
    const mat = new THREE.MeshLambertMaterial({ color: 0xfacc15 });
    coreMesh = new THREE.Mesh(geo, mat);
    coreMesh.scale.set(1.4, 2.0, 1.4);
  } else if (projectileType === 'emp_spark') {
    const geo = new THREE.ConeGeometry(0.8, 2.6, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    coreMesh = new THREE.Mesh(geo, mat);
    coreMesh.rotation.x = Math.PI / 2;
  } else if (projectileType === 'energy_ring') {
    const geo = new THREE.TorusGeometry(1.0, 0.25, 10, 24);
    const mat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    coreMesh = new THREE.Mesh(geo, mat);
  } else {
    // shotgun_pellet: 클레이 샷건 산탄 코어
    const geo = new THREE.CylinderGeometry(0.5, 0.5, 2.0, 10);
    const mat = new THREE.MeshBasicMaterial({ color: col });
    coreMesh = new THREE.Mesh(geo, mat);
    coreMesh.rotation.x = Math.PI / 2;
  }
  coreMesh.renderOrder = 998;
  group.add(coreMesh);

  // 3. 탄환 비행 발광 조명
  const projLight = new THREE.PointLight(col, 2.8, 14);
  group.add(projLight);

  group.position.copy(startPos);
  group.lookAt(endPos);

  group.userData = {
    startPos: startPos.clone(),
    endPos: endPos.clone(),
    elapsed: 0,
    flightDuration: 0.12, // 120ms
  };

  ctx.projectilesGroup.add(group);
}

/**
 * 3D 탄환 애니메이션 갱신
 */
export function updateProjectiles(ctx: SceneContext, dt: number): void {
  const toRemove: THREE.Object3D[] = [];

  ctx.projectilesGroup.children.forEach((proj) => {
    const ud = proj.userData;
    if (!ud || ud.elapsed === undefined) return;

    ud.elapsed += dt;
    const progress = Math.min(ud.elapsed / ud.flightDuration, 1.0);

    proj.position.lerpVectors(ud.startPos, ud.endPos, progress);
    proj.rotation.z += 20 * dt;

    if (progress >= 1.0) {
      toRemove.push(proj);
    }
  });

  toRemove.forEach((p) => ctx.projectilesGroup.remove(p));
}
