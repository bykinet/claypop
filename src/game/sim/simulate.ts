// src/game/sim/simulate.ts
// 클레이 팝 순수 시뮬레이션 엔진 (Three.js 및 React 독립적)

import {
  Difficulty,
  Side,
  SimState,
  TargetInstance,
  TargetType,
} from './types';
import {
  CYCLE_SPAWN_TABLE,
  DIFFICULTY_CONFIGS,
  TARGET_BASE_DURATIONS,
  TARGET_BASE_RADII,
} from './spawnTable';
import { getTargetPosition } from './trajectories';
import { calculateAwardedScore, calculateBasePoints } from './score';

/**
 * 초기 시뮬레이션 상태 생성
 */
export function createSimState(
  duration: number = 60,
  difficulty: Difficulty = 'normal',
  selectedTargets?: TargetType[]
): SimState {
  const diffConfig = DIFFICULTY_CONFIGS[difficulty];
  return {
    elapsed: 0,
    duration,
    difficulty,
    speed: diffConfig.speed,
    radiusScale: diffConfig.radiusScale,
    missLimit: diffConfig.missLimit,
    selectedTargets,

    score: 0,
    combo: 0,
    maxCombo: 0,
    hits: 0,
    misses: 0,
    centerHits: 0,
    echoHits: 0,

    clayHits: 0,
    copterHits: 0,
    boomHits: 0,
    ufoHits: 0,
    chickHits: 0,

    outcome: 'in_progress',

    echoWindowCount: 0,
    lastEchoCycle: -1,

    ufoSpawnCount: 0,
    nextTargetId: 1,
    targets: [],
    pendingShots: [],
    recentHits: [],

    devPaused: false,
  };
}

/**
 * 새 표적 인스턴스 생성 헬퍼
 */
function createTargetInstance(
  id: number,
  type: TargetType,
  side: Side,
  spawnTime: number,
  speed: number,
  radiusScale: number,
  ufoIndex?: number
): TargetInstance {
  const baseDuration = TARGET_BASE_DURATIONS[type] ?? 2.2;
  const flightTime = baseDuration / speed;
  const baseRadius = TARGET_BASE_RADII[type] ?? 4.5;
  const actualRadius = baseRadius * radiusScale;

  // side L: X 10 -> 92, side R: X 90 -> 8
  // copter 와 chick 은 진행 방향이 side의 반대
  let startX: number;
  let endX: number;

  if (type === 'copter' || type === 'chick') {
    if (side === 'L') {
      // side L의 반대 진행 (오른쪽에서 왼쪽)
      startX = 90;
      endX = 8;
    } else {
      // side R의 반대 진행 (왼쪽에서 오른쪽)
      startX = 10;
      endX = 92;
    }
  } else {
    if (side === 'L') {
      startX = 10;
      endX = 92;
    } else {
      startX = 90;
      endX = 8;
    }
  }

  return {
    id,
    type,
    side,
    spawnTime,
    duration: baseDuration,
    flightTime,
    baseRadius,
    actualRadius,
    ufoIndex,
    startX,
    endX,
    hit: false,
    missed: false,
  };
}

/**
 * 발사 이벤트 추가
 */
export function queueShot(state: SimState, fireElapsed: number, aimX: number, aimY: number): void {
  // 종료된 게임이면 무시
  if (state.outcome !== 'in_progress') return;
  state.pendingShots.push({
    fireElapsed,
    aimX,
    aimY,
    processed: false,
  });
}

/**
 * 시뮬레이션을 dt초만큼 전진
 */
