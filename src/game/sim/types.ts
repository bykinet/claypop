// src/game/sim/types.ts
// 클레이 팝 시뮬레이션 타입 정의 (React 및 Three.js 의존성 없음)

export type TargetType = 'clay' | 'echo' | 'copter' | 'boom' | 'ufo' | 'chick';
export type Side = 'L' | 'R';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type GameOutcome = 'in_progress' | 'success' | 'failure';

export interface DifficultyConfig {
  speed: number;
  radiusScale: number;
  missLimit: number;
}

export interface TargetScheduleItem {
  local: number;
  type: TargetType;
  side: Side;
}

export interface TargetInstance {
  id: number;
  type: TargetType;
  side: Side;
  spawnTime: number;
  duration: number;
  flightTime: number;
  baseRadius: number;
  actualRadius: number;
  ufoIndex?: number;
  // 시작 및 종료 X 좌표
  startX: number;
  endX: number;
  // 28.0s 에 에코가 클레이로 변환되었는지 여부
  convertedAt?: number;
  convertedStartX?: number;
  convertedStartY?: number;
  // 상태
  hit: boolean;
  hitTime?: number;
  hitCenter?: boolean;
  hitScoreAwarded?: number;
  missed: boolean;
}

export interface ShotEvent {
  fireElapsed: number;
  aimX: number;
  aimY: number;
  processed?: boolean;
}

export interface HitResult {
  targetId: number;
  targetType: TargetType;
  points: number;
  awardedScore: number;
  isCenter: boolean;
  hitX: number;
  hitY: number;
  hitTime: number;
  hitSequence: number;
  combo: number;
}

export interface SimState {
  elapsed: number;
  duration: number; // 세션 길이 (30, 60, 90, 120, 150, 180)
  difficulty: Difficulty;
  speed: number;
  radiusScale: number;
  missLimit: number;
  
  score: number;
  combo: number;
  maxCombo: number;
  hits: number;
  misses: number;
  centerHits: number;
  echoHits: number;
  
  // 표적 종류별 명중 수
  clayHits: number;
  copterHits: number;
  boomHits: number;
  ufoHits: number;
  chickHits: number;
  
  outcome: GameOutcome;
  
  // 사용자 지정 타겟 목록 (비어있으면 기본 전체 스폰)
  selectedTargets?: TargetType[];

  // 메아리(Echo) 클라이맥스 상태
  echoWindowCount: number; // 23.0~28.0 창에서 생성된 에코 수 (최대 4)
  lastEchoCycle: number;
  
  ufoSpawnCount: number;
  nextTargetId: number;
  targets: TargetInstance[];
  pendingShots: ShotEvent[];
  recentHits: HitResult[];
  
  // DEV 일시정지 상태 (elapsed 멈춤)
  devPaused?: boolean;
}
