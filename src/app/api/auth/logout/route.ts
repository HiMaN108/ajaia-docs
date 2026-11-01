import { route } from "@/lib/api";
import { endSession } from "@/lib/auth";

export const POST = route(async () => {
  await endSession();
  return Response.json({ ok: true });
});
