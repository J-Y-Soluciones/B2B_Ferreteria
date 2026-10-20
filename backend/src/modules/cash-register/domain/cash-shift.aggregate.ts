import { Money } from "../../../shared/domain/value-objects/money.vo.js";
import {
  ShiftClosedError,
  DomainValidationError,
} from "../../../core/errors/domain.error.js";

export type ShiftStatus = "OPEN" | "CLOSED";

export interface CashShiftProps {
  id: string;
  tenantId: string;
  cashRegisterId: string;
  userId: string;
  status: ShiftStatus;
  initialCash: Money;
  openedAt: Date;
  closedAt: Date | null;
  declaredCash: Money | null;
  declaredCards: Money | null;
  declaredYapePlin: Money | null;
  expectedCash: Money | null;
  expectedCards: Money | null;
  expectedYapePlin: Money | null;
  cashDifference: number | null; // Puede ser negativo (faltante)
  notes: string | null;
}

export class CashShift {
  private constructor(private props: CashShiftProps) {}

  public static rehydrate(props: CashShiftProps): CashShift {
    return new CashShift({ ...props });
  }

  public static open(
    props: Omit<
      CashShiftProps,
      | "status"
      | "closedAt"
      | "declaredCash"
      | "declaredCards"
      | "declaredYapePlin"
      | "expectedCash"
      | "expectedCards"
      | "expectedYapePlin"
      | "cashDifference"
      | "notes"
    >,
  ): CashShift {
    return new CashShift({
      ...props,
      status: "OPEN",
      closedAt: null,
      declaredCash: null,
      declaredCards: null,
      declaredYapePlin: null,
      expectedCash: null,
      expectedCards: null,
      expectedYapePlin: null,
      cashDifference: null,
      notes: null,
    });
  }

  public get id(): string {
    return this.props.id;
  }
  public get tenantId(): string {
    return this.props.tenantId;
  }
  public get status(): ShiftStatus {
    return this.props.status;
  }

  public ensureIsOpen(): void {
    if (this.props.status !== "OPEN") {
      throw new ShiftClosedError(this.props.id);
    }
  }

  public closeBlind(
    declared: { cash: Money; cards: Money; yapePlin: Money },
    expected: { cash: Money; cards: Money; yapePlin: Money },
    notes: string | null,
  ): void {
    this.ensureIsOpen();

    const diff = declared.cash.amount - expected.cash.amount;

    this.props.status = "CLOSED";
    this.props.closedAt = new Date();
    this.props.declaredCash = declared.cash;
    this.props.declaredCards = declared.cards;
    this.props.declaredYapePlin = declared.yapePlin;
    this.props.expectedCash = expected.cash;
    this.props.expectedCards = expected.cards;
    this.props.expectedYapePlin = expected.yapePlin;
    this.props.cashDifference = Math.round(diff * 100) / 100;
    this.props.notes = notes;
  }

  public toSnapshot(): Readonly<CashShiftProps> {
    return Object.freeze({ ...this.props });
  }
}
