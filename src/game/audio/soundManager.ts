// src/game/audio/soundManager.ts
// Web Audio API를 활용한 순수 합성 사운드 매니저 (외부 파일 불필요)

class SoundManager {
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private isMuted: boolean = false;
  private bgmPlaying: boolean = false;
  private bgmTimer: number | null = null;

  constructor() {
    // 음소거 상태 로드
    const stored = localStorage.getItem('claypop.muted');
    this.isMuted = stored === 'true';
  }

  /**
   * 사용자 제스처(시작 버튼 클릭 등) 시 AudioContext 초기화 및 resume
   */
  public initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    localStorage.setItem('claypop.muted', String(muted));
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(muted ? 0 : 0.08, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * 햅틱 피드백 (20ms) - prefers-reduced-motion 감안
   */
  public triggerHaptic(durationMs: number = 20): void {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(durationMs);
      } catch {
        // 일부 브라우저 예외 무시
      }
    }
  }

  /**
   * BGM: 삼각파와 가벼운 하모닉, 2초 루프, 120bpm 경쾌한 아르페지오
   */
  public startBGM(): void {
    if (this.bgmPlaying) return;
    const ctx = this.initContext();
    this.bgmPlaying = true;

    const playLoop = () => {
      if (!this.bgmPlaying) return;
      const now = ctx.currentTime;
      // 120 BPM: 0.5초마다 1박, 2초 루프 (4박)
      // C4, E4, G4, B4, C5 경쾌한 멜로디
      const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 261.63, 392.00];
      const step = 0.25;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * step);

        const vol = this.isMuted ? 0 : 0.035;
        gain.gain.setValueAtTime(vol, now + idx * step);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * step + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * step);
        osc.stop(now + idx * step + 0.24);
      });

      this.bgmTimer = window.setTimeout(playLoop, 2000);
    };

    playLoop();
  }

  public stopBGM(): void {
    this.bgmPlaying = false;
    if (this.bgmTimer !== null) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  /**
   * 타겟/탄환 테마에 맞는 맞춤형 발사 사운드 합성
   */
  public playFire(projectileType: string = 'shotgun_pellet'): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const now = ctx.currentTime;

    switch (projectileType) {
      case 'plasma_bolt': {
        // UFO: 통통 튀는 귀여운 8비트 레이저 소리 ("피융-!")
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.13);
        break;
      }

      case 'seed_egg': {
        // 치킨: 상쾌하고 짧은 씨앗/알 발사음 ("푝!")
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.04);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.09);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }

      case 'emp_spark': {
        // 콥터: 전기 스파크 및 펄스 음
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(220, now + 0.06);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.07);
        break;
      }

      case 'energy_ring': {
        // 부메랑: 회전하는 에너지 링 발사음
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.linearRampToValueAtTime(350, now + 0.08);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
        break;
      }

      case 'shotgun_pellet':
      default: {
        // 클래식: 40ms 깔끔한 산탄/기계음
        const bufferSize = Math.floor(ctx.sampleRate * 0.04);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1400;
        filter.Q.value = 1.6;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
        break;
      }
    }
  }

  /**
   * 마일리지 정산: 경쾌한 동전 짤랑거리는 사운드
   */
  public playMileageCoin(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const freqs = [1046.5, 1318.5, 1567.98, 2093.0]; // C6, E6, G6, C7
    const now = ctx.currentTime;

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.2, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.2);
    });
  }

  /**
   * 메아리 시작: 23.0s에 한 번. 톱니파 95Hz에서 75Hz, 180ms
   */
  public playEchoStart(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(95, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(75, ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  }

  /**
   * 메아리 바닥: 23.0~28.0s 저역 펄스 450ms
   */
  public playEchoPulse(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, ctx.currentTime);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  }

  /**
   * 메아리 끝: 28.0s, 사인 660Hz 80ms
   */
  public playEchoEnd(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, ctx.currentTime);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  /**
   * 명중: 잡음 90ms. chick만 한 옥타브 높은 블립을 겹친다
   */
  public playHit(targetType?: string): void {
    this.triggerHaptic(20);
    if (this.isMuted) return;
    const ctx = this.initContext();
    const bufferSize = Math.floor(ctx.sampleRate * 0.09); // 90ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.09);

    noise.connect(gain);
    gain.connect(ctx.destination);
    noise.start();

    // chick 표적일 경우 고음 블립 겹침
    if (targetType === 'chick') {
      const blip = ctx.createOscillator();
      const blipGain = ctx.createGain();
      blip.type = 'sine';
      blip.frequency.setValueAtTime(880, ctx.currentTime);
      blip.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.09);

      blipGain.gain.setValueAtTime(0.2, ctx.currentTime);
      blipGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.09);

      blip.connect(blipGain);
      blipGain.connect(ctx.destination);
      blip.start();
      blip.stop(ctx.currentTime + 0.09);
    }
  }

  /**
   * 놓침: 사인 120Hz 70ms
   */
  public playMiss(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.07);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  }

  /**
   * 콤보 단계: 사인파가 한 음씩 상승, 20단계에서 멈춤
   */
  public playComboStep(combo: number): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // 220Hz(A3)부터 반음씩 최대 20단계(698Hz F5) 상승
    const step = Math.min(Math.max(0, combo - 1), 20);
    const freq = 220 * Math.pow(2, step / 12);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  /**
   * 성공 엔딩: 장3화음 상승 4음 (C4, E4, G4, C5)
   */
  public playSuccessEnding(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const freqs = [261.63, 329.63, 392.00, 523.25];
    const now = ctx.currentTime;

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.16);

      gain.gain.setValueAtTime(0.3, now + idx * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.16 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.16);
      osc.stop(now + idx * 0.16 + 0.38);
    });
  }

  /**
   * 실패 엔딩: 하강 3음 (E4, C4, A3)
   */
  public playFailureEnding(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const freqs = [329.63, 261.63, 220.00];
    const now = ctx.currentTime;

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.22);

      gain.gain.setValueAtTime(0.25, now + idx * 0.22);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.22 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.22);
      osc.stop(now + idx * 0.22 + 0.38);
    });
  }
}

export const soundManager = new SoundManager();
