export interface ProblemDefinition {
  /** Stable absolute identifier supplied by the owning approved contract. */
  type: string;
  title: string;
  status: number;
  detail?: string;
  /** Only explicitly selected, safe module data; never raw exception data. */
  details?: unknown;
  retryAfter?: number;
}
export interface ProblemReply {
  header(name: string, value: string): ProblemReply;
  type(value: string): ProblemReply;
  status(code: number): ProblemReply;
  send(body: unknown): unknown;
}

export function writeProblemDetails(reply: ProblemReply, requestId: string, problem: ProblemDefinition): void {
  if (problem.retryAfter !== undefined) reply.header('Retry-After', String(problem.retryAfter));
  reply.header('Cache-Control', 'no-store').type('application/problem+json').status(problem.status).send({
    type: problem.type, title: problem.title, status: problem.status,
    ...(problem.detail === undefined ? {} : { detail: problem.detail }),
    ...(problem.details === undefined ? {} : { details: problem.details }),
    meta: { requestId },
  });
}
