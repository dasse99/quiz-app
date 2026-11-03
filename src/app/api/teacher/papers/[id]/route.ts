import { errorResponse, storeErrorResponse } from "@/lib/apiResponses";
import { setPublished } from "@/lib/paperStore";
import { isValidPaperId } from "@/lib/records";
import { checkTeacher } from "@/lib/teacherAuth";

// 교사용: 공개·비공개 바꾸기
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const teacher = await checkTeacher(request.headers.get("authorization"));
  if (!teacher.ok) return errorResponse(teacher.message, teacher.status);

  const { id } = await params;
  if (!isValidPaperId(id)) return errorResponse("문제지를 찾을 수 없습니다.", 404);

  let body: { published?: unknown };
  try {
    body = await request.json();
  } catch {
    return errorResponse("요청 내용을 읽을 수 없습니다.", 400);
  }
  if (typeof body.published !== "boolean") return errorResponse("공개 여부를 알 수 없습니다.", 400);

  try {
    const found = await setPublished(id, body.published);
    if (!found) return errorResponse("문제지를 찾을 수 없습니다.", 404);
    return Response.json({ id, published: body.published });
  } catch (error) {
    return storeErrorResponse(error);
  }
}
