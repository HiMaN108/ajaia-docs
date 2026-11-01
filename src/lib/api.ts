import { unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";
import { AppError } from "./errors";

/**
 * Wrap a route handler so all failures become a consistent JSON `{ error }` response
 * with the right status code. Unexpected errors are logged and hidden from the client.
 */
export function route<Args extends unknown[]>(fn: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      unstable_rethrow(err); // let Next.js handle its own control-flow errors (prerender bailout, redirect…)
      if (err instanceof AppError) {
        return Response.json({ error: err.message }, { status: err.status });
      }
      if (err instanceof ZodError) {
        return Response.json({ error: err.issues[0]?.message ?? "Invalid request." }, { status: 400 });
      }
      console.error("[api] unexpected error", err);
      return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}

/** Parse a JSON body, turning malformed JSON into a 400 rather than a 500. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new AppError(400, "Request body must be valid JSON.");
  }
}
