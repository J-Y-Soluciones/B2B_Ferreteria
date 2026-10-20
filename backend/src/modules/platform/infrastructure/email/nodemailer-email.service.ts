import nodemailer, { Transporter } from "nodemailer";
import {
  IEmailService,
  SendEmailPayload,
} from "../../../../shared/domain/ports/email-service.port.js";
import { env } from "../../../../core/config/env.js";

export class NodemailerEmailService implements IEmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  public async send(payload: SendEmailPayload): Promise<void> {
    await this.transporter.sendMail({
      from: env.EMAIL_FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.htmlContent,
      text: payload.textContent,
    });
  }

  public async sendTenantAdminInvitation(
    to: string,
    businessName: string,
    activationUrl: string,
  ): Promise<void> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2 style="color: #1e293b;">Bienvenido a la Plataforma</h2>
        <p>Tu comercio <strong>${businessName}</strong> ha sido dado de alta exitosamente.</p>
        <p>Para activar tu cuenta de Administrador y configurar tu contraseña de acceso, haz clic en el siguiente botón:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${activationUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Activar Cuenta</a>
        </div>
        <p style="font-size: 12px; color: #64748b;">Este enlace expirará en 48 horas. Si no solicitaste esta cuenta, ignora este mensaje.</p>
      </div>
    `;

    await this.send({
      to,
      subject: `Activación de Cuenta - ${businessName}`,
      htmlContent,
    });
  }

  public async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2 style="color: #1e293b;">Recuperación de Contraseña</h2>
        <p>Has solicitado restablecer tu contraseña de acceso.</p>
        <p>Haz clic en el siguiente botón para definir una nueva credencial:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #dc2626; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Restablecer Contraseña</a>
        </div>
        <p style="font-size: 12px; color: #64748b;">El enlace es válido por 60 minutos. Si no fuiste tú, te recomendamos cambiar tus credenciales de inmediato.</p>
      </div>
    `;

    await this.send({
      to,
      subject: "Restablecimiento de Contraseña",
      htmlContent,
    });
  }
}
