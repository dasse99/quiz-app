import { errorResponse, storeErrorResponse } from "@/lib/apiResponses";
import { getPaper } from "@/lib/paperStore";
import { isValidPaperId, toPublicQuestions } from "@/lib/records";

// 학생용: 공개된 문제지의 문제와 보기 (정답·해설 제외)
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidPaperId(id)) return errorResponse("문제지를 찾을 수 없습니다.", 404);

  try {
    const paper = await getPaper(id);
    if (paper === null || !paper.published) return errorResponse("문제지를 찾을 수 없습니다.", 404);
    return Response.json({ id, title: paper.title, questions: toPublicQuestions(paper.questions) });
  } catch (error) {
    return storeErrorResponse(error);
  }
}
