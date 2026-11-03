import { createHash } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getDb } from "./firebaseAdmin.ts";
import type { Paper, QuizResult } from "./quiz.ts";
import {
  cleanName,
  nameKey,
  paperContent,
  titleKey,
  wrongQuestionNumbers,
  type PaperSummary,
  type ResultRow,
  type TeacherPaper,
} from "./records.ts";

// Firestore 모음 이름
const PAPERS = "papers";
const RESULTS = "results";

type StoredPaper = Paper & {
  titleKey: string;
  published: boolean;
  createdBy: string;
  createdAt?: Timestamp;
};

type StoredResult = ResultRow & {
  paperId: string;
  paperTitle: string;
  nameKey: string;
  answers: number[];
};

export type CreatePaperResult =
  | { ok: true; paper: TeacherPaper }
  | { ok: false; reason: "same-content" | "same-title" };

function hash(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function toIso(value: unknown): string | null {
  return value instanceof Timestamp ? value.toDate().toISOString() : null;
}

export async function createPaper(paper: Paper, teacherEmail: string): Promise<CreatePaperResult> {
  const db = getDb();
  // 내용이 같으면 문서 번호도 같아서 중복을 바로 찾을 수 있습니다.
  const ref = db.collection(PAPERS).doc(hash(paperContent(paper)).slice(0, 24));
  const key = titleKey(paper.title);

  return db.runTransaction(async (transaction) => {
    const existing = await transaction.get(ref);
    if (existing.exists) return { ok: false, reason: "same-content" } as const;

    const sameTitle = await transaction.get(db.collection(PAPERS).where("titleKey", "==", key).limit(1));
    if (!sameTitle.empty) return { ok: false, reason: "same-title" } as const;

    const stored: StoredPaper = {
      title: paper.title.trim(),
      questions: paper.questions,
      titleKey: key,
      published: false,
      createdBy: teacherEmail,
    };
    transaction.create(ref, { ...stored, createdAt: FieldValue.serverTimestamp() });
    return {
      ok: true,
      paper: {
        id: ref.id,
        title: stored.title,
        questionCount: stored.questions.length,
        published: false,
        createdAt: new Date().toISOString(),
      },
    } as const;
  });
}

export async function listTeacherPapers(): Promise<TeacherPaper[]> {
  const snapshot = await getDb().collection(PAPERS).orderBy("createdAt", "desc").get();
  return snapshot.docs.map((doc) => {
    const data = doc.data() as StoredPaper;
    return {
      id: doc.id,
      title: data.title,
      questionCount: data.questions.length,
      published: data.published,
      createdAt: toIso(data.createdAt),
    };
  });
}

export async function setPublished(id: string, published: boolean): Promise<boolean> {
  const ref = getDb().collection(PAPERS).doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists) return false;
  await ref.update({ published });
  return true;
}

export async function listPublishedPapers(): Promise<PaperSummary[]> {
  const snapshot = await getDb().collection(PAPERS).where("published", "==", true).get();
  return snapshot.docs
    .map((doc) => {
      const data = doc.data() as StoredPaper;
      return { id: doc.id, title: data.title, questionCount: data.questions.length };
    })
    .sort((a, b) => a.title.localeCompare(b.title, "ko"));
}

export async function getPaper(id: string): Promise<(Paper & { published: boolean }) | null> {
  const snapshot = await getDb().collection(PAPERS).doc(id).get();
  if (!snapshot.exists) return null;
  const data = snapshot.data() as StoredPaper;
  return { title: data.title, questions: data.questions, published: data.published };
}

// 같은 문제지를 같은 이름으로 다시 풀면 같은 문서에 덮어써 최신 결과만 남깁니다.
export async function saveResult(
  paperId: string,
  paperTitle: string,
  studentName: string,
  answers: number[],
  result: QuizResult,
): Promise<void> {
  const key = nameKey(studentName);
  const stored: Omit<StoredResult, "submittedAt"> = {
    paperId,
    paperTitle,
    studentName: cleanName(studentName),
    nameKey: key,
    answers,
    score: result.score,
    correctCount: result.correctCount,
    total: result.total,
    wrongQuestions: wrongQuestionNumbers(result),
  };
  await getDb()
    .collection(RESULTS)
    .doc(`${paperId}_${hash(key).slice(0, 24)}`)
    .set({ ...stored, submittedAt: FieldValue.serverTimestamp() });
}

export async function listResults(paperId: string): Promise<ResultRow[]> {
  const snapshot = await getDb().collection(RESULTS).where("paperId", "==", paperId).get();
  return snapshot.docs
    .map((doc) => {
      const data = doc.data() as StoredResult;
      return {
        studentName: data.studentName,
        score: data.score,
        correctCount: data.correctCount,
        total: data.total,
        wrongQuestions: data.wrongQuestions,
        submittedAt: toIso(data.submittedAt),
      };
    })
    .sort((a, b) => a.studentName.localeCompare(b.studentName, "ko"));
}
