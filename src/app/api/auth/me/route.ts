import { route } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export const GET = route(async () => Response.json({ user: await requireUser() }));
