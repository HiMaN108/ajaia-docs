import { route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { revokeShare } from "@/lib/documents";

type Ctx = RouteContext<"/api/documents/[id]/shares/[userId]">;

export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id, userId } = await ctx.params;
  await revokeShare(user.id, id, userId);
  return new Response(null, { status: 204 });
});
