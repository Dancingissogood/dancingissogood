import { forwardRegistrationRequest } from "@/lib/registrations-backend";

type RouteContext = { params: Promise<{ classSessionId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { classSessionId } = await context.params;
  return forwardRegistrationRequest({
    method: "GET",
    path: `/v1/account/class-sessions/${encodeURIComponent(classSessionId)}/join`,
    responseType: "class-join",
  });
}
