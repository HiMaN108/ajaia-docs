import { route, readJson } from "@/lib/api";
import { startSession, verifyCredentials } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { loginSchema } from "@/lib/validation";

export const POST = route(async (req: Request) => {
  const { email, password } = loginSchema.parse(await readJson(req));
  const user = await verifyCredentials(email, password);
  if (!user) throw new AppError(401, "Incorrect email or password.");
  await startSession(user.id);
  return Response.json({ user });
});
