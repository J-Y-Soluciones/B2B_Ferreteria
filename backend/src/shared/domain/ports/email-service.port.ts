export interface SendEmailPayload {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export interface IEmailService {
  send(payload: SendEmailPayload): Promise<void>;
  sendTenantAdminInvitation(
    to: string,
    businessName: string,
    activationUrl: string,
  ): Promise<void>;
  sendPasswordReset(to: string, resetUrl: string): Promise<void>;
}
