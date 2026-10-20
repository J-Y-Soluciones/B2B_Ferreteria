//src/modules/identity/domain/email-service.interface.ts
export interface SendPasswordResetEmailInput {
  to: string;
  fullName: string;
  resetLink: string;
}

export interface IEmailService {
  sendPasswordResetEmail(input: SendPasswordResetEmailInput): Promise<void>;
}
