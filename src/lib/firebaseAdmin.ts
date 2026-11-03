import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// 서버에서만 씁니다. 열쇠 파일의 위치는 .env.local의 GOOGLE_APPLICATION_CREDENTIALS에 있고,
// 열쇠 내용은 코드에 넣지 않습니다.
export function getDb(): Firestore {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId || !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error("Firestore 서버 설정이 없습니다.");
  }
  const app = getApps()[0] ?? initializeApp({ credential: applicationDefault(), projectId });
  return getFirestore(app);
}
