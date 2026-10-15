// src/game/sim/trajectories.ts
// 표적의 시간에 따른 2D 월드 좌표 (Z = 40 평면 상의 X, Y) 계산 함수

import { TargetInstance } from './types';

export const UFO_VERTICES: readonly (readonly [number, number])[][] = [
  // 0: (22,28) → (40,18) → (58,30) → (78,12)
  [[22, 28], [40, 18], [58, 30], [78, 12]],
  // 1: (78,26) → (60,16) → (42,30) → (18,14)
  [[78, 26], [60, 16], [42, 30], [18, 14]],
  // 2: (30,14) → (48,30) → (70,20) → (84,10)
  [[30, 14], [48, 30], [70, 20], [84, 10]],
  // 3: (70,30) → (50,16) → (32,28) → (16,12)
  [[70, 30], [50, 16], [32, 28], [16, 12]],
] as const;

/**
 * 0과 1 사이로 값을 제한하는 헬퍼 함수
 */
export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/**
 * 선형 보간 헬퍼 함수
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * 특정 시각 t에서 표적의 (x, y) 월드 좌표를 반환
 */
export function getTargetPosition(target: TargetInstance, t: number): { x: number; y: number; p: number } {
  const age = Math.max(0, t - target.spawnTime);
  const p = clamp01(age / target.flightTime);

  // 28.0s 에 클레이로 변환된 에코 표적 처리
  if (target.convertedAt !== undefined && target.convertedStartX !== undefined && target.convertedStartY !== undefined) {
    const totalFlight = target.flightTime;
    const convertedTime = target.convertedAt - target.spawnTime;
    const remainingTime = Math.max(0.001, totalFlight - convertedTime);
    const postAge = Math.max(0, t - target.convertedAt);
    const postP = clamp01(postAge / remainingTime);

    const x = lerp(target.convertedStartX, target.endX, postP);
    // 변환된 지점부터 포물선 비행 (자연스러운 낙하 포물선)
    const arcHeight = 10 * Math.sin(Math.PI * postP);
    const y = lerp(target.convertedStartY, 14, postP) + arcHeight;
    return { x, y, p };
  }

  const { startX, endX, type } = target;

  switch (type) {
    case 'clay':
    case 'echo': {
      // X는 시작에서 끝으로 선형. Y = 16 + 10 * sin(π p)
      const x = lerp(startX, endX, p);
      const y = 16 + 10 * Math.sin(Math.PI * p);
      return { x, y, p };
    }

    case 'copter': {
      // 진행은 side의 반대. Y = 18 + 3.5 * sin(4π p)
      const x = lerp(startX, endX, p);
      const y = 18 + 3.5 * Math.sin(4 * Math.PI * p);
      return { x, y, p };
    }

    case 'chick': {
      // 진행은 side의 반대. Y = 17 + 2 * sin(2π p)
      const x = lerp(startX, endX, p);
      const y = 17 + 2 * Math.sin(2 * Math.PI * p);
      return { x, y, p };
    }

    case 'boom': {
      // p < 0.5이면 가는 길, p >= 0.5이면 같은 길을 되돌아온다.
      const effectiveP = p < 0.5 ? p * 2 : (1 - p) * 2;
      const x = lerp(startX, endX, effectiveP);
      const y = 16 + 10 * Math.sin(Math.PI * effectiveP);
      return { x, y, p };
    }

    case 'ufo': {
      // ufo 꼭짓점, 사이는 선형
      const patternIdx = (target.ufoIndex ?? 0) % 4;
      const verts = UFO_VERTICES[patternIdx];
      
      // 3개 구간: [0..1/3], [1/3..2/3], [2/3..1]
      const scaled = p * 3;
      const seg = Math.min(Math.floor(scaled), 2);
      const segT = scaled - seg;
      
      const v0 = verts[seg];
      const v1 = verts[seg + 1];
      const x = lerp(v0[0], v1[0], segT);
      const y = lerp(v0[1], v1[1], segT);
      return { x, y, p };
    }

    default: {
      const x = lerp(startX, endX, p);
      const y = 16 + 10 * Math.sin(Math.PI * p);
      return { x, y, p };
    }
  }
}
