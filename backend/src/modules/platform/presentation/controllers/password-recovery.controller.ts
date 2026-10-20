import { FastifyReply, FastifyRequest } from "fastify";
import { ForgotPasswordUseCase } from "../../application/use-cases/forgot-password.use-case.js";
import { ResetPasswordUseCase } from "../../application/use-cases/reset-password.use-case.js";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../schemas/password-recovery.schemas.js";

export class PasswordRecoveryController {
  constructor(
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  public async forgotPassword(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const body = forgotPasswordSchema.parse(request.body);
    await this.forgotPasswordUseCase.execute({ email: body.email });

    // 200 OK genérico para mitigar enumeración de usuarios
    reply.status(200).send({
      message:
        "Si la cuenta existe en el sistema, se ha enviado un correo con las instrucciones para restablecer la contraseña.",
    });
  }

  public async resetPassword(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const body = resetPasswordSchema.parse(request.body);

    await this.resetPasswordUseCase.execute({
      rawToken: body.token,
      newPasswordPlain: body.new_password,
    });

    reply.status(200).send({
      message:
        "Contraseña actualizada exitosamente. Ya puedes iniciar sesión con tu nueva credencial.",
    });
  }
}
