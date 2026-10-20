import type { LoginInput } from "../schemas/auth.schemas";
import type { AuthSession } from "../models/auth.types";

export interface IAuthRepository {
  login(input: LoginInput): Promise<AuthSession>;
  getCurrentSession(): Promise<AuthSession | null>;
  logout(): Promise<void>;
}
