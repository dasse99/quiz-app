"use client";

import { useState, type ChangeEvent } from "react";
import { parseQuizFile, type Question } from "@/lib/quiz";

type Props = {
  onLoaded: (fileName: string, questions: Question[]) => void;
};

export function UploadScreen({ onLoaded }: Props) {
  const [errors, setErrors] = useState<string[]>([]);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    let text: string;
    try {
      text = await file.text();
    } catch {
      setErrors(["파일을 열 수 없습니다. 파일을 다시 선택해 주세요."]);
      return;
    } finally {
      // 같은 파일을 고쳐서 다시 골라도 알아챌 수 있게 선택을 비웁니다.
      input.value = "";
    }

    const parsed = parseQuizFile(text);
    if (parsed.ok) {
      onLoaded(file.name, parsed.questions);
    } else {
      setErrors(parsed.errors);
    }
  }

  return (
    <section className="card">
      <h1>문제풀이</h1>
      <p className="lead">선생님께 받은 문제 파일(.json)을 올리면 문제를 풀 수 있습니다.</p>

      <label className="button primary file-button">
        문제 파일 선택
        <input
          className="file-input"
          type="file"
          accept=".json,application/json"
          onChange={handleFile}
        />
      </label>

      {errors.length > 0 && (
        <div className="error-box" role="alert">
          <h2>이 파일로는 문제를 풀 수 없습니다</h2>
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
          <p>파일을 고친 뒤 다시 선택해 주세요.</p>
        </div>
      )}
    </section>
  );
}
