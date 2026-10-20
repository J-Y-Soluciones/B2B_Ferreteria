// src/modules/auth/context/authContextDef.ts
import { createContext } from "react";
import type { AuthSession, AuthUser } from "../models/auth.types";
import type { LoginInput } from "../schemas/auth.schemas";

export interface AuthContextType {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  updateUserSession: (userUpdates: Partial<AuthUser>) => void;
  setImpersonatedSession: (session: AuthSession) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
