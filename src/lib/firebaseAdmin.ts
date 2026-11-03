import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// 서버에서만 씁니다. 열쇠 내용은 코드에 넣지 않습니다.
// - 이 컴퓨터: .env.local의 GOOGLE_APPLICATION_CREDENTIALS(열쇠 파일 위치)
// - Vercel: 환경변수 FIREBASE_SERVICE_ACCOUNT_JSON(열쇠 파일 내용, 사용자가 직접 입력)
export function getDb(): Firestore {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const keyJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!projectId || (!keyJson && !process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    throw new Error("Firestore 서버 설정이 없습니다.");
  }
  const credential = keyJson ? cert(JSON.parse(keyJson)) : applicationDefault();
  const app = getApps()[0] ?? initializeApp({ credential, projectId });
  return getFirestore(app);
}
