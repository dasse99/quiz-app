import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_PDF_BYTES, MAX_TEXT_CHARS, checkPdfBytes, checkText, readPdfText } from "./pdfText.ts";

// 시험용으로 아주 작은 PDF를 직접 만듭니다. text가 없으면 글자 없는(스캔 같은) PDF가 됩니다.
function makePdf(text: string | null, options: { encrypted?: boolean } = {}): Uint8Array {
  const content = text === null ? "" : `BT /F1 12 Tf 72 720 Td (${text}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  if (options.encrypted) {
    objects.push(`<< /Filter /Standard /V 1 /R 2 /O <${"ab".repeat(32)}> /U <${"cd".repeat(32)}> /P -4 >>`);
  }
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  const encrypt = options.encrypted ? ` /Encrypt ${objects.length} 0 R /ID [<${"01".repeat(16)}> <${"01".repeat(16)}>]` : "";
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R${encrypt} >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(pdf);
}

test("글자가 있는 PDF에서 본문을 읽는다", async () => {
  const result = await readPdfText(makePdf("Photosynthesis makes sugar from light."));
  assert.equal(result.ok, true);
  assert.match(result.ok ? result.text : "", /Photosynthesis makes sugar from light\./);
});

test("빈 파일, PDF가 아닌 파일, 크기 초과를 AI 호출 전에 거부한다", () => {
  const empty = checkPdfBytes(new Uint8Array());
  assert.equal(empty?.ok === false && empty.problem, "empty");
  const notPdf = checkPdfBytes(new TextEncoder().encode("hello"));
  assert.equal(notPdf?.ok === false && notPdf.problem, "not-pdf");

  const atLimit = new Uint8Array(MAX_PDF_BYTES);
  atLimit.set(new TextEncoder().encode("%PDF-1.4"));
  assert.equal(checkPdfBytes(atLimit), null);

  const overLimit = new Uint8Array(MAX_PDF_BYTES + 1);
  overLimit.set(new TextEncoder().encode("%PDF-1.4"));
  const tooLarge = checkPdfBytes(overLimit);
  assert.equal(tooLarge?.ok === false && tooLarge.problem, "too-large");
});

test("글자가 없는 PDF(스캔·사진)는 성공으로 처리하지 않는다", async () => {
  const result = await readPdfText(makePdf(null));
  assert.equal(result.ok === false && result.problem, "no-text");
});

test("손상된 PDF와 암호가 걸린 PDF를 구분해 거부한다", async () => {
  const damaged = await readPdfText(new TextEncoder().encode("%PDF-1.4\nthis is not really a pdf"));
  assert.equal(damaged.ok === false && damaged.problem, "damaged");

  const encrypted = await readPdfText(makePdf("secret", { encrypted: true }));
  assert.equal(encrypted.ok === false && encrypted.problem, "encrypted");
});

test("본문은 12,000자까지 받고, 넘으면 자르지 않고 거부한다", () => {
  const exact = checkText("가".repeat(MAX_TEXT_CHARS));
  assert.equal(exact.ok, true);
  assert.equal(exact.ok && exact.chars, MAX_TEXT_CHARS);

  const over = checkText("가".repeat(MAX_TEXT_CHARS + 1));
  assert.equal(over.ok === false && over.problem, "too-long");
  assert.match(over.ok ? "" : over.message, /12,001자/);
});

test("겹친 빈칸과 줄바꿈만 정리하고 글자는 그대로 둔다", () => {
  const result = checkText("  첫 줄   입니다.\r\n\r\n\r\n\n둘째\t줄  ");
  assert.equal(result.ok && result.text, "첫 줄 입니다.\n\n둘째 줄");
});
