// src/entities/user/userService.ts
// 사용자 인증, 프로필 및 세션 기록 서비스
import {
  auth,
  db,
  isFirebaseConfigured,
  getLocalUser,
  saveLocalUser,
  removeLocalUser,
  UserProfile,
  SessionRecord,
  saveLocalSession,
  getLocalSessions,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  deleteUser,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from '../../shared/firebase/firebase';
import { getTheoreticalMax } from '../../game/sim/score';

export class UserService {
  private currentUser: UserProfile | null = null;
  private lastInputTime: number = Date.now();

  constructor() {
    this.currentUser = getLocalUser();
    this.setupInactivityListener();
  }

  public getMileage(): number {
    const raw = localStorage.getItem('claypop.mileage');
    return raw ? parseInt(raw, 10) : 0;
  }

  public addMileage(amount: number): number {
    const current = this.getMileage();
    const updated = Math.max(0, current + amount);
    localStorage.setItem('claypop.mileage', updated.toString());
    return updated;
  }

  public getUnlockedSkins(): string[] {
    const raw = localStorage.getItem('claypop.unlockedSkins');
    if (!raw) return ['clay_classic_v1', 'copter_drone_v1', 'boomerang_clay_v1', 'ufo_star_v1', 'chick_panicked_v1'];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public unlockSkin(skinId: string, cost: number): boolean {
    const current = this.getMileage();
    if (current < cost) return false;
    const unlocked = this.getUnlockedSkins();
    if (!unlocked.includes(skinId)) {
      unlocked.push(skinId);
      localStorage.setItem('claypop.unlockedSkins', JSON.stringify(unlocked));
      this.addMileage(-cost);
    }
    return true;
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  public updateLastInput(): void {
    this.lastInputTime = Date.now();
  }

  public checkInactivity(currentScreen: string, onLogout: () => void): void {
    // play 와 ending 동안에는 판을 끊지 않음
    if (currentScreen === 'play' || currentScreen === 'ending') {
      return;
    }
    const thirtyMinutesMs = 30 * 60 * 1000;
    if (this.currentUser && Date.now() - this.lastInputTime > thirtyMinutesMs) {
      this.logout().then(onLogout);
    }
  }

  private setupInactivityListener(): void {
    if (typeof window === 'undefined') return;
    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    const handler = () => this.updateLastInput();
    events.forEach((evt) => window.addEventListener(evt, handler, { passive: true }));
  }

  /**
   * 게스트 로그인
   */
  public async loginAsGuest(): Promise<UserProfile> {
    if (isFirebaseConfigured && auth && db) {
      const cred = await signInAnonymously(auth);
      const uid = cred.user.uid;
      const userDocRef = doc(db, 'users', uid);
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        this.currentUser = data;
      } else {
        const newUser: UserProfile = {
          uid,
          nickname: '',
          provider: 'guest',
          email: null,
          phoneE164: null,
          selectedCharacterSlot: 1,
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
        };
        await setDoc(userDocRef, newUser);
        this.currentUser = newUser;
      }
    } else {
      // 로컬 게스트 모드
      let localUser = getLocalUser();
      if (!localUser) {
        localUser = {
          uid: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          nickname: '',
          provider: 'guest',
          email: null,
          phoneE164: null,
          selectedCharacterSlot: 1,
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
        };
        saveLocalUser(localUser);
      }
      this.currentUser = localUser;
    }
    return this.currentUser;
  }

  /**
   * Google 로그인
   */
  public async loginWithGoogle(): Promise<UserProfile> {
    if (!isFirebaseConfigured || !auth || !db) {
      return this.loginAsGuest();
    }
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const uid = cred.user.uid;
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      data.lastLoginAt = Date.now();
      await updateDoc(userDocRef, { lastLoginAt: data.lastLoginAt });
      this.currentUser = data;
    } else {
      const newUser: UserProfile = {
        uid,
        nickname: cred.user.displayName?.slice(0, 12) || '',
        provider: 'google',
        email: cred.user.email || null,
        phoneE164: null,
        selectedCharacterSlot: 1,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      };
      await setDoc(userDocRef, newUser);
      this.currentUser = newUser;
    }
    return this.currentUser;
  }

  /**
   * 이메일 회원가입/로그인
   */
  public async loginWithEmail(email: string, pass: string, isSignUp: boolean): Promise<UserProfile> {
    if (!isFirebaseConfigured || !auth || !db) {
      // 로컬 폴백
      const user = await this.loginAsGuest();
      user.email = email;
      user.provider = 'email';
      saveLocalUser(user);
      return user;
    }

    let cred;
    if (isSignUp) {
      cred = await createUserWithEmailAndPassword(auth, email, pass);
    } else {
      cred = await signInWithEmailAndPassword(auth, email, pass);
    }

    const uid = cred.user.uid;
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      this.currentUser = snap.data() as UserProfile;
    } else {
      const newUser: UserProfile = {
        uid,
        nickname: '',
        provider: 'email',
        email,
        phoneE164: null,
        selectedCharacterSlot: 1,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      };
      await setDoc(userDocRef, newUser);
      this.currentUser = newUser;
    }
    return this.currentUser;
  }

  /**
   * 전화번호 로그인: {e164}@phone.claypop.invalid 형태
   */
  public async loginWithPhone(e164: string, pass: string): Promise<UserProfile> {
    const virtualEmail = `${e164.replace(/[^0-9+]/g, '')}@phone.claypop.invalid`;
    if (!isFirebaseConfigured || !auth || !db) {
      const user = await this.loginAsGuest();
      user.phoneE164 = e164;
      user.provider = 'phone';
      saveLocalUser(user);
      return user;
    }

    let cred;
    try {
      cred = await signInWithEmailAndPassword(auth, virtualEmail, pass);
    } catch {
      // 신규 등록
      cred = await createUserWithEmailAndPassword(auth, virtualEmail, pass);
    }

    const uid = cred.user.uid;
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      this.currentUser = snap.data() as UserProfile;
    } else {
      const newUser: UserProfile = {
        uid,
        nickname: '',
        provider: 'phone',
        email: null,
        phoneE164: e164,
        selectedCharacterSlot: 1,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      };
      await setDoc(userDocRef, newUser);
      this.currentUser = newUser;
    }
    return this.currentUser;
  }

  /**
   * 별명 설정 및 저장 (2~12자)
   */
  public async setNickname(nickname: string): Promise<void> {
    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 12) {
      throw new Error('Nickname length invalid');
    }
    if (this.currentUser) {
      this.currentUser.nickname = trimmed;
      if (isFirebaseConfigured && db && auth?.currentUser) {
        await updateDoc(doc(db, 'users', this.currentUser.uid), { nickname: trimmed });
      } else {
        saveLocalUser(this.currentUser);
      }
    }
  }

  /**
   * 로그아웃
   */
  public async logout(): Promise<void> {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    }
    this.currentUser = null;
    removeLocalUser();
  }

  /**
   * 계정 탈퇴 (Auth 삭제, users 삭제, privateProfiles 삭제, sessions 익명화)
   */
  public async deleteAccount(): Promise<void> {
    if (isFirebaseConfigured && auth && db && auth.currentUser) {
      const uid = auth.currentUser.uid;
      // 1. users 문서 삭제
      await deleteDoc(doc(db, 'users', uid)).catch(() => {});
      // 2. privateProfiles 삭제
      await deleteDoc(doc(db, 'privateProfiles', uid)).catch(() => {});
      // 3. sessions 컬렉션에서 해당 uid의 세션 uid 및 nickname 비우기
      try {
        const q = query(collection(db, 'sessions'), where('uid', '==', uid));
        const snaps = await getDocs(q);
        for (const s of snaps.docs) {
          await updateDoc(s.ref, { uid: '', nickname: '' });
        }
      } catch {
        // sessions 비우기 예외 무시
      }
      // 4. Auth 사용자 삭제
      await deleteUser(auth.currentUser);
    }
    this.currentUser = null;
    removeLocalUser();
  }

  /**
   * 세션 기록 저장 및 상한선 검증
   */
  public async recordSession(session: SessionRecord): Promise<void> {
    const theoreticalMax = getTheoreticalMax(session.duration);
    // theoreticalMax 또는 999999 초과 시 상한값으로 캡
    const cappedScore = Math.min(session.score, Math.min(theoreticalMax, 999999));
    session.score = cappedScore;

    if (isFirebaseConfigured && db) {
      try {
        const sessionRef = doc(collection(db, 'sessions'));
        session.sessionId = sessionRef.id;
        await setDoc(sessionRef, session);
      } catch (err) {
        console.warn('Failed to save session to Firestore, saving locally:', err);
        saveLocalSession(session);
      }
    } else {
      saveLocalSession(session);
    }
  }

  /**
   * TOP 20 랭킹 조회 (같은 duration, difficulty, missLimit, outcome == 'success')
   */
  public async getTop20Rankings(
    duration: number,
    difficulty: string,
    missLimit: number
  ): Promise<SessionRecord[]> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, 'sessions'),
          where('completed', '==', true),
          where('outcome', '==', 'success'),
          where('duration', '==', duration),
          where('difficulty', '==', difficulty),
          where('missLimit', '==', missLimit),
          orderBy('score', 'desc'),
          limit(20)
        );
        const snaps = await getDocs(q);
        return snaps.docs.map((d) => d.data() as SessionRecord);
      } catch (err) {
        console.warn('Firestore ranking query failed, falling back to local records:', err);
      }
    }

    // 로컬 랭킹 필터링
    const locals = getLocalSessions();
    return locals
      .filter(
        (s) =>
          s.completed &&
          s.outcome === 'success' &&
          s.duration === duration &&
          s.difficulty === difficulty &&
          s.missLimit === missLimit
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  }
}

export const userService = new UserService();
