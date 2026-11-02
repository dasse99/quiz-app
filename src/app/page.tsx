"use client";

import { useState } from "react";
import { ConfirmScreen } from "@/components/ConfirmScreen";
import { QuizScreen } from "@/components/QuizScreen";
import { ResultScreen } from "@/components/ResultScreen";
import { UploadScreen } from "@/components/UploadScreen";
import { gradeQuiz, type Question, type QuizResult } from "@/lib/quiz";

type Stage =
  | { name: "upload" }
  | { name: "confirm"; fileName: string; questions: Question[] }
  | { name: "quiz"; questions: Question[] }
  | { name: "result"; result: QuizResult };

export default function Home() {
  const [stage, setStage] = useState<Stage>({ name: "upload" });

  function moveTo(next: Stage) {
    setStage(next);
    window.scrollTo(0, 0);
  }

  return (
    <main className="page">
      {stage.name === "upload" && (
        <UploadScreen
          onLoaded={(fileName, questions) => moveTo({ name: "confirm", fileName, questions })}
        />
      )}
      {stage.name === "confirm" && (
        <ConfirmScreen
          fileName={stage.fileName}
          questionCount={stage.questions.length}
          onStart={() => moveTo({ name: "quiz", questions: stage.questions })}
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
        <ResultScreen result={stage.result} onRestart={() => moveTo({ name: "upload" })} />
      )}
    </main>
  );
}
