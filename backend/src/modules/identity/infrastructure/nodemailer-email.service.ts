// src/modules/identity/infrastructure/nodemailer-email.service.ts
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../../../core/config/env.js";
import {
  IEmailService,
  SendPasswordResetEmailInput,
} from "../domain/email-service.interface.js";

export class NodemailerEmailService implements IEmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER
        ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          }
        : undefined,
    });
  }

  public async sendPasswordResetEmail(
    input: SendPasswordResetEmailInput,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: env.EMAIL_FROM,
      to: input.to,
      subject: "Recuperación de contraseña - JYPoS Industrial",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1e293b;">Hola, ${input.fullName}</h2>
          <p style="color: #475569;">Hemos recibido una solicitud para restablecer tu contraseña en la plataforma.</p>
          <p style="color: #475569;">Haz clic en el siguiente botón para continuar (enlace válido por 30 minutos):</p>
          <div style="margin: 25px 0;">
            <a href="${input.resetLink}" style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Restablecer Contraseña
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 13px;">Si no solicitaste este cambio, puedes ignorar este mensaje; tu cuenta sigue segura.</p>
        </div>
      `,
    });
  }
}
