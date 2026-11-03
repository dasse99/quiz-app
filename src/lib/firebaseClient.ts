import { getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

// 브라우저에서 쓰는 Firebase 웹 앱 설정값입니다. 비밀값이 아니며 .env.local에 적습니다.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function getFirebaseAuth(): Auth | null {
  if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) return null;
  const app = getApps()[0] ?? initializeApp(config);
  return getAuth(app);
}
