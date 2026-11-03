import { errorResponse, storeErrorResponse } from "@/lib/apiResponses";
import { validateGeneratedPaper } from "@/lib/azureQuiz";
import { createPaper, listTeacherPapers } from "@/lib/paperStore";
import { parsePaperFile } from "@/lib/quiz";
import { checkTeacher } from "@/lib/teacherAuth";

// 교사용: 등록한 문제지 목록
export async function GET(request: Request) {
  const teacher = await checkTeacher(request.headers.get("authorization"));
  if (!teacher.ok) return errorResponse(teacher.message, teacher.status);

  try {
    return Response.json({ papers: await listTeacherPapers() });
  } catch (error) {
    return storeErrorResponse(error);
  }
}

// 교사용: 문제지 등록. JSON 파일은 처음에 비공개, AI로 만든 문제지(?source=ai)는 저장하면 바로 공개합니다.
export async function POST(request: Request) {
  const teacher = await checkTeacher(request.headers.get("authorization"));
  if (!teacher.ok) return errorResponse(teacher.message, teacher.status);
  const fromAi = new URL(request.url).searchParams.get("source") === "ai";

  // 화면에서 검사했더라도 서버에서 한 번 더 같은 기준으로 검사합니다.
  const text = await request.text();
  const parsed = fromAi ? validateGeneratedPaper(text) : parsePaperFile(text);
  if (!parsed.ok) {
    return Response.json({ message: "문제지 형식이 올바르지 않습니다.", errors: parsed.errors }, { status: 400 });
  }
  const paper = "paper" in parsed ? parsed.paper : { title: parsed.title, questions: parsed.questions };

  try {
    const created = await createPaper(paper, teacher.email, { published: fromAi });
    if (!created.ok) {
      const message =
        created.reason === "same-content"
          ? "똑같은 내용의 문제지가 이미 등록되어 있습니다."
          : "같은 제목의 문제지가 이미 등록되어 있습니다. 제목을 바꾸거나 기존 문제지를 사용해 주세요.";
      return errorResponse(message, 409);
    }
    return Response.json({ paper: created.paper }, { status: 201 });
  } catch (error) {
    return storeErrorResponse(error);
  }
}
