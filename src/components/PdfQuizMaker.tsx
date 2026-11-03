"use client";

import { useState, type ChangeEvent } from "react";
import type { Paper } from "@/lib/quiz";

// 교안의 교육용 입력 기준 (서버에서도 같은 기준으로 다시 검사합니다)
const MAX_PDF_BYTES = 524_288;

type ApiResult = { ok: boolean; body: { message?: string; errors?: string[] } & Record<string, unknown> };

type Props = {
  request: (url: string, init?: RequestInit) => Promise<ApiResult>;
  onSaved: (title: string) => Promise<void>;
};

type Stage =
  | { name: "pick"; file: File | null; error: string | null }
  | { name: "generating"; file: File }
  | { name: "failed"; file: File; message: string; errors: string[] }
  | {
      name: "review";
      file: File;
      paper: Paper;
      textLength: number;
      duplicateTitle: boolean;
      saving: boolean;
      saveError: string | null;
    };

export function PdfQuizMaker({ request, onSaved }: Props) {
  const [stage, setStage] = useState<Stage>({ name: "pick", file: null, error: null });
  const [inputKey, setInputKey] = useState(0);

  function backToPick(error: string | null = null) {
    setStage({ name: "pick", file: null, error });
    setInputKey((key) => key + 1);
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (file === null) return setStage({ name: "pick", file: null, error: null });
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return backToPick("PDF 파일만 올릴 수 있습니다.");
    }
    if (file.size === 0) return backToPick("빈 파일입니다. 내용이 있는 PDF를 골라 주세요.");
    if (file.size > MAX_PDF_BYTES) {
      return backToPick(
        `파일이 ${Math.ceil(file.size / 1024).toLocaleString("ko-KR")}KB입니다. PDF는 512KB(524,288바이트) 이하만 올릴 수 있습니다.`,
      );
    }
    setStage({ name: "pick", file, error: null });
  }

  async function generate(file: File) {
    setStage({ name: "generating", file });
    try {
      const { ok, body } = await request("/api/teacher/generate", {
        method: "POST",
        headers: { "Content-Type": "application/pdf" },
        body: file,
      });
      if (!ok) {
        setStage({
          name: "failed",
          file,
          message: body.message ?? "문제를 만들지 못했습니다.",
          errors: body.errors ?? [],
        });
        return;
      }
      setStage({
        name: "review",
        file,
        paper: body.paper as Paper,
        textLength: body.textLength as number,
        duplicateTitle: body.duplicateTitle === true,
        saving: false,
        saveError: null,
      });
    } catch {
      setStage({
        name: "failed",
        file,
        message: "서버에 연결하지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.",
        errors: [],
      });
    }
  }

  async function save() {
    if (stage.name !== "review" || stage.saving) return;
    setStage({ ...stage, saving: true, saveError: null });
    try {
      const { ok, body } = await request("/api/teacher/papers?source=ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stage.paper),
      });
      if (!ok) {
        const detail = body.errors?.length ? ` (${body.errors.join(" / ")})` : "";
        setStage({ ...stage, saving: false, saveError: `${body.message ?? "저장하지 못했습니다."}${detail}` });
        return;
      }
      backToPick();
      await onSaved(stage.paper.title);
    } catch {
      setStage({ ...stage, saving: false, saveError: "저장하지 못했습니다. 잠시 후 다시 시도해 주세요." });
    }
  }

  return (
    <div className="teacher-section">
      <h2>PDF로 문제 만들기</h2>
      <p>
        학습자료 PDF를 올리면 AI가 문제지 제목과 4지선다 10문항을 만듭니다. 글자를 선택·복사할 수 있는 PDF만 되고,
        파일은 512KB 이하, 본문은 12,000자 이하여야 합니다.
      </p>

      {stage.name === "pick" && (
        <>
          <input
            key={inputKey}
            className="file-input"
            type="file"
            accept=".pdf,application/pdf"
            aria-label="학습자료 PDF 고르기"
            onChange={chooseFile}
          />
          {stage.error && (
            <p className="field-error" role="alert">
              {stage.error}
            </p>
          )}
          {stage.file && (
            <button className="button primary wide retry" type="button" onClick={() => generate(stage.file!)}>
              문제 만들기
            </button>
          )}
        </>
      )}

      {stage.name === "generating" && (
        <p className="notice" role="status">
          &apos;{stage.file.name}&apos;로 문제를 만들고 있습니다. 1분 넘게 걸릴 수 있어요. 이 화면을 닫지 마세요.
        </p>
      )}

      {stage.name === "failed" && (
        <div className="error-box" role="alert">
          <h3>문제를 만들지 못했습니다</h3>
          <p>{stage.message}</p>
          {stage.errors.length > 0 && (
            <ul>
              {stage.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
          <div className="actions">
            <button className="button" type="button" onClick={() => backToPick()}>
              다른 PDF 고르기
            </button>
            <button className="button primary" type="button" onClick={() => generate(stage.file)}>
              다시 시도
            </button>
          </div>
        </div>
      )}

      {stage.name === "review" && (
        <div className="preview">
          <p className="notice">
            AI가 만든 문제입니다. 내용이 PDF와 맞는지, 정답과 해설이 옳은지 꼭 직접 확인해 주세요.
          </p>
          <p className="preview-title">{stage.paper.title}</p>
          <p className="paper-meta">
            {stage.file.name} · 본문 {stage.textLength.toLocaleString("ko-KR")}자 · {stage.paper.questions.length}문항
          </p>
          <ol className="generated-list">
            {stage.paper.questions.map((item, index) => (
              <li key={index}>
                <p className="generated-question">{item.question}</p>
                <ol className="generated-options">
                  {item.options.map((option, optionIndex) => (
                    <li key={optionIndex} className={optionIndex + 1 === item.correctAnswer ? "is-answer" : undefined}>
                      {option}
                      {optionIndex + 1 === item.correctAnswer && <strong> (정답)</strong>}
                    </li>
                  ))}
                </ol>
                <p className="generated-explanation">해설: {item.explanation}</p>
              </li>
            ))}
          </ol>
          {stage.duplicateTitle && (
            <p className="field-error" role="alert">
              같은 제목의 문제지가 이미 있어 저장할 수 없습니다. 취소한 뒤 다시 만들어 주세요.
            </p>
          )}
          {stage.saveError && (
            <p className="field-error" role="alert">
              {stage.saveError}
            </p>
          )}
          <div className="actions">
            <button className="button" type="button" onClick={() => backToPick()} disabled={stage.saving}>
              취소
            </button>
            <button
              className="button primary"
              type="button"
              onClick={save}
              disabled={stage.saving || stage.duplicateTitle}
            >
              {stage.saving ? "저장하는 중" : "저장하고 공개하기"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
