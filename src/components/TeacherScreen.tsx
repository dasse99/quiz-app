"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type Auth,
} from "firebase/auth";
import { TeacherDashboard } from "@/components/TeacherDashboard";
import { getFirebaseAuth } from "@/lib/firebaseClient";

type Status =
  | { name: "loading" }
  | { name: "no-config" }
  | { name: "signed-out"; message?: string }
  | { name: "checking" }
  | { name: "allowed"; email: string }
  | { name: "denied"; email: string; message: string };

export function TeacherScreen() {
  const [status, setStatus] = useState<Status>({ name: "loading" });
  const [auth, setAuth] = useState<Auth | null>(null);

  // Firebase는 브라우저에서만 켭니다.
  useEffect(() => {
    const firebaseAuth = getFirebaseAuth();
    if (firebaseAuth === null) {
      setStatus({ name: "no-config" });
      return;
    }
    setAuth(firebaseAuth);
    return onAuthStateChanged(firebaseAuth, async (user) => {
      if (user === null) {
        setStatus((current) => (current.name === "signed-out" ? current : { name: "signed-out" }));
        return;
      }
      setStatus({ name: "checking" });
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/teacher/me", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const body = (await response.json()) as { email?: string; message?: string };
        if (response.ok && body.email) {
          setStatus({ name: "allowed", email: body.email });
        } else {
          setStatus({
            name: "denied",
            email: user.email ?? "",
            message: body.message ?? "교사로 허용되지 않은 계정입니다.",
          });
        }
      } catch {
        setStatus({
          name: "denied",
          email: user.email ?? "",
          message: "로그인 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        });
      }
    });
  }, []);

  async function signIn() {
    if (auth === null) return;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
      setStatus({
        name: "signed-out",
        message:
          code === "auth/popup-blocked"
            ? "로그인 창이 막혔습니다. 브라우저에서 팝업을 허용한 뒤 다시 눌러 주세요."
            : "로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      });
    }
  }

  async function logOut() {
    if (auth !== null) await signOut(auth);
    setStatus({ name: "signed-out" });
  }

  const getToken = useCallback(async () => {
    const user = auth?.currentUser;
    if (!user) throw new Error("로그인이 필요합니다.");
    return user.getIdToken();
  }, [auth]);

  const signedIn = status.name === "allowed" || status.name === "denied";

  return (
    <main className="page">
      <div className="top-bar">
        <span>{status.name === "allowed" ? status.email : "교사 화면"}</span>
        <div className="top-actions">
          {signedIn && (
            <button className="button small" type="button" onClick={logOut}>
              로그아웃
            </button>
          )}
          <Link className="button small" href="/">
            처음 화면으로
          </Link>
        </div>
      </div>

      <section className="card">
        <h1>교사 화면</h1>

        {(status.name === "loading" || status.name === "checking") && (
          <p className="lead">로그인 상태를 확인하고 있습니다.</p>
        )}

        {status.name === "no-config" && (
          <div className="error-box" role="alert">
            <h2>교사 로그인 준비가 아직 끝나지 않았습니다</h2>
            <p>Firebase 설정값을 .env.local 파일에 넣은 뒤 앱을 다시 켜 주세요.</p>
          </div>
        )}

        {status.name === "signed-out" && (
          <>
            <p className="lead">교사로 허용된 Google 계정으로 로그인하세요.</p>
            {status.message && (
              <p className="field-error" role="alert">
                {status.message}
              </p>
            )}
            <button className="button primary wide" type="button" onClick={signIn}>
              Google로 로그인
            </button>
          </>
        )}

        {status.name === "denied" && (
          <div className="error-box" role="alert">
            <h2>{status.message}</h2>
            {status.email && <p>로그인한 계정: {status.email}</p>}
            <p>로그아웃한 뒤 교사로 허용된 계정으로 다시 로그인해 주세요.</p>
          </div>
        )}

        {status.name === "allowed" && (
          <>
            <p className="lead">문제를 등록하고 학생들의 풀이 결과를 확인하는 곳입니다.</p>
            <TeacherDashboard getToken={getToken} />
          </>
        )}
      </section>
    </main>
  );
}
