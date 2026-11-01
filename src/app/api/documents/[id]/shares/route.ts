import { route, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { listCollaborators, shareDocument } from "@/lib/documents";
import { shareSchema } from "@/lib/validation";

type Ctx = RouteContext<"/api/documents/[id]/shares">;

export const GET = route(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  return Response.json({ collaborators: await listCollaborators(user.id, id) });
});

export const POST = route(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const input = shareSchema.parse(await readJson(req));
  return Response.json({ collaborator: await shareDocument(user.id, id, input) }, { status: 201 });
});
