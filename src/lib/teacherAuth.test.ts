import assert from "node:assert/strict";
import { test } from "node:test";
import { bearerToken, checkTeacher, isAllowedTeacher } from "./teacherAuth.ts";

test("허용한 이메일이고 인증된 계정이면 교사로 인정한다", () => {
  assert.equal(isAllowedTeacher({ email: "Teacher@Example.com", email_verified: true }, "teacher@example.com"), true);
});

test("다른 이메일이거나 인증되지 않은 계정은 거부한다", () => {
  assert.equal(isAllowedTeacher({ email: "other@example.com", email_verified: true }, "teacher@example.com"), false);
  assert.equal(isAllowedTeacher({ email: "teacher@example.com", email_verified: false }, "teacher@example.com"), false);
  assert.equal(isAllowedTeacher({ email: "teacher@example.com", email_verified: true }, ""), false);
});

test("Authorization 머리글에서 토큰만 꺼낸다", () => {
  assert.equal(bearerToken("Bearer abc.def"), "abc.def");
  assert.equal(bearerToken(null), null);
  assert.equal(bearerToken("abc.def"), null);
});

test("토큰이 없거나 가짜면 서버에서 거부한다", async () => {
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "demo-project";
  process.env.TEACHER_EMAIL = "teacher@example.com";

  const missing = await checkTeacher(null);
  assert.equal(missing.ok, false);
  assert.equal(!missing.ok && missing.status, 401);

  const fake = await checkTeacher("Bearer not-a-real-token");
  assert.equal(fake.ok, false);
  assert.equal(!fake.ok && fake.status, 401);
});
