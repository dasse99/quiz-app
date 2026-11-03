import { errorResponse, storeErrorResponse } from "@/lib/apiResponses";
import { listResults } from "@/lib/paperStore";
import { averageScore, isValidPaperId } from "@/lib/records";
import { checkTeacher } from "@/lib/teacherAuth";

// 교사용: 문제지별 학생 결과표와 평균 (이름별 최신 결과 기준)
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const teacher = await checkTeacher(request.headers.get("authorization"));
  if (!teacher.ok) return errorResponse(teacher.message, teacher.status);

  const { id } = await params;
  if (!isValidPaperId(id)) return errorResponse("문제지를 찾을 수 없습니다.", 404);

  try {
    const results = await listResults(id);
    return Response.json({ results, average: averageScore(results) });
  } catch (error) {
    return storeErrorResponse(error);
  }
}
