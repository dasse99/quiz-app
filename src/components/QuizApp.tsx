"use client";

import { useState } from "react";
import { PaperListScreen } from "@/components/PaperListScreen";
import { QuizScreen } from "@/components/QuizScreen";
import { ResultScreen } from "@/components/ResultScreen";
import type { InvalidPaper, PaperEntry } from "@/lib/papers";
import { gradeQuiz, type Question, type QuizResult } from "@/lib/quiz";

type Stage =
  | { name: "list" }
  | { name: "quiz"; questions: Question[] }
  | { name: "result"; result: QuizResult };

type Props = {
  papers: PaperEntry[];
  invalidPapers: InvalidPaper[];
};

export function QuizApp({ papers, invalidPapers }: Props) {
  const [stage, setStage] = useState<Stage>({ name: "list" });

  function moveTo(next: Stage) {
    setStage(next);
    window.scrollTo(0, 0);
  }

  return (
    <main className="page">
      {stage.name === "list" && (
        <PaperListScreen
          papers={papers}
          invalidPapers={invalidPapers}
          onSelect={(paper) => moveTo({ name: "quiz", questions: paper.questions })}
        />
      )}
      {stage.name === "quiz" && (
        <QuizScreen
          questions={stage.questions}
          onFinish={(answers) =>
            moveTo({ name: "result", result: gradeQuiz(stage.questions, answers) })
          }
        />
      )}
      {stage.name === "result" && (
        <ResultScreen result={stage.result} onRestart={() => moveTo({ name: "list" })} />
      )}
    </main>
  );
}
