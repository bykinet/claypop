// src/entities/assets/customAssetsService.ts
// 관리자 전용 에셋 추가(캐릭터, 배경, 타겟 각 최대 3개) 및 삭제 관리 서비스

export interface CustomShooter {
  id: string;
  name: string;
  file: string;
  altFile: string;
  desc?: string;
  createdAt: number;
}

export interface CustomBackground {
  id: string;
  name: string;
  file: string;
  theme: string;
  desc?: string;
  createdAt: number;
}

export interface CustomTarget {
  id: string;
  name: string;
  icon: string;
  baseScore: number;
  trajectory: 'parabola' | 'wavy_copter' | 'boomerang' | 'erratic_star';
  projectileColor: string;
  desc?: string;
  createdAt: number;
}

export interface CustomAssetsState {
  shooters: CustomShooter[];
  backgrounds: CustomBackground[];
  targets: CustomTarget[];
}

const STORAGE_KEY = 'claypop.custom_assets';

class CustomAssetsService {
  private state: CustomAssetsState;
  private listeners: ((state: CustomAssetsState) => void)[] = [];

  constructor() {
    this.state = this.load();
  }

  private load(): CustomAssetsState {
    if (typeof localStorage === 'undefined') {
      return { shooters: [], backgrounds: [], targets: [] };
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        shooters: [],
        backgrounds: [],
        targets: [],
      };
    }
    try {
      const parsed = JSON.parse(raw);
      return {
        shooters: Array.isArray(parsed.shooters) ? parsed.shooters : [],
        backgrounds: Array.isArray(parsed.backgrounds) ? parsed.backgrounds : [],
        targets: Array.isArray(parsed.targets) ? parsed.targets : [],
      };
    } catch {
      return { shooters: [], backgrounds: [], targets: [] };
    }
  }

  private save(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch {
        // 무시
      }
    }
    this.listeners.forEach((fn) => fn(this.state));
  }

  public subscribe(fn: (state: CustomAssetsState) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  public getState(): CustomAssetsState {
    return this.state;
  }

  // --- 1. 캐릭터(슈터) 관리 (최대 3개) ---
  public getShooters(): CustomShooter[] {
    return this.state.shooters;
  }

  public addShooter(shooter: Omit<CustomShooter, 'id' | 'createdAt'>): { success: boolean; message?: string } {
    if (this.state.shooters.length >= 3) {
      return { success: false, message: '캐릭터는 최대 3개까지만 추가할 수 있습니다.' };
    }
    const newShooter: CustomShooter = {
      ...shooter,
      id: `custom_shooter_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
    };
    this.state.shooters.push(newShooter);
    this.save();
    return { success: true };
  }

  public deleteShooter(id: string): void {
    this.state.shooters = this.state.shooters.filter((s) => s.id !== id);
    this.save();
  }

  // --- 2. 배경 관리 (최대 3개) ---
  public getBackgrounds(): CustomBackground[] {
    return this.state.backgrounds;
  }

  public addBackground(bg: Omit<CustomBackground, 'id' | 'createdAt'>): { success: boolean; message?: string } {
    if (this.state.backgrounds.length >= 3) {
      return { success: false, message: '배경은 최대 3개까지만 추가할 수 있습니다.' };
    }
    const newBg: CustomBackground = {
      ...bg,
      id: `custom_bg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
    };
    this.state.backgrounds.push(newBg);
    this.save();
    return { success: true };
  }

  public deleteBackground(id: string): void {
    this.state.backgrounds = this.state.backgrounds.filter((b) => b.id !== id);
    this.save();
  }

  // --- 3. 타겟 관리 (최대 3개) ---
  public getTargets(): CustomTarget[] {
    return this.state.targets;
  }

  public addTarget(target: Omit<CustomTarget, 'id' | 'createdAt'>): { success: boolean; message?: string } {
    if (this.state.targets.length >= 3) {
      return { success: false, message: '타겟은 최대 3개까지만 추가할 수 있습니다.' };
    }
    const newTarget: CustomTarget = {
      ...target,
      id: `custom_target_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
    };
    this.state.targets.push(newTarget);
    this.save();
    return { success: true };
  }

  public deleteTarget(id: string): void {
    this.state.targets = this.state.targets.filter((t) => t.id !== id);
    this.save();
  }
}

export const customAssetsService = new CustomAssetsService();
