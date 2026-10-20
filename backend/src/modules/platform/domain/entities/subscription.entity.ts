// src/modules/platform/domain/entities/subscription.entity.ts
import { Money } from "../value-objects/money.vo.js";
import {
  PlanTier,
  SubscriptionState,
} from "../value-objects/subscription-types.vo.js";

export interface SubscriptionProps {
  planName: PlanTier;
  status: SubscriptionState;
  monthlyFee: Money;
  expiresAt: Date;
  gracePeriodDays: number;
}

export class Subscription {
  private _props: SubscriptionProps;

  private constructor(props: SubscriptionProps) {
    this._props = props;
  }

  public static create(props: SubscriptionProps): Subscription {
    return new Subscription(props);
  }

  public static createTrial(plan: PlanTier, days: number = 14): Subscription {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    return new Subscription({
      planName: plan,
      status: "TRIAL",
      monthlyFee: Money.zero(),
      expiresAt,
      gracePeriodDays: 3,
    });
  }

  public isServiceAccessible(now: Date = new Date()): boolean {
    if (
      this._props.status === "SUSPENDED" ||
      this._props.status === "CANCELLED"
    ) {
      return false;
    }

    if (this._props.status === "ACTIVE" || this._props.status === "TRIAL") {
      const graceCutoff = new Date(this._props.expiresAt);
      graceCutoff.setDate(graceCutoff.getDate() + this._props.gracePeriodDays);
      return now <= graceCutoff;
    }

    return false;
  }

  public isExpiringSoon(
    daysThreshold: number = 7,
    now: Date = new Date(),
  ): boolean {
    if (this._props.status !== "ACTIVE" && this._props.status !== "TRIAL") {
      return false;
    }
    const diffMs = this._props.expiresAt.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= daysThreshold;
  }

  public activate(newExpiration: Date, fee: Money): void {
    this._props.status = "ACTIVE";
    this._props.expiresAt = newExpiration;
    this._props.monthlyFee = fee;
  }

  public suspend(): void {
    this._props.status = "SUSPENDED";
  }

  public cancel(): void {
    this._props.status = "CANCELLED";
  }

  public changePlan(newPlan: PlanTier, newFee: Money): void {
    this._props.planName = newPlan;
    this._props.monthlyFee = newFee;
  }

  public get planName(): PlanTier {
    return this._props.planName;
  }
  public get status(): SubscriptionState {
    return this._props.status;
  }
  public get monthlyFee(): Money {
    return this._props.monthlyFee;
  }
  public get expiresAt(): Date {
    return this._props.expiresAt;
  }
  public get gracePeriodDays(): number {
    return this._props.gracePeriodDays;
  }
}
