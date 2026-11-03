import { storeErrorResponse } from "@/lib/apiResponses";
import { listPublishedPapers } from "@/lib/paperStore";

// 학생용: 공개된 문제지 목록 (제목과 문항 수만)
export async function GET() {
  try {
    return Response.json({ papers: await listPublishedPapers() });
  } catch (error) {
    return storeErrorResponse(error);
  }
}
