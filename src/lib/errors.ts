/** An error that is safe to show to the user, with the HTTP status it maps to. */
export class AppError extends Error {
  constructor(
    public readonly status: 400 | 401 | 403 | 404 | 409 | 413 | 415 | 500,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const badRequest = (msg: string) => new AppError(400, msg);
export const unauthorized = (msg = "Please log in to continue.") => new AppError(401, msg);
export const forbidden = (msg = "You don't have permission to do that.") => new AppError(403, msg);
/** Also used when a user has no access at all, so that we don't leak whether a document exists. */
export const notFound = (msg = "Document not found.") => new AppError(404, msg);
