import { errorResponse } from "@/lib/apiResponses";
import { getPaper, saveResult } from "@/lib/paperStore";
import { gradeQuiz } from "@/lib/quiz";
import { MAX_NAME_LENGTH, cleanName, isValidAnswers, isValidPaperId } from "@/lib/records";

// 학생용: 최종 제출. 서버에서 채점하고 저장한 뒤에만 본인의 결과(정답·해설 포함)를 돌려줍니다.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidPaperId(id)) return errorResponse("문제지를 찾을 수 없습니다.", 404);

  let body: { name?: unknown; answers?: unknown };
  try {
    body = await request.json();
  } catch {
    return errorResponse("제출 내용을 읽을 수 없습니다.", 400);
  }

  const name = typeof body.name === "string" ? cleanName(body.name) : "";
  if (name === "") return errorResponse("이름을 입력해 주세요.", 400);
  if (name.length > MAX_NAME_LENGTH) {
    return errorResponse(`이름은 ${MAX_NAME_LENGTH}자 이하로 입력해 주세요.`, 400);
  }

  try {
    const paper = await getPaper(id);
    if (paper === null || !paper.published) return errorResponse("문제지를 찾을 수 없습니다.", 404);
    if (!isValidAnswers(body.answers, paper.questions.length)) {
      return errorResponse("모든 문항에 답해 주세요.", 400);
    }

    const result = gradeQuiz(paper.questions, body.answers);
    await saveResult(id, paper.title, name, body.answers, result);
    return Response.json({ result });
  } catch (error) {
    console.error(error);
    return errorResponse("결과를 저장하지 못했습니다. 다시 시도해 주세요.", 500);
  }
}
