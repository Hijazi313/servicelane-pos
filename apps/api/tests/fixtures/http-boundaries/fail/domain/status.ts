export class MenuError extends Error {
  constructor(readonly status: 400 | 404 | 409 | 503) { super(); }
}
