import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDikamnG3FNfvF_6oh11gCCsEypFE4nUUA",
  authDomain: "claypop-c5eaf.firebaseapp.com",
  projectId: "claypop-c5eaf",
  storageBucket: "claypop-c5eaf.firebasestorage.app",
  messagingSenderId: "978133657237",
  appId: "1:978133657237:web:4ffc85537d3fe0a2b39d9c",
  measurementId: "G-J1LDK6B95K"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testFirebaseDB() {
  console.log("🔥 [1/4] Firebase 초기화 및 익명 인증 진행 중...");
  try {
    const cred = await signInAnonymously(auth);
    const uid = cred.user.uid;
    console.log(`✅ 인증 성공 (UID: ${uid})`);

    const testDocRef = doc(db, "system_health_checks", `test_${Date.now()}`);
    const testData = {
      message: "Firestore DB 저장/열람/삭제 정상 작동 테스트",
      testedBy: uid,
      timestamp: Date.now(),
      status: "ok"
    };

    // 1. DB 저장 (Create / Set)
    console.log("🔥 [2/4] DB 문서 저장 (setDoc) 시도...");
    await setDoc(testDocRef, testData);
    console.log("✅ DB 문서 저장 성공!");

    // 2. DB 열람 (Read / Get)
    console.log("🔥 [3/4] DB 문서 열람 (getDoc) 시도...");
    const snap = await getDoc(testDocRef);
    if (snap.exists()) {
      console.log("✅ DB 문서 열람 성공! 저장된 데이터:", snap.data());
    } else {
      throw new Error("문서를 찾을 수 없습니다.");
    }

    // 3. DB 삭제 (Delete)
    console.log("🔥 [4/4] DB 문서 삭제 (deleteDoc) 시도...");
    await deleteDoc(testDocRef);
    const verifySnap = await getDoc(testDocRef);
    if (!verifySnap.exists()) {
      console.log("✅ DB 문서 삭제 성공 (데이터 정리 완료)!");
    } else {
      throw new Error("문서 삭제 검증 실패!");
    }

    console.log("\n🎉 >>> 모든 Firebase DB (저장/열람/삭제) 기능이 정상 작동하고 있습니다! <<<");
    process.exit(0);
  } catch (err) {
    console.error("❌ Firebase DB 테스트 실패:", err);
    process.exit(1);
  }
}

testFirebaseDB();
