import { extractText, getDocumentProxy } from "unpdf";

// 교안의 교육용 입력 기준입니다. 플랫폼의 공통 한도가 아닙니다.
export const MAX_PDF_BYTES = 524_288;
export const MAX_TEXT_CHARS = 12_000;

export type PdfProblem = "empty" | "too-large" | "not-pdf" | "encrypted" | "damaged" | "no-text" | "too-long";

export type PdfTextResult =
  | { ok: true; text: string; chars: number }
  | { ok: false; problem: PdfProblem; message: string };

function fail(problem: PdfProblem, message: string): PdfTextResult {
  return { ok: false, problem, message };
}

function formatKiB(bytes: number): string {
  return `${Math.ceil(bytes / 1024).toLocaleString("ko-KR")}KB`;
}

export function countChars(text: string): number {
  return [...text].length;
}

// 줄바꿈·겹친 빈칸만 정리합니다. 글자는 지우거나 자르지 않습니다.
export function normalizeText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t\f\v ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function checkPdfBytes(bytes: Uint8Array): PdfTextResult | null {
  if (bytes.length === 0) return fail("empty", "빈 파일입니다. 내용이 있는 PDF를 골라 주세요.");
  if (bytes.length > MAX_PDF_BYTES) {
    return fail(
      "too-large",
      `파일이 ${formatKiB(bytes.length)}입니다. PDF는 512KB(${MAX_PDF_BYTES.toLocaleString("ko-KR")}바이트) 이하만 올릴 수 있습니다.`,
    );
  }
  const head = new TextDecoder("latin1").decode(bytes.subarray(0, 1024));
  if (!head.includes("%PDF-")) return fail("not-pdf", "PDF 파일이 아닙니다. PDF 파일을 골라 주세요.");
  return null;
}

export function checkText(raw: string): PdfTextResult {
  const text = normalizeText(raw);
  const chars = countChars(text);
  if (chars === 0) {
    return fail(
      "no-text",
      "PDF에서 글자를 읽을 수 없습니다. 스캔하거나 사진으로 만든 PDF는 지원하지 않습니다. 글자를 선택·복사할 수 있는 PDF를 올려 주세요.",
    );
  }
  if (chars > MAX_TEXT_CHARS) {
    return fail(
      "too-long",
      `PDF 본문이 ${chars.toLocaleString("ko-KR")}자입니다. 본문이 ${MAX_TEXT_CHARS.toLocaleString("ko-KR")}자 이하인 PDF만 쓸 수 있습니다. 자료를 나누어 올려 주세요.`,
    );
  }
  return { ok: true, text, chars };
}

export function classifyPdfError(error: unknown): PdfTextResult {
  const name = (error as { name?: string } | null)?.name;
  if (name === "PasswordException") {
    return fail("encrypted", "암호가 걸린 PDF는 읽을 수 없습니다. 암호를 푼 PDF를 올려 주세요.");
  }
  return fail("damaged", "PDF 파일이 손상되었거나 읽을 수 없는 형식입니다. 다른 PDF를 올려 주세요.");
}

export async function readPdfText(bytes: Uint8Array): Promise<PdfTextResult> {
  const problem = checkPdfBytes(bytes);
  if (problem !== null) return problem;

  let raw: string;
  try {
    // PDF 도구가 받은 배열을 넘겨받아 비우므로 복사본을 넘깁니다.
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    raw = (await extractText(pdf, { mergePages: true })).text;
  } catch (error) {
    return classifyPdfError(error);
  }
  return checkText(raw);
}
