import { z } from "zod";
import type { UseFormSetError, FieldValues, Path } from "react-hook-form";

export const rfc7807ProblemDetailsSchema = z.object({
  type: z.string().optional(),
  title: z.string(),
  status: z.number(),
  detail: z.string(),
  instance: z.string().optional(),
  invalid_params: z
    .array(
      z.object({
        name: z.string(),
        reason: z.string(),
      }),
    )
    .optional(),
});

export type RFC7807ProblemDetails = z.infer<typeof rfc7807ProblemDetailsSchema>;

export class ProblemDetailsError extends Error {
  readonly status: number;
  readonly type?: string;
  readonly detail: string;
  readonly instance?: string;
  readonly invalidParams?: RFC7807ProblemDetails["invalid_params"];

  constructor(problem: RFC7807ProblemDetails) {
    super(problem.detail || problem.title);
    this.name = "ProblemDetailsError";
    this.status = problem.status;
    this.type = problem.type;
    this.detail = problem.detail;
    this.instance = problem.instance;
    this.invalidParams = problem.invalid_params;
  }
}

/**
 * Inyecta los invalid_params del RFC 7807 directamente en el formulario de react-hook-form.
 */
export function applyRFC7807ToForm<TFieldValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TFieldValues>,
): boolean {
  if (
    error instanceof ProblemDetailsError &&
    error.invalidParams &&
    error.invalidParams.length > 0
  ) {
    for (const param of error.invalidParams) {
      setError(param.name as Path<TFieldValues>, {
        type: "server",
        message: param.reason,
      });
    }
    return true;
  }
  return false;
}
