import { hash, verify } from "@node-rs/argon2";
import { IPasswordHasher } from "../domain/security.interfaces.js";

export class Argon2PasswordHasher implements IPasswordHasher {
  public async hash(password: string): Promise<string> {
    return hash(password, {
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  }

  public async verify(hashValue: string, plain: string): Promise<boolean> {
    try {
      return await verify(hashValue, plain);
    } catch {
      return false;
    }
  }
}
