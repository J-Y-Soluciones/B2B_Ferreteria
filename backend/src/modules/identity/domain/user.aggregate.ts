export type UserRole =
  | "SUPERADMIN"
  | "TENANT_ADMIN"
  | "CASHIER"
  | "WAREHOUSE_OPERATOR";

export interface UserProps {
  id: string;
  tenantId: string | null;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  tokenVersion: number;
  isActive: boolean;
  mustChangePassword: boolean; // 👈 Agregado
  createdAt: Date;
}

export class User {
  private constructor(private readonly props: UserProps) {
    Object.freeze(this);
  }

  public static rehydrate(props: UserProps): User {
    return new User(props);
  }

  public get id(): string {
    return this.props.id;
  }
  public get tenantId(): string | null {
    return this.props.tenantId;
  }
  public get email(): string {
    return this.props.email;
  }
  public get passwordHash(): string {
    return this.props.passwordHash;
  }
  public get fullName(): string {
    return this.props.fullName;
  }
  public get role(): UserRole {
    return this.props.role;
  }
  public get tokenVersion(): number {
    return this.props.tokenVersion;
  }
  public get isActive(): boolean {
    return this.props.isActive;
  }
  public get mustChangePassword(): boolean {
    return this.props.mustChangePassword;
  }

  public ensureCanAuthenticate(): void {
    if (!this.props.isActive) {
      throw new Error("USER_INACTIVE");
    }
  }

  public toSnapshot(): Readonly<UserProps> {
    return Object.freeze({ ...this.props });
  }
}
