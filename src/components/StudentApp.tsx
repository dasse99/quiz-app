"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { QuizApp } from "@/components/QuizApp";
import { MAX_NAME_LENGTH } from "@/lib/records";

export function StudentApp() {
  const [name, setName] = useState("");
  const [studentName, setStudentName] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  function enter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed === "") {
      setShowError(true);
      return;
    }
    setStudentName(trimmed);
  }

  return (
    <main className="page">
      <div className="top-bar">
        <span>{studentName === null ? "학생 화면" : `${studentName} 학생`}</span>
        <Link className="button small" href="/">
          처음 화면으로
        </Link>
      </div>

      {studentName === null ? (
        <section className="card">
          <h1>학생으로 시작하기</h1>
          <p className="lead">이름을 입력하고 시작하세요.</p>
          <form className="name-form" onSubmit={enter} noValidate>
            <label htmlFor="student-name">이름</label>
            <input
              id="student-name"
              className="text-input"
              type="text"
              value={name}
              maxLength={MAX_NAME_LENGTH}
              autoComplete="name"
              aria-invalid={showError}
              aria-describedby={showError ? "name-error" : undefined}
              onChange={(event) => {
                setName(event.target.value);
                setShowError(false);
              }}
            />
            {showError && (
              <p id="name-error" className="field-error" role="alert">
                이름을 입력해 주세요.
              </p>
            )}
            <button className="button primary" type="submit">
              시작하기
            </button>
          </form>
        </section>
      ) : (
        <QuizApp studentName={studentName} />
      )}
    </main>
  );
}
