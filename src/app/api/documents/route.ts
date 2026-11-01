import { route, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { createDocument, listDocuments } from "@/lib/documents";
import { createDocumentSchema } from "@/lib/validation";

export const GET = route(async () => {
  const user = await requireUser();
  return Response.json(await listDocuments(user.id));
});

export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const input = createDocumentSchema.parse(await readJson(req));
  return Response.json(await createDocument(user.id, input), { status: 201 });
});
