// src/modules/platform/domain/entities/tenant.entity.ts
import { Ruc } from "../value-objects/ruc.vo.js";
import { Subscription } from "./subscription.entity.js";
import {
  PLAN_CONFIGURATIONS,
  PlanTier,
} from "../value-objects/subscription-types.vo.js";
import { TenantLimitExceededException } from "../exceptions/platform-domain.exception.js";

export type TenantProfile = "HARDWARE_STORE" | "LUBRICENTER";

export interface TenantProps {
  id: string;
  businessName: string;
  tradeName: string;
  ruc: Ruc;
  profile: TenantProfile;
  subscription: Subscription;
  moduleSunat: boolean;
  moduleCredits: boolean;
  moduleMultiwarehouse: boolean;
  maxCashRegisters: number;
  maxUsers: number;
  allowNegativeStock: boolean;
  createdAt: Date;
}

export class Tenant {
  private _props: TenantProps;

  private constructor(props: TenantProps) {
    this._props = props;
  }

  public static create(
    id: string,
    businessName: string,
    tradeName: string,
    ruc: Ruc,
    profile: TenantProfile,
    plan: PlanTier = "PRO",
  ): Tenant {
    const defaults = PLAN_CONFIGURATIONS[plan];
    const subscription = Subscription.createTrial(plan);

    return new Tenant({
      id,
      businessName,
      tradeName,
      ruc,
      profile,
      subscription,
      moduleSunat: defaults.moduleSunat,
      moduleCredits: defaults.moduleCredits,
      moduleMultiwarehouse: defaults.moduleMultiwarehouse,
      maxCashRegisters: defaults.maxCashRegisters,
      maxUsers: defaults.maxUsers,
      allowNegativeStock: false,
      createdAt: new Date(),
    });
  }

  public static reconstitute(props: TenantProps): Tenant {
    return new Tenant(props);
  }

  public assertCanCreateCashRegister(currentCount: number): void {
    if (currentCount >= this._props.maxCashRegisters) {
      throw new TenantLimitExceededException(
        "Cajas Registradoras",
        currentCount,
        this._props.maxCashRegisters,
      );
    }
  }

  public assertCanCreateUser(currentCount: number): void {
    if (currentCount >= this._props.maxUsers) {
      throw new TenantLimitExceededException(
        "Usuarios",
        currentCount,
        this._props.maxUsers,
      );
    }
  }

  public updateModules(modules: {
    sunat?: boolean;
    credits?: boolean;
    multiwarehouse?: boolean;
    maxRegisters?: number;
    maxUsers?: number;
  }): void {
    if (modules.sunat !== undefined) this._props.moduleSunat = modules.sunat;
    if (modules.credits !== undefined)
      this._props.moduleCredits = modules.credits;
    if (modules.multiwarehouse !== undefined)
      this._props.moduleMultiwarehouse = modules.multiwarehouse;
    if (modules.maxRegisters !== undefined)
      this._props.maxCashRegisters = modules.maxRegisters;
    if (modules.maxUsers !== undefined) this._props.maxUsers = modules.maxUsers;
  }

  // Getters
  public get id(): string {
    return this._props.id;
  }
  public get businessName(): string {
    return this._props.businessName;
  }
  public get tradeName(): string {
    return this._props.tradeName;
  }
  public get ruc(): Ruc {
    return this._props.ruc;
  }
  public get profile(): TenantProfile {
    return this._props.profile;
  }
  public get subscription(): Subscription {
    return this._props.subscription;
  }
  public get moduleSunat(): boolean {
    return this._props.moduleSunat;
  }
  public get moduleCredits(): boolean {
    return this._props.moduleCredits;
  }
  public get moduleMultiwarehouse(): boolean {
    return this._props.moduleMultiwarehouse;
  }
  public get maxCashRegisters(): number {
    return this._props.maxCashRegisters;
  }
  public get maxUsers(): number {
    return this._props.maxUsers;
  }
  public get allowNegativeStock(): boolean {
    return this._props.allowNegativeStock;
  }
  public get createdAt(): Date {
    return this._props.createdAt;
  }
}
