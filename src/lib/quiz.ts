export type Question = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

export type Paper = {
  title: string;
  questions: Question[];
};

// 사용자가 고른 보기 번호(1~4). 아직 고르지 않았으면 null
export type Answer = number | null;

export type ParseResult =
  | ({ ok: true } & Paper)
  | { ok: false; errors: string[] };

export type QuestionResult = {
  question: Question;
  selected: number;
  isCorrect: boolean;
};

export type QuizResult = {
  correctCount: number;
  total: number;
  score: number;
  results: QuestionResult[];
};

const OPTION_COUNT = 4;

function isFilledText(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function findQuestionErrors(item: unknown, label: string): string[] {
  if (typeof item !== "object" || item === null || Array.isArray(item)) {
    return [`${label}: 문항 내용을 읽을 수 없습니다.`];
  }

  const { question, options, correctAnswer, explanation } = item as Record<string, unknown>;
  const errors: string[] = [];

  if (!isFilledText(question)) {
    errors.push(`${label}: 문제 내용(question)이 없습니다.`);
  }

  if (!Array.isArray(options)) {
    errors.push(`${label}: 보기 목록(options)이 없습니다.`);
  } else if (options.length !== OPTION_COUNT) {
    errors.push(`${label}: 보기가 ${options.length}개입니다. 보기는 ${OPTION_COUNT}개여야 합니다.`);
  } else {
    options.forEach((option, index) => {
      if (!isFilledText(option)) {
        errors.push(`${label}: ${index + 1}번 보기의 내용이 없습니다.`);
      }
    });
  }

  if (
    typeof correctAnswer !== "number" ||
    !Number.isInteger(correctAnswer) ||
    correctAnswer < 1 ||
    correctAnswer > OPTION_COUNT
  ) {
    const shown = correctAnswer === undefined ? "없습니다" : `${JSON.stringify(correctAnswer)}입니다`;
    errors.push(`${label}: 정답 번호(correctAnswer)가 ${shown}. 정답 번호는 1부터 ${OPTION_COUNT}까지의 숫자여야 합니다.`);
  }

  if (!isFilledText(explanation)) {
    errors.push(`${label}: 해설(explanation)이 없습니다.`);
  }

  return errors;
}

export function parsePaperFile(text: string): ParseResult {
  // 메모장으로 저장한 파일은 맨 앞에 보이지 않는 문자가 붙을 수 있습니다.
  const content = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch {
    return {
      ok: false,
      errors: ["파일을 읽을 수 없습니다. 쉼표나 따옴표가 빠지지 않았는지 확인해 주세요."],
    };
  }

  const { title, questions } = (data ?? {}) as { title?: unknown; questions?: unknown };
  const errors: string[] = [];

  if (!isFilledText(title)) {
    errors.push("문제지 제목(title)이 없습니다.");
  }

  if (!Array.isArray(questions)) {
    errors.push("파일에서 문제 목록(questions)을 찾을 수 없습니다.");
  } else if (questions.length === 0) {
    errors.push("파일에 문제가 하나도 없습니다.");
  } else {
    errors.push(...questions.flatMap((item, index) => findQuestionErrors(item, `${index + 1}번 문항`)));
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, title: title as string, questions: questions as Question[] };
}

export function gradeQuiz(questions: Question[], answers: number[]): QuizResult {
  const results = questions.map((question, index) => {
    const selected = answers[index];
    return { question, selected, isCorrect: selected === question.correctAnswer };
  });
  const correctCount = results.filter((result) => result.isCorrect).length;
  const total = questions.length;

  return {
    correctCount,
    total,
    score: Math.round((correctCount / total) * 1000) / 10,
    results,
  };
}
