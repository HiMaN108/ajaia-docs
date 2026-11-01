import { route, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { deleteDocument, getDocument, updateDocument } from "@/lib/documents";
import { updateDocumentSchema } from "@/lib/validation";

type Ctx = RouteContext<"/api/documents/[id]">;

export const GET = route(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  return Response.json(await getDocument(user.id, id));
});

export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const input = updateDocumentSchema.parse(await readJson(req));
  return Response.json(await updateDocument(user.id, id, input));
});

export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  await deleteDocument(user.id, id);
  return new Response(null, { status: 204 });
});
