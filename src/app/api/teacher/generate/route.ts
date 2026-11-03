import { errorResponse, storeErrorResponse } from "@/lib/apiResponses";
import { generatePaper } from "@/lib/azureQuiz";
import { listTeacherPapers } from "@/lib/paperStore";
import { MAX_PDF_BYTES, readPdfText } from "@/lib/pdfText";
import { titleKey } from "@/lib/records";
import { checkTeacher } from "@/lib/teacherAuth";

// AI 응답을 기다리는 시간(초)입니다.
export const maxDuration = 120;

// 교사용: PDF 본문으로 AI 문제 만들기. 결과는 저장하지 않고 돌려주기만 합니다.
export async function POST(request: Request) {
  const teacher = await checkTeacher(request.headers.get("authorization"));
  if (!teacher.ok) return errorResponse(teacher.message, teacher.status);

  // 크기가 넘는 파일은 내용을 읽기 전에 거부합니다.
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_PDF_BYTES) {
    return errorResponse("PDF는 512KB(524,288바이트) 이하만 올릴 수 있습니다.", 413);
  }

  const pdf = await readPdfText(new Uint8Array(await request.arrayBuffer()));
  if (!pdf.ok) return errorResponse(pdf.message, pdf.problem === "too-large" ? 413 : 400);

  let titles: string[];
  try {
    titles = (await listTeacherPapers()).map((paper) => paper.title);
  } catch (error) {
    return storeErrorResponse(error);
  }

  const generated = await generatePaper(pdf.text, titles);
  if (!generated.ok) {
    return Response.json(
      { message: generated.message, kind: generated.kind, errors: generated.errors ?? [] },
      { status: 502 },
    );
  }

  const key = titleKey(generated.paper.title);
  return Response.json({
    paper: generated.paper,
    textLength: pdf.chars,
    duplicateTitle: titles.some((title) => titleKey(title) === key),
  });
}
