//src/modules/identity/domain/identity.repository.interface.ts
import { User } from "./user.aggregate.js";

export interface IUserRepository {
  findByEmail(tenantId: string | null, email: string): Promise<User | null>;
  findById(tenantId: string, id: string): Promise<User | null>;
  incrementTokenVersion(tenantId: string, id: string): Promise<void>;
  findPrimaryAdminByTenantId(tenantId: string): Promise<User | null>;
}
