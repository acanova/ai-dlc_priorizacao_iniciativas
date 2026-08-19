export class ApplicationError extends Error {
  constructor(code, message, details, options = {}) {
    super(message, options);
    this.name = "ApplicationError";
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}
