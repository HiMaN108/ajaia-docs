import { route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { createDocument } from "@/lib/documents";
import { badRequest } from "@/lib/errors";
import { importFile } from "@/lib/import";

/** multipart/form-data with a single `file` field → a new document owned by the caller. */
export const POST = route(async (req: Request) => {
  const user = await requireUser();
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw badRequest("Expected a multipart form upload.");
  }
  const file = form.get("file");
  if (!(file instanceof File)) throw badRequest("Please choose a file to upload.");

  const { title, content } = await importFile(file.name, Buffer.from(await file.arrayBuffer()));
  return Response.json(await createDocument(user.id, { title, content }), { status: 201 });
});
