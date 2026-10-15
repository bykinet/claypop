// src/game/sim/score.ts
// 점수 계산 및 이론상 최대 점수 (theoreticalMax) 계산 모듈

import { TargetType } from './types';

export const BASE_POINTS: Record<TargetType, number> = {
  clay: 100,
  copter: 130,
  boom: 110,
  ufo: 160,
  chick: 150,
  echo: 100,
};

export const CENTER_HIT_BONUS = 40;
export const BOOM_RETURN_BONUS = 70;
export const ECHO_HIT_BONUS = 50;

export const THEORETICAL_MAX_MAP: Record<number, number> = {
  30: 3527,
  60: 8605,
  90: 13805,
  120: 19005,
  150: 24205,
  180: 29405,
};

/**
 * 표적 명중 시 기본 포인트(보너스 포함)를 계산
 */
export function calculateBasePoints(
  type: TargetType,
  p: number,
  isCenter: boolean
): number {
  let pts = BASE_POINTS[type] ?? 100;

  // 중심 명중 보너스 (+40)
  if (isCenter) {
    pts += CENTER_HIT_BONUS;
  }

  // 부메랑 귀환 중 명중 보너스 (+70)
  if (type === 'boom' && p >= 0.5) {
    pts += BOOM_RETURN_BONUS;
  }

  // 메아리 표적 명중 보너스 (+50)
  if (type === 'echo') {
    pts += ECHO_HIT_BONUS;
  }

  return pts;
}

/**
 * 명중 순번 n (1부터 시작)을 반영한 최종 가산 점수
 * awarded = floor(points * (20 + min(n - 1, 20)) / 20)
 */
export function calculateAwardedScore(points: number, n: number): number {
  const multiplier = 20 + Math.min(n - 1, 20);
  return Math.floor((points * multiplier) / 20);
}

/**
 * 세션 길이에 따른 이론상 최대 점수를 반환
 */
export function getTheoreticalMax(duration: number): number {
  if (THEORETICAL_MAX_MAP[duration] !== undefined) {
    return THEORETICAL_MAX_MAP[duration];
  }
  // 한 주기(30초) 기준 15개 완벽 명중 포인트 시퀀스:
  // 11개 스케줄 표적 + 4개 에코
  // 순서:
  // 1: clay (100+40=140)
  // 2: copter (130+40=170)
  // 3: clay (100+40=140)
  // 4: boom(귀환) (110+40+70=220)
  // 5: chick (150+40=190)
  // 6: clay (100+40=140)
  // 7: ufo (160+40=200)
  // 8: copter (130+40=170)
  // 9: clay (100+40=140)
  // 10: chick (150+40=190)
  // 11: echo 1 (100+40+50=190)
  // 12: echo 2 (100+40+50=190)
  // 13: clay (100+40=140)
  // 14: echo 3 (100+40+50=190)
  // 15: echo 4 (100+40+50=190)
  const oneCyclePoints = [
    140, 170, 140, 220, 190, 140, 200, 170, 140,
    190, 190, 190, 140, 190, 190
  ];

  const cycles = Math.floor(duration / 30);
  let totalScore = 0;
  let hitSeq = 1;

  for (let c = 0; c < cycles; c++) {
    for (const pts of oneCyclePoints) {
      totalScore += calculateAwardedScore(pts, hitSeq);
      hitSeq++;
    }
  }

  return Math.min(totalScore, 999999);
}

/**
 * 점수와 이론상 최대 점수에 따른 등급 계산
 * S: >= 90%
 * A: >= 75%
 * B: >= 50%
 * C: < 50%
 */
export function calculateGrade(score: number, theoreticalMax: number): 'S' | 'A' | 'B' | 'C' {
  if (theoreticalMax <= 0) return 'C';
  if (score * 100 >= theoreticalMax * 90) return 'S';
  if (score * 100 >= theoreticalMax * 75) return 'A';
  if (score * 100 >= theoreticalMax * 50) return 'B';
  return 'C';
}
