const PROBLEM_CODE = Symbol('http-problem-code');

export interface ProblemDefinition {
  /** Stable root-relative or absolute URI reference from the approved contract. */
  type: string;
  title: string;
  code?: string;
  status: number;
  detail?: string;
  /** Only explicitly selected, safe module data; never raw exception data. */
  details?: unknown;
  retryAfter?: number;
  errors?: readonly { location: 'body' | 'query'; field: string; code: string }[];
}
export interface ProblemReply {
  [PROBLEM_CODE]?: string;
  header(name: string, value: string): ProblemReply;
  type(value: string): ProblemReply;
  status(code: number): ProblemReply;
  send(body: unknown): unknown;
}

export function writeProblemDetails(reply: ProblemReply, requestId: string, problem: ProblemDefinition): void {
  if (problem.code !== undefined) reply[PROBLEM_CODE] = problem.code;
  if (problem.retryAfter !== undefined) reply.header('Retry-After', String(problem.retryAfter));
  reply.header('Cache-Control', 'no-store').type('application/problem+json').status(problem.status).send({
    type: problem.type, title: problem.title, status: problem.status,
    ...(problem.code === undefined ? {} : { code: problem.code }),
    ...(problem.detail === undefined ? {} : { detail: problem.detail }),
    ...(problem.details === undefined ? {} : { details: problem.details }),
    ...(problem.errors === undefined ? {} : { errors: problem.errors }),
    meta: { requestId },
  });
}

/** Internal completion-log context; never serializes arbitrary exception data. */
export function responseProblemCode(reply: object): string | undefined {
  if (!(PROBLEM_CODE in reply)) return undefined;
  const value = reply[PROBLEM_CODE];
  return typeof value === 'string' ? value : undefined;
}
