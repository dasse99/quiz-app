import assert from "node:assert/strict";
import { test } from "node:test";
import { gradeQuiz, parsePaperFile, type Question } from "./quiz.ts";

const valid: Question = {
  question: "문제",
  options: ["가", "나", "다", "라"],
  correctAnswer: 2,
  explanation: "해설",
};

function errorsOf(text: string): string[] {
  const parsed = parsePaperFile(text);
  assert.equal(parsed.ok, false);
  return parsed.ok ? [] : parsed.errors;
}

function withQuestion(change: Record<string, unknown>): string {
  return JSON.stringify({ title: "제목", questions: [valid, { ...valid, ...change }] });
}

test("올바른 파일은 제목과 모든 문항을 순서대로 읽는다", () => {
  const parsed = parsePaperFile(
    JSON.stringify({ title: "제목", questions: [valid, { ...valid, question: "둘째" }] }),
  );
  assert.equal(parsed.ok, true);
  assert.equal(parsed.ok && parsed.title, "제목");
  assert.deepEqual(parsed.ok && parsed.questions.map((q) => q.question), ["문제", "둘째"]);
});

test("파일 맨 앞의 보이지 않는 문자는 무시한다", () => {
  const bom = String.fromCharCode(0xfeff);
  assert.equal(parsePaperFile(bom + JSON.stringify({ title: "제목", questions: [valid] })).ok, true);
});

test("JSON이 아니면 거부한다", () => {
  assert.match(errorsOf("문제 아님")[0], /읽을 수 없습니다/);
});

test("제목이 없거나 비어 있으면 거부한다", () => {
  assert.deepEqual(errorsOf(JSON.stringify({ questions: [valid] })), ["문제지 제목(title)이 없습니다."]);
  assert.deepEqual(errorsOf(JSON.stringify({ title: " ", questions: [valid] })), ["문제지 제목(title)이 없습니다."]);
});

test("questions 목록이 없거나 비어 있으면 거부한다", () => {
  assert.match(errorsOf('{"title":"제목"}')[0], /찾을 수 없습니다/);
  assert.match(errorsOf("null")[1], /찾을 수 없습니다/);
  assert.match(errorsOf('{"title":"제목","questions":[]}')[0], /하나도 없습니다/);
});

test("보기가 4개가 아니면 몇 번 문항인지 알려준다", () => {
  assert.deepEqual(errorsOf(withQuestion({ options: ["가", "나", "다"] })), [
    "2번 문항: 보기가 3개입니다. 보기는 4개여야 합니다.",
  ]);
});

test("정답 번호가 1~4의 정수가 아니면 거부한다", () => {
  for (const correctAnswer of [0, 5, 1.5, "1"]) {
    assert.match(errorsOf(withQuestion({ correctAnswer }))[0], /^2번 문항: 정답 번호/);
  }
});

test("빠진 항목을 모두 알려준다", () => {
  const errors = errorsOf(JSON.stringify({ title: "제목", questions: [{}] }));
  assert.equal(errors.length, 4);
});

test("문제 하나라도 잘못되면 파일 전체를 거부한다", () => {
  assert.equal(parsePaperFile(withQuestion({ explanation: "" })).ok, false);
});

test("점수를 계산하고 소수 첫째 자리까지 반올림한다", () => {
  const questions = [valid, valid, valid];
  assert.equal(gradeQuiz(questions, [2, 1, 1]).score, 33.3);
  assert.equal(gradeQuiz(questions, [2, 2, 1]).score, 66.7);
  assert.equal(gradeQuiz(questions, [2, 2, 2]).score, 100);
  assert.equal(gradeQuiz(questions, [1, 1, 1]).score, 0);
});

test("문항별 정오와 고른 답을 돌려준다", () => {
  const graded = gradeQuiz([valid, { ...valid, correctAnswer: 4 }], [2, 3]);
  assert.equal(graded.correctCount, 1);
  assert.equal(graded.total, 2);
  assert.deepEqual(graded.results.map((r) => [r.selected, r.isCorrect]), [[2, true], [3, false]]);
});
