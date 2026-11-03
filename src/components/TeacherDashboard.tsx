"use client";

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { PdfQuizMaker } from "@/components/PdfQuizMaker";
import { parsePaperFile, type Paper } from "@/lib/quiz";
import type { ResultRow, TeacherPaper } from "@/lib/records";

type Props = {
  // 요청마다 새 로그인 확인증을 받아 서버에 보냅니다.
  getToken: () => Promise<string>;
};

type Upload =
  | { name: "empty" }
  | { name: "invalid"; fileName: string; errors: string[] }
  | { name: "ready"; fileName: string; paper: Paper; message: string | null; saving: boolean };

type Results = {
  paperId: string;
  rows: ResultRow[] | null;
  average: number | null;
  error: string | null;
};

type ApiBody = { message?: string; errors?: string[] };

function formatDate(value: string | null): string {
  if (value === null) return "-";
  return new Date(value).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" });
}

export function TeacherDashboard({ getToken }: Props) {
  const [upload, setUpload] = useState<Upload>({ name: "empty" });
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const [papers, setPapers] = useState<TeacherPaper[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [results, setResults] = useState<Results | null>(null);

  const request = useCallback(
    async (url: string, init: RequestInit = {}) => {
      const token = await getToken();
      const response = await fetch(url, {
        ...init,
        cache: "no-store",
        headers: { ...init.headers, Authorization: `Bearer ${token}` },
      });
      const body = (await response.json().catch(() => ({}))) as ApiBody & Record<string, unknown>;
      return { ok: response.ok, body };
    },
    [getToken],
  );

  const loadPapers = useCallback(async () => {
    setListError(null);
    try {
      const { ok, body } = await request("/api/teacher/papers");
      if (!ok) throw new Error(body.message ?? "문제지 목록을 불러오지 못했습니다.");
      setPapers(body.papers as TeacherPaper[]);
    } catch (error) {
      setListError(error instanceof Error ? error.message : "문제지 목록을 불러오지 못했습니다.");
    }
  }, [request]);

  useEffect(() => {
    void loadPapers();
  }, [loadPapers]);

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setUploadNotice(null);
    if (!file) return;
    const parsed = parsePaperFile(await file.text());
    if (parsed.ok) {
      setUpload({
        name: "ready",
        fileName: file.name,
        paper: { title: parsed.title, questions: parsed.questions },
        message: null,
        saving: false,
      });
    } else {
      setUpload({ name: "invalid", fileName: file.name, errors: parsed.errors });
    }
  }

  function clearUpload() {
    setUpload({ name: "empty" });
    setInputKey((key) => key + 1);
  }

  async function register() {
    if (upload.name !== "ready") return;
    setUpload({ ...upload, saving: true, message: null });
    try {
      const { ok, body } = await request("/api/teacher/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(upload.paper),
      });
      if (!ok) {
        const detail = body.errors?.length ? ` (${body.errors.join(" / ")})` : "";
        setUpload({ ...upload, saving: false, message: `${body.message ?? "등록하지 못했습니다."}${detail}` });
        return;
      }
      clearUpload();
      setUploadNotice(`'${upload.paper.title}' 문제지를 등록했습니다. 아래 목록에서 공개하면 학생에게 보입니다.`);
      await loadPapers();
    } catch {
      setUpload({ ...upload, saving: false, message: "등록하지 못했습니다. 잠시 후 다시 시도해 주세요." });
    }
  }

  async function togglePublished(paper: TeacherPaper) {
    setBusyId(paper.id);
    setListError(null);
    try {
      const { ok, body } = await request(`/api/teacher/papers/${paper.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !paper.published }),
      });
      if (!ok) throw new Error(body.message ?? "공개 상태를 바꾸지 못했습니다.");
      setPapers((current) =>
        current?.map((item) => (item.id === paper.id ? { ...item, published: !paper.published } : item)) ?? null,
      );
    } catch (error) {
      setListError(error instanceof Error ? error.message : "공개 상태를 바꾸지 못했습니다.");
    } finally {
      setBusyId(null);
    }
  }

  async function showResults(paperId: string) {
    setResults({ paperId, rows: null, average: null, error: null });
    try {
      const { ok, body } = await request(`/api/teacher/papers/${paperId}/results`);
      if (!ok) throw new Error(body.message ?? "결과를 불러오지 못했습니다.");
      setResults({
        paperId,
        rows: body.results as ResultRow[],
        average: body.average as number | null,
        error: null,
      });
    } catch (error) {
      setResults({
        paperId,
        rows: null,
        average: null,
        error: error instanceof Error ? error.message : "결과를 불러오지 못했습니다.",
      });
    }
  }

  const resultPaper = papers?.find((paper) => paper.id === results?.paperId);

  return (
    <>
      <div className="teacher-section">
        <h2>문제지 등록</h2>
        <p>문제지 JSON 파일을 고르면 내용을 먼저 보여드립니다. 확인한 뒤 등록하세요.</p>
        <input
          key={inputKey}
          className="file-input"
          type="file"
          accept=".json,application/json"
          aria-label="문제지 JSON 파일 고르기"
          onChange={chooseFile}
        />

        {uploadNotice && (
          <p className="notice" role="status">
            {uploadNotice}
          </p>
        )}

        {upload.name === "invalid" && (
          <div className="error-box" role="alert">
            <h3>{upload.fileName} 파일을 등록할 수 없습니다</h3>
            <ul>
              {upload.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
            <p>파일을 고친 뒤 다시 골라 주세요.</p>
          </div>
        )}

        {upload.name === "ready" && (
          <div className="preview">
            <p className="preview-title">{upload.paper.title}</p>
            <p className="paper-meta">
              {upload.fileName} · {upload.paper.questions.length}문항
            </p>
            <ol className="preview-list">
              {upload.paper.questions.map((item, index) => (
                <li key={index}>
                  {item.question}
                  <span className="paper-meta"> (정답 {item.correctAnswer}번)</span>
                </li>
              ))}
            </ol>
            {upload.message && (
              <p className="field-error" role="alert">
                {upload.message}
              </p>
            )}
            <div className="actions">
              <button className="button" type="button" onClick={clearUpload} disabled={upload.saving}>
                취소
              </button>
              <button className="button primary" type="button" onClick={register} disabled={upload.saving}>
                {upload.saving ? "등록하는 중" : "등록하기"}
              </button>
            </div>
          </div>
        )}
      </div>

      <PdfQuizMaker
        request={request}
        onSaved={async (title) => {
          setUploadNotice(`'${title}' 문제지를 저장하고 학생에게 공개했습니다.`);
          await loadPapers();
        }}
      />

      <div className="teacher-section">
        <h2>등록한 문제지</h2>
        {listError && (
          <p className="field-error" role="alert">
            {listError}
          </p>
        )}
        {papers === null && listError === null && <p>목록을 불러오고 있습니다.</p>}
        {papers !== null && papers.length === 0 && <p>아직 등록한 문제지가 없습니다.</p>}
        {papers !== null && papers.length > 0 && (
          <ul className="teacher-papers">
            {papers.map((paper) => (
              <li key={paper.id}>
                <div>
                  <p className="preview-title">{paper.title}</p>
                  <p className="paper-meta">
                    {paper.questionCount}문항 ·{" "}
                    <span className={paper.published ? "badge public" : "badge private"}>
                      {paper.published ? "공개 중" : "비공개"}
                    </span>
                  </p>
                </div>
                <div className="top-actions">
                  <button
                    className="button small"
                    type="button"
                    disabled={busyId === paper.id}
                    onClick={() => togglePublished(paper)}
                  >
                    {paper.published ? "비공개로 바꾸기" : "공개하기"}
                  </button>
                  <button className="button small" type="button" onClick={() => showResults(paper.id)}>
                    결과 보기
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="teacher-section">
        <h2>학생 풀이 결과</h2>
        {results === null && <p>위 목록에서 문제지의 결과 보기를 누르세요.</p>}
        {results !== null && (
          <>
            <p className="preview-title">{resultPaper?.title ?? "선택한 문제지"}</p>
            {results.error && (
              <p className="field-error" role="alert">
                {results.error}
              </p>
            )}
            {results.rows === null && results.error === null && <p>결과를 불러오고 있습니다.</p>}
            {results.rows !== null && results.rows.length === 0 && <p>아직 제출한 학생이 없습니다.</p>}
            {results.rows !== null && results.rows.length > 0 && (
              <>
                <p className="average">
                  평균 {results.average}점 · {results.rows.length}명 (이름별 최신 결과 기준)
                </p>
                <div className="table-wrap">
                  <table className="result-table">
                    <thead>
                      <tr>
                        <th scope="col">이름</th>
                        <th scope="col">점수</th>
                        <th scope="col">틀린 문제</th>
                        <th scope="col">제출 시각</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.rows.map((row) => (
                        <tr key={row.studentName}>
                          <td>{row.studentName}</td>
                          <td>
                            {row.score}점 ({row.correctCount}/{row.total})
                          </td>
                          <td>{row.wrongQuestions.length > 0 ? `${row.wrongQuestions.join(", ")}번` : "없음"}</td>
                          <td>{formatDate(row.submittedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            <button className="button small retry" type="button" onClick={() => showResults(results.paperId)}>
              새로고침
            </button>
          </>
        )}
      </div>
    </>
  );
}
