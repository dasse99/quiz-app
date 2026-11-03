import { checkTeacher } from "@/lib/teacherAuth";

// 교사 기능은 이 확인을 통과한 요청에만 응답합니다.
export async function GET(request: Request) {
  const result = await checkTeacher(request.headers.get("authorization"));
  if (!result.ok) {
    return Response.json({ message: result.message }, { status: result.status });
  }
  return Response.json({ email: result.email });
}
