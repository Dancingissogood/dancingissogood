import { forwardRegistrationRequest } from "@/lib/registrations-backend";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ classSessionId: string }> },
) {
  const { classSessionId } = await context.params;
  return forwardRegistrationRequest({
    method: "DELETE",
    path: `/v1/account/reservations/${encodeURIComponent(classSessionId)}`,
  });
}
