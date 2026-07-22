import { forwardSavedSessionRequest } from "@/lib/saved-class-sessions-backend";

type RouteContext = { params: Promise<{ classSessionId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const { classSessionId } = await context.params;

  return forwardSavedSessionRequest({
    method: "DELETE",
    path: `/v1/account/class-selections/${encodeURIComponent(classSessionId)}`,
  });
}
