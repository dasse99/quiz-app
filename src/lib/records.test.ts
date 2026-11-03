import assert from "node:assert/strict";
import { test } from "node:test";
import { gradeQuiz, type Question } from "./quiz.ts";
import {
  averageScore,
  isValidAnswers,
  isValidPaperId,
  nameKey,
  paperContent,
  titleKey,
  toPublicQuestions,
  wrongQuestionNumbers,
} from "./records.ts";

const question: Question = {
  question: "1 + 1은?",
  options: ["1", "2", "3", "4"],
  correctAnswer: 2,
  explanation: "1 + 1 = 2입니다.",
};

test("학생에게 보내는 문항에는 정답과 해설이 없다", () => {
  const [item] = toPublicQuestions([question]);
  assert.deepEqual(item, { question: "1 + 1은?", options: ["1", "2", "3", "4"] });
  assert.equal("correctAnswer" in item, false);
  assert.equal("explanation" in item, false);
});

test("이름은 앞뒤·겹친 빈칸과 영문 대소문자를 무시하고 같은 학생으로 본다", () => {
  assert.equal(nameKey("  김 철수 "), nameKey("김  철수"));
  assert.equal(nameKey("Kim"), nameKey("kim"));
  assert.notEqual(nameKey("김철수"), nameKey("김영희"));
});

test("제목과 내용의 빈칸 차이만 있으면 같은 문제지로 본다", () => {
  assert.equal(titleKey(" 정보  시험 "), titleKey("정보 시험"));
  const a = paperContent({ title: "정보 시험", questions: [question] });
  const b = paperContent({ title: " 정보 시험", questions: [{ ...question, question: "1 + 1은? " }] });
  const c = paperContent({ title: "정보 시험", questions: [{ ...question, correctAnswer: 3 }] });
  assert.equal(a, b);
  assert.notEqual(a, c);
});

test("답은 문항 수만큼 1~4의 정수여야 한다", () => {
  assert.equal(isValidAnswers([1, 4], 2), true);
  assert.equal(isValidAnswers([1], 2), false);
  assert.equal(isValidAnswers([1, 5], 2), false);
  assert.equal(isValidAnswers([1, 1.5], 2), false);
  assert.equal(isValidAnswers("1,2", 2), false);
});

test("틀린 문제 번호와 평균 점수를 계산한다", () => {
  const result = gradeQuiz([question, question, question], [2, 1, 3]);
  assert.deepEqual(wrongQuestionNumbers(result), [2, 3]);
  assert.equal(averageScore([{ score: 100 }, { score: 33.3 }, { score: 50 }]), 61.1);
  assert.equal(averageScore([]), null);
});

test("문제지 번호에는 글자·숫자·_·-만 허용한다", () => {
  assert.equal(isValidPaperId("abc123_-"), true);
  assert.equal(isValidPaperId("../results"), false);
  assert.equal(isValidPaperId(""), false);
});
