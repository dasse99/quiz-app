"use client";

import { useCallback, useEffect, useState } from "react";
import { PaperListScreen } from "@/components/PaperListScreen";
import { QuizScreen } from "@/components/QuizScreen";
import { ResultScreen } from "@/components/ResultScreen";
import type { QuizResult } from "@/lib/quiz";
import type { PaperSummary, PublicQuestion } from "@/lib/records";

type OpenPaper = { id: string; title: string; questions: PublicQuestion[] };

type Stage =
  | { name: "list" }
  | { name: "quiz"; paper: OpenPaper }
  | { name: "submit"; paper: OpenPaper; answers: number[]; error: string | null }
  | { name: "result"; result: QuizResult };

type Props = {
  studentName: string;
};

async function readMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? fallback;
  } catch {
    return fallback;
  }
}

export function QuizApp({ studentName }: Props) {
  const [stage, setStage] = useState<Stage>({ name: "list" });
  const [papers, setPapers] = useState<PaperSummary[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  function moveTo(next: Stage) {
    setStage(next);
    window.scrollTo(0, 0);
  }

  const loadList = useCallback(async () => {
    setPapers(null);
    setListError(null);
    try {
      const response = await fetch("/api/papers", { cache: "no-store" });
      if (!response.ok) throw new Error(await readMessage(response, "문제지 목록을 불러오지 못했습니다."));
      setPapers(((await response.json()) as { papers: PaperSummary[] }).papers);
    } catch (error) {
      setListError(error instanceof Error ? error.message : "문제지 목록을 불러오지 못했습니다.");
    }
  }, []);

  useEffect(() => {
    if (stage.name === "list") void loadList();
  }, [stage.name, loadList]);

  async function openPaper(summary: PaperSummary) {
    setListError(null);
    try {
      const response = await fetch(`/api/papers/${summary.id}`, { cache: "no-store" });
      if (!response.ok) throw new Error(await readMessage(response, "문제지를 열지 못했습니다."));
      moveTo({ name: "quiz", paper: (await response.json()) as OpenPaper });
    } catch (error) {
      setListError(error instanceof Error ? error.message : "문제지를 열지 못했습니다.");
    }
  }

  async function submit(paper: OpenPaper, answers: number[]) {
    moveTo({ name: "submit", paper, answers, error: null });
    try {
      const response = await fetch(`/api/papers/${paper.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: studentName, answers }),
      });
      if (!response.ok) {
        throw new Error(await readMessage(response, "결과를 저장하지 못했습니다. 다시 시도해 주세요."));
      }
      moveTo({ name: "result", result: ((await response.json()) as { result: QuizResult }).result });
    } catch (error) {
      const message =
        error instanceof TypeError
          ? "인터넷 연결을 확인한 뒤 다시 시도해 주세요."
          : error instanceof Error
            ? error.message
            : "결과를 저장하지 못했습니다. 다시 시도해 주세요.";
      setStage({ name: "submit", paper, answers, error: message });
    }
  }

  return (
    <>
      {stage.name === "list" && (
        <PaperListScreen papers={papers} error={listError} onSelect={openPaper} onRetry={loadList} />
      )}
      {stage.name === "quiz" && (
        <QuizScreen
          questions={stage.paper.questions}
          onFinish={(answers) => submit(stage.paper, answers)}
        />
      )}
      {stage.name === "submit" && (
        <section className="card">
          {stage.error === null ? (
            <p className="lead">채점하고 결과를 저장하고 있습니다.</p>
          ) : (
            <>
              <div className="error-box" role="alert">
                <h2>결과를 저장하지 못했습니다</h2>
                <p>{stage.error}</p>
                <p>고른 답은 그대로 남아 있습니다.</p>
              </div>
              <button
                className="button primary wide retry"
                type="button"
                onClick={() => submit(stage.paper, stage.answers)}
              >
                다시 시도
              </button>
            </>
          )}
        </section>
      )}
      {stage.name === "result" && (
        <ResultScreen result={stage.result} onRestart={() => moveTo({ name: "list" })} />
      )}
    </>
  );
}
