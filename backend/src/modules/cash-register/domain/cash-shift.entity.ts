import { Money } from "../../../shared/domain/money.vo.js";

export interface CashShiftProps {
  id: string;
  tenantId: string;
  cashRegisterId: string;
  userId: string;
  openedAt: Date;
  closedAt?: Date;
  initialCash: Money;
  systemExpectedCash?: Money;
  declaredCash?: Money; // Arqueo ciego ingresado por cajero al cerrar
  difference?: Money;
  status: "OPEN" | "CLOSED";
}

export class CashShift {
  private constructor(private props: CashShiftProps) {}

  public static open(
    props: Omit<CashShiftProps, "openedAt" | "status">,
  ): CashShift {
    return new CashShift({
      ...props,
      openedAt: new Date(),
      status: "OPEN",
    });
  }

  public close(declaredCash: Money, systemExpectedCash: Money): void {
    if (this.props.status === "CLOSED") {
      throw new Error("El turno ya se encuentra cerrado");
    }

    this.props.closedAt = new Date();
    this.props.systemExpectedCash = systemExpectedCash;
    this.props.declaredCash = declaredCash;
    this.props.difference = declaredCash.subtract(systemExpectedCash);
    this.props.status = "CLOSED";
  }

  get id(): string {
    return this.props.id;
  }
  get isOpen(): boolean {
    return this.props.status === "OPEN";
  }
  get tenantId(): string {
    return this.props.tenantId;
  }
}
