import { z } from "zod";

export const titleSchema = z
  .string()
  .trim()
  .min(1, "Title can't be empty.")
  .max(200, "Title must be 200 characters or fewer.");

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email.")),
  password: z.string().min(1, "Password is required."),
});

export const createDocumentSchema = z.object({
  title: titleSchema.optional(),
});

export const updateDocumentSchema = z
  .object({
    title: titleSchema.optional(),
    content: z.unknown().optional(), // validated against the editor schema in the service
  })
  .refine((v) => v.title !== undefined || v.content !== undefined, {
    message: "Nothing to update.",
  });

export const shareSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email.")),
  role: z.enum(["viewer", "editor"], { error: "Role must be \"viewer\" or \"editor\"." }),
});
