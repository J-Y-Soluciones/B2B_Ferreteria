import "@fastify/cookie";
import { FastifyReply, FastifyRequest } from "fastify";
import { LoginUseCase } from "../application/login.use-case.js";
import { ForgotPasswordUseCase } from "../application/forgot-password.use-case.js";
import { ResetPasswordUseCase } from "../application/reset-password.use-case.js";
import { ChangeInitialPasswordUseCase } from "../application/change-initial-password.use-case.js";
import { loginSchema, LoginBody } from "./auth.schema.js";
import { ITokenService } from "../domain/security.interfaces.js";
import {
  DomainError,
  DomainValidationError,
  EntityNotFoundError,
} from "../../../core/errors/domain.error.js";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "El token es obligatorio"),
  newPassword: z
    .string()
    .min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
});

const changeInitialPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
});

export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly changeInitialPasswordUseCase: ChangeInitialPasswordUseCase,
    private readonly tokenService?: ITokenService,
  ) {}

  public handleLogin = async (
    request: FastifyRequest<{ Body: LoginBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const tenantId = (request.headers["x-tenant-id"] as string) || null;

    const validation = loginSchema.safeParse(request.body);
    if (!validation.success) {
      reply.status(422).send({
        type: "https://api.jysoluciones.pe/errors/validation-failed",
        title: "Validation Failed",
        status: 422,
        detail: "Datos de inicio de sesión inválidos.",
        instance: request.url,
        invalid_params: validation.error.issues.map((i: z.ZodIssue) => ({
          name: i.path.join("."),
          reason: i.message,
        })),
      });
      return;
    }

    try {
      const result = await this.loginUseCase.execute({
        tenantId,
        email: validation.data.email,
        passwordPlain: validation.data.password,
      });

      reply.setCookie("refresh_token", result.refreshToken, {
        path: "/api/v1/auth/refresh",
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60,
      });

      reply.status(200).send({
        access_token: result.accessToken,
        token_type: "Bearer",
        user: result.user,
        tenant: result.tenant ?? undefined,
      });
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        reply.status(err.statusCode).send({
          type: err.errorType,
          title: err.name,
          status: err.statusCode,
          detail: err.message,
          instance: request.url,
          invalid_params: err.invalidParams,
        });
        return;
      }
      throw err;
    }
  };

  public handleForgotPassword = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const validation = forgotPasswordSchema.safeParse(request.body);
    if (!validation.success) {
      reply.status(422).send({
        type: "https://api.jysoluciones.pe/errors/validation-failed",
        title: "Validation Failed",
        status: 422,
        detail: "Formato de correo no válido.",
        instance: request.url,
        invalid_params: validation.error.issues.map((i: z.ZodIssue) => ({
          name: i.path.join("."),
          reason: i.message,
        })),
      });
      return;
    }

    await this.forgotPasswordUseCase.execute(validation.data.email);

    // OWASP Anti-Enumeration: Siempre devolvemos 200 OK
    reply.status(200).send({
      message:
        "Si el correo corresponde a una cuenta activa, se enviará el enlace de recuperación.",
    });
  };

  public handleResetPassword = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const validation = resetPasswordSchema.safeParse(request.body);
    if (!validation.success) {
      reply.status(422).send({
        type: "https://api.jysoluciones.pe/errors/validation-failed",
        title: "Validation Failed",
        status: 422,
        detail: "Datos inválidos para restablecer la contraseña.",
        instance: request.url,
        invalid_params: validation.error.issues.map((i: z.ZodIssue) => ({
          name: i.path.join("."),
          reason: i.message,
        })),
      });
      return;
    }

    try {
      await this.resetPasswordUseCase.execute(
        validation.data.token,
        validation.data.newPassword,
      );

      reply.status(200).send({
        message:
          "Contraseña actualizada correctamente. Inicie sesión nuevamente.",
      });
    } catch (err: unknown) {
      if (err instanceof DomainValidationError) {
        reply.status(err.statusCode).send({
          type: err.errorType,
          title: err.name,
          status: err.statusCode,
          detail: err.message,
          instance: request.url,
        });
        return;
      }
      throw err;
    }
  };

  public handleChangeInitialPassword = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const validation = changeInitialPasswordSchema.safeParse(request.body);
    if (!validation.success) {
      reply.status(422).send({
        type: "https://api.jysoluciones.pe/errors/validation-failed",
        title: "Validation Failed",
        status: 422,
        detail: "Datos de contraseña no válidos.",
        instance: request.url,
        invalid_params: validation.error.issues.map((i: z.ZodIssue) => ({
          name: i.path.join("."),
          reason: i.message,
        })),
      });
      return;
    }

    // Intentar leer de un preHandler previo si existiera
    let userId = request.tenantContext?.userId || (request as any).user?.sub;

    // 👈 3. FALLBACK: Decodificar el Bearer token si no hubo preHandler
    if (!userId && request.headers.authorization && this.tokenService) {
      try {
        const token = request.headers.authorization
          .replace(/^Bearer\s+/i, "")
          .trim();
        const payload = await this.tokenService.verifyAccessToken(token);
        userId = payload.sub;
      } catch (err) {
        request.log.warn(
          { err },
          "Token inválido o expirado en change-initial-password",
        );
      }
    }

    if (!userId) {
      reply.status(401).send({
        type: "https://api.jysoluciones.pe/errors/unauthorized",
        title: "Unauthorized",
        status: 401,
        detail: "Debe estar autenticado para cambiar la contraseña inicial.",
        instance: request.url,
      });
      return;
    }

    try {
      await this.changeInitialPasswordUseCase.execute(
        userId,
        validation.data.newPassword,
      );

      reply.status(200).send({
        success: true,
        message: "Contraseña inicial cambiada con éxito.",
      });
    } catch (err: unknown) {
      if (err instanceof EntityNotFoundError) {
        reply.status(err.statusCode).send({
          type: err.errorType,
          title: err.name,
          status: err.statusCode,
          detail: err.message,
          instance: request.url,
        });
        return;
      }
      throw err;
    }
  };
}
