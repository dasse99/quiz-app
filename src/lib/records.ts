import type { Paper, Question, QuizResult } from "./quiz.ts";

// 학생에게 보내는 문항입니다. 정답과 해설은 빠져 있습니다.
export type PublicQuestion = Pick<Question, "question" | "options">;

export type PaperSummary = {
  id: string;
  title: string;
  questionCount: number;
};

export type TeacherPaper = PaperSummary & {
  published: boolean;
  createdAt: string | null;
};

export type ResultRow = {
  studentName: string;
  score: number;
  correctCount: number;
  total: number;
  wrongQuestions: number[];
  submittedAt: string | null;
};

export const MAX_NAME_LENGTH = 30;

const PAPER_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

function squeeze(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

export function isValidPaperId(id: string): boolean {
  return PAPER_ID_PATTERN.test(id);
}

export function cleanName(name: string): string {
  return squeeze(name);
}

// 같은 학생인지 판단하는 기준: 앞뒤·겹친 빈칸 무시, 영문 대소문자 무시
export function nameKey(name: string): string {
  return squeeze(name).toLowerCase();
}

export function titleKey(title: string): string {
  return squeeze(title).toLowerCase();
}

// 내용이 같은 문제지인지 비교할 때 쓰는 글자열입니다.
export function paperContent(paper: Paper): string {
  return JSON.stringify({
    title: squeeze(paper.title),
    questions: paper.questions.map((item) => ({
      question: squeeze(item.question),
      options: item.options.map(squeeze),
      correctAnswer: item.correctAnswer,
      explanation: squeeze(item.explanation),
    })),
  });
}

export function toPublicQuestions(questions: Question[]): PublicQuestion[] {
  return questions.map(({ question, options }) => ({ question, options }));
}

export function isValidAnswers(answers: unknown, count: number): answers is number[] {
  return (
    Array.isArray(answers) &&
    answers.length === count &&
    answers.every((answer) => Number.isInteger(answer) && answer >= 1 && answer <= 4)
  );
}

export function wrongQuestionNumbers(result: QuizResult): number[] {
  return result.results.flatMap((item, index) => (item.isCorrect ? [] : [index + 1]));
}

export function averageScore(rows: Pick<ResultRow, "score">[]): number | null {
  if (rows.length === 0) return null;
  const sum = rows.reduce((total, row) => total + row.score, 0);
  return Math.round((sum / rows.length) * 10) / 10;
}
