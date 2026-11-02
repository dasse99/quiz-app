import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { loadPapers } from "./papers.ts";

const question = {
  question: "문제",
  options: ["가", "나", "다", "라"],
  correctAnswer: 2,
  explanation: "해설",
};

let directory: string;

before(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "papers-test-"));
  await writeFile(path.join(directory, "b.json"), JSON.stringify({ title: "둘째", questions: [question] }));
  await writeFile(path.join(directory, "a.json"), JSON.stringify({ title: "첫째", questions: [question] }));
  await writeFile(path.join(directory, "no-title.json"), JSON.stringify({ questions: [question] }));
  await writeFile(path.join(directory, "broken.json"), "문제지 아님");
  await writeFile(path.join(directory, "note.txt"), "무시할 파일");
});

after(async () => {
  await rm(directory, { recursive: true, force: true });
});

test("JSON 문제지의 제목을 파일 이름 순서로 읽는다", async () => {
  const { papers } = await loadPapers(directory);
  assert.deepEqual(papers.map((paper) => [paper.fileName, paper.title]), [["a.json", "첫째"], ["b.json", "둘째"]]);
});

test("잘못된 문제지는 목록에서 빼고 이유를 따로 알려준다", async () => {
  const { invalidPapers } = await loadPapers(directory);
  assert.deepEqual(invalidPapers.map((paper) => paper.fileName), ["broken.json", "no-title.json"]);
  assert.match(invalidPapers[1].errors[0], /제목\(title\)/);
});

test("실제 문제지 폴더를 읽는다", async () => {
  const { papers, invalidPapers } = await loadPapers();
  assert.deepEqual(invalidPapers, []);
  const sample = papers.find((paper) => paper.fileName === "sample-questions.json");
  assert.equal(sample?.title, "중학교 정보과목");
  assert.equal(sample?.questions.length, 10);
});
