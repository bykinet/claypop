import { describe, it, expect, beforeEach } from 'vitest';
import { customAssetsService } from './customAssetsService';
import { userService } from '../user/userService';

if (typeof (globalThis as any).localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => {
      store[key] = String(val);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
  };
}

describe('CustomAssetsService & Admin integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('allows adding and deleting up to 3 shooters', () => {
    const res1 = customAssetsService.addShooter({
      name: '슈터A',
      file: 'shooter1.png',
      altFile: 'shooter1.png',
      desc: '테스트 슈터 1',
    });
    expect(res1.success).toBe(true);

    const res2 = customAssetsService.addShooter({
      name: '슈터B',
      file: 'shooter2.png',
      altFile: 'shooter2.png',
      desc: '테스트 슈터 2',
    });
    expect(res2.success).toBe(true);

    const res3 = customAssetsService.addShooter({
      name: '슈터C',
      file: 'shooter1.png',
      altFile: 'shooter1.png',
      desc: '테스트 슈터 3',
    });
    expect(res3.success).toBe(true);

    // 4번째 추가 시도 -> 거부 (최대 3개 제한)
    const res4 = customAssetsService.addShooter({
      name: '슈터D',
      file: 'shooter2.png',
      altFile: 'shooter2.png',
      desc: '초과 슈터',
    });
    expect(res4.success).toBe(false);

    expect(customAssetsService.getShooters().length).toBe(3);

    // 삭제 테스트
    const firstId = customAssetsService.getShooters()[0].id;
    customAssetsService.deleteShooter(firstId);
    expect(customAssetsService.getShooters().length).toBe(2);
  });

  it('validates default admin accounts correctly', async () => {
    // 1) byki@daum.net
    const user1 = await userService.loginWithEmail('byki@daum.net', '123456');
    expect(user1).not.toBeNull();
    expect(userService.isAdmin()).toBe(true);
    expect(userService.isLoggedIn()).toBe(true);

    // 2) nfriend02@naver.com
    const user2 = await userService.loginWithEmail('nfriend02@naver.com', '123456');
    expect(user2).not.toBeNull();
    expect(userService.isAdmin()).toBe(true);

    // 3) +82 1052799244
    const user3 = await userService.loginWithPhone('+82 1052799244', '123456');
    expect(user3).not.toBeNull();
    expect(userService.isAdmin()).toBe(true);

    // 일반 유저는 관리자가 아님
    const userGuest = await userService.loginAsGuest();
    expect(userGuest).not.toBeNull();
    expect(userService.isAdmin()).toBe(false);
    expect(userService.isLoggedIn()).toBe(false);
  });
});
