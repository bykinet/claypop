// src/app/types.ts
// 전역 화면 상태 및 게임 설정 타입

export type AppScreen =
  | 'first'
  | 'nickname'
  | 'home'
  | 'intro'
  | 'play'
  | 'ending'
  | 'still'
  | 'result'
  | 'mypage';

import { TargetType } from '../game/sim/types';

export interface GameConfig {
  duration: number; // 30, 60, 90, 120, 150, 180 (기본 60)
  difficulty: 'easy' | 'normal' | 'hard'; // 기본 normal
  selectedTargets: TargetType[]; // 선택된 타겟 목록 (비어있으면 전체)
  selectedShooter: 'shooter1' | 'shooter2'; // 선택된 슈터 종류 (shooter1 또는 shooter2)
}