export function stepSimulation(state: SimState, dt: number): SimState {
  if (state.outcome !== 'in_progress' || state.devPaused) {
    return state;
  }

  const prevElapsed = state.elapsed;
  const nextElapsed = Math.min(state.duration, prevElapsed + dt);
  state.elapsed = nextElapsed;

  // 1. 주기 및 로컬 시각 계산
  const currentCycle = Math.floor(nextElapsed / 30);
  const currentLocal = nextElapsed % 30;
  const prevLocal = prevElapsed % 30;

  // 2. 메아리(Echo) 창 리셋: local이 23.0을 지날 때마다 창 카운터 0으로 리셋
  if (
    (prevLocal < 23.0 && currentLocal >= 23.0) ||
    (currentCycle !== state.lastEchoCycle && currentLocal >= 23.0)
  ) {
    state.echoWindowCount = 0;
    state.lastEchoCycle = currentCycle;
  }

  // 3. 28.0을 지나는 프레임 처리:
  // 떠 있는 echo는 type을 clay로 바꾸고 그 월드 좌표를 새 궤적의 시작으로 삼음
  if (
    (prevLocal < 28.0 && currentLocal >= 28.0) ||
    (currentCycle > Math.floor(prevElapsed / 30) && prevLocal < 28.0)
  ) {
    for (const t of state.targets) {
      if (t.type === 'echo' && !t.hit && !t.missed) {
        const pos = getTargetPosition(t, nextElapsed);
        t.type = 'clay';
        t.convertedAt = nextElapsed;
        t.convertedStartX = pos.x;
        t.convertedStartY = pos.y;
      }
    }
  }

  // 4. 스폰 스케줄 검사 및 표적 생성
  // cycle * 30 + item.local < duration 인 표적만 생성
  const prevCycle = Math.floor(prevElapsed / 30);
  for (let c = prevCycle; c <= currentCycle; c++) {
    for (const item of CYCLE_SPAWN_TABLE) {
      const scheduledT = c * 30 + item.local;
      if (scheduledT < state.duration) {
        // 이전 프레임과 현재 프레임 사이에 스케줄 시각이 도달했는지 확인
        if (scheduledT > prevElapsed && scheduledT <= nextElapsed) {
          // 플레이어가 특정 타겟만 설정한 경우: 한 게임에 1종류 타겟만 생성
          let targetType = item.type;
          if (state.selectedTargets && state.selectedTargets.length > 0) {
            targetType = state.selectedTargets[0];
          }

          const ufoIndex = targetType === 'ufo' ? state.ufoSpawnCount++ : undefined;
          const target = createTargetInstance(
            state.nextTargetId++,
            targetType,
            item.side,
            scheduledT,
            state.speed,
            state.radiusScale,
            ufoIndex
          );
          state.targets.push(target);
        }
      }
    }
  }

  // 5. 발사된 탄 판정 (fireElapsed + 0.12 <= elapsed)
  state.recentHits = [];
  for (let i = 0; i < state.pendingShots.length; i++) {
    const shot = state.pendingShots[i];
    if (shot.processed) continue;

    const hitEvalTime = shot.fireElapsed + 0.12;
    if (hitEvalTime <= nextElapsed) {
      shot.processed = true;

      // 판정 시점(hitEvalTime) 및 탄 비행 궤적 구간의 미명중 표적 위치를 궤적 함수로 계산
      let candidate: { target: TargetInstance; dist: number; isCenter: boolean; p: number; x: number; y: number } | null = null;

      for (const t of state.targets) {
        if (t.hit || t.missed) continue;
        // 탄 판정 시각에 표적이 이미 스폰되었고 비행 중인지 확인
        if (hitEvalTime < t.spawnTime) continue;

        const evalPos = getTargetPosition(t, hitEvalTime);
        if (evalPos.p >= 1.0) continue; // 이미 비행 종료 직전인 경우 제외

        // [명세]: 탄환이 날아가는 궤적 및 도달 시점에 타겟 근처에만 스쳐도 여지없이 박살나고 득점
        // 탄환 비행 구간(fireElapsed ~ hitEvalTime) 동안의 최소 거리 산출
        let minDist = Math.hypot(evalPos.x - shot.aimX, evalPos.y - shot.aimY);
        const sampleTimes = [shot.fireElapsed + 0.04, shot.fireElapsed + 0.08];

        for (const st of sampleTimes) {
          if (st < t.spawnTime) continue;
          const samplePos = getTargetPosition(t, st);
          if (samplePos.p < 1.0) {
            const d = Math.hypot(samplePos.x - shot.aimX, samplePos.y - shot.aimY);
            if (d < minDist) {
              minDist = d;
            }
          }
        }

        // 근처에만 스쳐도 여지없이 박살나는 관대한 판정 반경 (기본 반경의 2.4배 + 3.0)
        const grazingRadius = t.actualRadius * 2.4 + 3.0;
        if (minDist <= grazingRadius) {
          if (!candidate || minDist < candidate.dist) {
            const isCenter = minDist <= t.actualRadius * 0.45;
            candidate = { target: t, dist: minDist, isCenter, p: evalPos.p, x: evalPos.x, y: evalPos.y };
          }
        }
      }

      // 조준점과 가장 가까운 하나만 명중
      if (candidate) {
        const { target: hitTarget, isCenter, p, x, y } = candidate;
        hitTarget.hit = true;
        hitTarget.hitTime = hitEvalTime;
        hitTarget.hitCenter = isCenter;

        const basePts = calculateBasePoints(hitTarget.type, p, isCenter);
        const hitSeq = state.hits + 1;
        const awarded = calculateAwardedScore(basePts, hitSeq);

        hitTarget.hitScoreAwarded = awarded;
        state.score += awarded;
        state.hits += 1;
        state.combo += 1;
        if (state.combo > state.maxCombo) {
          state.maxCombo = state.combo;
        }

        // 표적 종류별 통계 누적
        if (hitTarget.type === 'clay') state.clayHits++;
        else if (hitTarget.type === 'copter') state.copterHits++;
        else if (hitTarget.type === 'boom') state.boomHits++;
        else if (hitTarget.type === 'ufo') state.ufoHits++;
        else if (hitTarget.type === 'chick') state.chickHits++;
        else if (hitTarget.type === 'echo') {
          state.echoHits++;
        }

        if (isCenter) state.centerHits++;

        state.recentHits.push({
          targetId: hitTarget.id,
          targetType: hitTarget.type,
          points: basePts,
          awardedScore: awarded,
          isCenter,
          hitX: x,
          hitY: y,
          hitTime: hitEvalTime,
          hitSequence: hitSeq,
          combo: state.combo,
        });

        // 6. 메아리(Echo) 생성 조건 검사
        // - 이번 명중이 echo가 아닌 표적이거나, echo여도 됨
        // - 23.0 <= local < 28.0
        // - 같은 창에서 이미 만든 echo가 4개 미만
        // - 아직 비행이 끝나지 않은 미명중 echo가 없음
        // - echo의 side는 맞은 표적 시작 side의 반대
        const hitLocal = hitEvalTime % 30;
        if (hitLocal >= 23.0 && hitLocal < 28.0 && state.echoWindowCount < 4) {
          const hasFlyingEcho = state.targets.some(
            (t) => t.type === 'echo' && !t.hit && !t.missed
          );
          if (!hasFlyingEcho) {
            const echoSide: Side = hitTarget.side === 'L' ? 'R' : 'L';
            const echoTarget = createTargetInstance(
              state.nextTargetId++,
              'echo',
              echoSide,
              hitEvalTime,
              state.speed,
              state.radiusScale
            );
            state.targets.push(echoTarget);
            state.echoWindowCount++;
          }
        }
      }
    }
  }

  // 처리된 탄 제거
  state.pendingShots = state.pendingShots.filter((s) => !s.processed);

  // 7. 놓침(Miss) 검사: p가 1에 도달했는데 맞지 않은 표적
  for (const t of state.targets) {
    if (!t.hit && !t.missed) {
      const pos = getTargetPosition(t, nextElapsed);
      if (pos.p >= 1.0) {
        t.missed = true;
        state.misses += 1;
        state.combo = 0; // 표적이 맞는 일 없이 비행을 끝낼 때만 콤보 0

        // 놓침 한도 도달 시 즉시 실패
        if (state.misses >= state.missLimit) {
          state.outcome = 'failure';
          return state;
        }
      }
    }
  }

  // 8. 세션 시간 종료 시 성공 판정
  if (nextElapsed >= state.duration) {
    state.outcome = 'success';
  }

  return state;
}
