// src/modules/platform/domain/value-objects/subscription-types.vo.ts
export type PlanTier = "BASIC" | "PRO" | "ENTERPRISE";
export type SubscriptionState = "TRIAL" | "ACTIVE" | "SUSPENDED" | "CANCELLED";

export interface PlanDefaults {
  maxCashRegisters: number;
  maxUsers: number;
  moduleSunat: boolean;
  moduleCredits: boolean;
  moduleMultiwarehouse: boolean;
}

export const PLAN_CONFIGURATIONS: Record<PlanTier, PlanDefaults> = {
  BASIC: {
    maxCashRegisters: 1,
    maxUsers: 2,
    moduleSunat: false,
    moduleCredits: true,
    moduleMultiwarehouse: false,
  },
  PRO: {
    maxCashRegisters: 3,
    maxUsers: 5,
    moduleSunat: true,
    moduleCredits: true,
    moduleMultiwarehouse: false,
  },
  ENTERPRISE: {
    maxCashRegisters: 10,
    maxUsers: 20,
    moduleSunat: true,
    moduleCredits: true,
    moduleMultiwarehouse: true,
  },
};
