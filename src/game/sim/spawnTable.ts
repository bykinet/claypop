// src/game/sim/spawnTable.ts
// 클레이 팝 스폰 스케줄 표 (속도 1단계 감속 적용)
import { TargetScheduleItem, Difficulty, DifficultyConfig } from './types';

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    speed: 0.50, // 기존 대비 30% 감속 (0.72 * 0.70)
    radiusScale: 1.15,
    missLimit: 7,
  },
  normal: {
    speed: 0.57, // 기존 대비 30% 감속 (0.82 * 0.70)
    radiusScale: 1.05,
    missLimit: 5,
  },
  hard: {
    speed: 0.66, // 기존 대비 30% 감속 (0.95 * 0.70)
    radiusScale: 0.95,
    missLimit: 4,
  },
};

// 기본 지속 시간 (비행 시간 = duration / speed)
export const TARGET_BASE_DURATIONS: Record<string, number> = {
  clay: 2.2,
  echo: 2.2,
  copter: 2.2,
  chick: 2.2,
  boom: 2.6,
  ufo: 2.6,
};

// 기본 반경 (보통 난이도 기준)
export const TARGET_BASE_RADII: Record<string, number> = {
  clay: 4.5,
  echo: 4.5,
  copter: 4.2,
  boom: 4.0,
  ufo: 3.6,
  chick: 4.8,
};

// 30초 한 주기 스폰 표 (local 시각 기준, 단위: 초)
export const CYCLE_SPAWN_TABLE: readonly TargetScheduleItem[] = [
  { local: 0.8, type: 'clay', side: 'L' },
  { local: 3.2, type: 'copter', side: 'R' },
  { local: 5.6, type: 'clay', side: 'R' },
  { local: 8.0, type: 'boom', side: 'L' },
  { local: 10.4, type: 'chick', side: 'R' },
  { local: 12.8, type: 'clay', side: 'L' },
  { local: 15.2, type: 'ufo', side: 'L' },
  { local: 17.6, type: 'copter', side: 'L' },
  { local: 20.0, type: 'clay', side: 'R' },
  { local: 23.6, type: 'chick', side: 'L' },
  { local: 26.2, type: 'clay', side: 'R' },
] as const;
