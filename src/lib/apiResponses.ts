export function errorResponse(message: string, status: number): Response {
  return Response.json({ message }, { status });
}

export function storeErrorResponse(error: unknown): Response {
  console.error(error);
  return errorResponse("저장소에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.", 500);
}
