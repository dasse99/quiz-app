"use client";

import { useState } from "react";
import type { Answer } from "@/lib/quiz";
import type { PublicQuestion } from "@/lib/records";

type Props = {
  questions: PublicQuestion[];
  onFinish: (answers: number[]) => void;
};

export function QuizScreen({ questions, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>(() => questions.map(() => null));

  const current = questions[index];
  const selected = answers[index];
  const isLast = index === questions.length - 1;

  function choose(option: number) {
    setAnswers(answers.map((answer, i) => (i === index ? option : answer)));
  }

  function moveBy(step: number) {
    setIndex(index + step);
    window.scrollTo(0, 0);
  }

  function finish() {
    const completed = answers.filter((answer) => answer !== null);
    if (completed.length === questions.length) onFinish(completed);
  }

  return (
    <section className="card">
      <p className="progress">
        {index + 1} / {questions.length}
      </p>
      <fieldset className="question">
        <legend>{current.question}</legend>
        {current.options.map((option, optionIndex) => {
          const number = optionIndex + 1;
          const isSelected = selected === number;
          return (
            <label key={number} className={isSelected ? "option selected" : "option"}>
              <input
                type="radio"
                name={`question-${index}`}
                checked={isSelected}
                onChange={() => choose(number)}
              />
              <span className="option-number">{number}</span>
              <span>{option}</span>
            </label>
          );
        })}
      </fieldset>

      <div className="actions">
        <button
          className="button"
          type="button"
          disabled={index === 0}
          onClick={() => moveBy(-1)}
        >
          이전
        </button>
        {isLast ? (
          <button
            className="button primary"
            type="button"
            disabled={answers.includes(null)}
            onClick={finish}
          >
            채점하기
          </button>
        ) : (
          <button
            className="button primary"
            type="button"
            disabled={selected === null}
            onClick={() => moveBy(1)}
          >
            다음
          </button>
        )}
      </div>
    </section>
  );
}
