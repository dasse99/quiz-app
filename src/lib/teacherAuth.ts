import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

// Firebase가 로그인 확인증(ID 토큰)에 서명할 때 쓰는 공개 열쇠 목록입니다.
const firebaseKeys = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

export type TeacherCheck =
  | { ok: true; email: string }
  | { ok: false; status: 401 | 403 | 500; message: string };

export function isAllowedTeacher(payload: JWTPayload, allowedEmail: string): boolean {
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const allowed = allowedEmail.trim().toLowerCase();
  return allowed !== "" && payload.email_verified === true && email === allowed;
}

export function bearerToken(authorization: string | null): string | null {
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);
  return match ? match[1] : null;
}

export async function checkTeacher(authorization: string | null): Promise<TeacherCheck> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "";
  const allowedEmail = process.env.TEACHER_EMAIL ?? "";
  if (projectId === "" || allowedEmail === "") {
    return { ok: false, status: 500, message: "교사 로그인 설정이 아직 끝나지 않았습니다." };
  }

  const token = bearerToken(authorization);
  if (token === null) {
    return { ok: false, status: 401, message: "로그인이 필요합니다." };
  }

  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(token, firebaseKeys, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    }));
  } catch {
    return { ok: false, status: 401, message: "로그인 정보를 확인할 수 없습니다. 다시 로그인해 주세요." };
  }

  if (!isAllowedTeacher(payload, allowedEmail)) {
    return { ok: false, status: 403, message: "교사로 허용되지 않은 계정입니다." };
  }
  return { ok: true, email: String(payload.email) };
}
