// src/game/sim/simulate.test.ts
// 클레이 팝 시뮬레이션 및 이론상 최대치(theoreticalMax) 검증 테스트

import { describe, it, expect } from 'vitest';
import { getTheoreticalMax, calculateGrade } from './score';
import { createSimState, queueShot, stepSimulation } from './simulate';
import { getTargetPosition } from './trajectories';

describe('theoreticalMax 명세 검증', () => {
  it('모든 6개 세션 길이의 theoreticalMax가 명세 수치와 정확히 일치해야 한다', () => {
    expect(getTheoreticalMax(30)).toBe(3527);
    expect(getTheoreticalMax(60)).toBe(8605);
    expect(getTheoreticalMax(90)).toBe(13805);
    expect(getTheoreticalMax(120)).toBe(19005);
    expect(getTheoreticalMax(150)).toBe(24205);
    expect(getTheoreticalMax(180)).toBe(29405);
  });

  it('등급 계산 기준 (S: 90% 이상, A: 75% 이상, B: 50% 이상, C: 50% 미만) 검증', () => {
    // 등급 경계값 검증
    const max30 = 3527;
    const sThreshold = Math.ceil((max30 * 90) / 100);
    const aThreshold = Math.ceil((max30 * 75) / 100);
    const bThreshold = Math.ceil((max30 * 50) / 100);

    expect(calculateGrade(sThreshold, max30)).toBe('S');
    expect(calculateGrade(sThreshold - 1, max30)).toBe('A');
    expect(calculateGrade(aThreshold, max30)).toBe('A');
    expect(calculateGrade(aThreshold - 1, max30)).toBe('B');
    expect(calculateGrade(bThreshold, max30)).toBe('B');
    expect(calculateGrade(bThreshold - 1, max30)).toBe('C');
  });
});

describe('시뮬레이션 완벽 플레이 검증 (30초)', () => {
  it('30초 동안 모든 스케줄 표적과 4개 에코를 중심 명중(부메랑 귀환)시켰을 때 최종 점수가 3527점이어야 한다', () => {
    const state = createSimState(30, 'normal');
    const dt = 1 / 60; // 60 FPS
    
    // 이미 발사를 예약한 표적 ID 집합
    const shotScheduledTargetIds = new Set<number>();
    let echoHitCount = 0;

    while (state.outcome === 'in_progress' && state.elapsed < 30) {
      stepSimulation(state, dt);

      // 아직 쏘지 않은 비행 중인 표적에 대해 발사 큐잉
      for (const t of state.targets) {
        if (t.hit || t.missed || shotScheduledTargetIds.has(t.id)) continue;

        // 부메랑(boom)은 귀환 중(p >= 0.5)에 맞혀야 최고 점수
        const currentPos = getTargetPosition(t, state.elapsed);
        if (t.type === 'boom' && currentPos.p < 0.52) {
          continue; // 귀환 시점까지 대기
        }

        // theoreticalMax 순서:
        // chick(23.6) -> echo 1(24.6) -> echo 2(25.4) -> clay(26.2 사격 26.3) -> echo 3(26.5) -> echo 4(27.0)
        if (t.type === 'echo') {
          // 30% 감속된 비행 속도에 맞추어 echo 1과 echo 2 사격 시점(p >= 0.24) 조정
          if (echoHitCount < 2 && currentPos.p < 0.24) {
            continue;
          }
          if (echoHitCount === 2) {
            // echo 3은 clay(26.2)가 사격된 후 사격 (순번 13: clay, 14: echo 3, 15: echo 4)
            const clay26 = state.targets.find((item) => item.type === 'clay' && item.spawnTime > 25);
            if (!clay26 || !shotScheduledTargetIds.has(clay26.id)) {
              continue;
            }
          }
        }

        // 탄 판정은 120ms 뒤이므로, 120ms 뒤의 표적 중심 위치를 정확히 조준
        const hitEvalTime = state.elapsed + 0.12;
        const futurePos = getTargetPosition(t, hitEvalTime);
        if (futurePos.p < 1.0) {
          queueShot(state, state.elapsed, futurePos.x, futurePos.y);
          shotScheduledTargetIds.add(t.id);
          if (t.type === 'echo') {
            echoHitCount++;
          }
        }
      }
    }

    // 15발 모두 명중
    expect(state.hits).toBe(15);
    expect(state.misses).toBe(0);
    expect(state.centerHits).toBe(15);
    expect(state.echoHits).toBe(4);
    expect(state.score).toBe(3527);
    expect(state.outcome).toBe('success');
  });
});

describe('규칙 검증: 콤보 및 실패 조건', () => {
  it('빈 하늘을 쏴도 콤보는 유지되고, 표적을 놓쳤을 때만 콤보가 0이 된다', () => {
    const state = createSimState(30, 'normal');
    const dt = 1 / 60;

    // 1초까지 진행 (첫 번째 clay는 0.8s에 스폰됨)
    for (let i = 0; i < 60; i++) stepSimulation(state, dt);

    const firstTarget = state.targets[0];
    expect(firstTarget).toBeDefined();

    // 첫 표적 명중
    const hitEvalTime = state.elapsed + 0.12;
    const pos = getTargetPosition(firstTarget, hitEvalTime);
    queueShot(state, state.elapsed, pos.x, pos.y);

    // 판정 시점까지 진행
    for (let i = 0; i < 15; i++) stepSimulation(state, dt);
    expect(state.combo).toBe(1);

    // 빈 하늘에 3발 발사
    queueShot(state, state.elapsed, 0, 0);
    queueShot(state, state.elapsed + 0.05, 0, 0);
    queueShot(state, state.elapsed + 0.1, 0, 0);

    for (let i = 0; i < 20; i++) stepSimulation(state, dt);
    // 빈 하늘 발사 후에도 콤보는 여전히 1 유지
    expect(state.combo).toBe(1);

    // 표적이 비행을 끝낼 때까지 진행 (두 번째 표적 등을 맞히지 않음)
    while (state.misses === 0 && state.elapsed < 10) {
      stepSimulation(state, dt);
    }
    // 표적을 놓치는 순간 콤보가 0으로 리셋
    expect(state.misses).toBeGreaterThanOrEqual(1);
    expect(state.combo).toBe(0);
  });

  it('놓침 횟수가 missLimit에 도달하면 즉시 실패(failure)로 전환된다', () => {
    const state = createSimState(30, 'normal'); // normal missLimit = 5
    const dt = 1 / 60;

    while (state.misses < 5 && state.outcome === 'in_progress') {
      stepSimulation(state, dt);
    }

    expect(state.misses).toBe(5);
    expect(state.outcome).toBe('failure');
  });
});
