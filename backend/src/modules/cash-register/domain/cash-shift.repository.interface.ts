import { CashShift } from "./cash-shift.aggregate.js";
import { Money } from "../../../shared/domain/value-objects/money.vo.js";

export interface ShiftTheoreticalBalance {
  expectedCash: Money;
  expectedCards: Money;
  expectedYapePlin: Money;
}

export interface CashMovementRecord {
  id: string;
  shiftId: string;
  movementType: "INITIAL_FLOAT" | "INFLOW" | "OUTFLOW" | "DEBT_COLLECTION";
  amount: Money;
  reason: string;
}

export interface ICashShiftRepository {
  findById(tenantId: string, id: string): Promise<CashShift | null>;
  findActiveByRegisterOrUser(
    tenantId: string,
    cashRegisterId: string,
    userId: string,
  ): Promise<CashShift | null>;
  create(shift: CashShift): Promise<void>;
  lockShift(tenantId: string, id: string): Promise<CashShift | null>;
  calculateExpectedTotals(
    tenantId: string,
    shiftId: string,
  ): Promise<ShiftTheoreticalBalance>;
  update(shift: CashShift): Promise<void>;
  recordMovement(tenantId: string, movement: CashMovementRecord): Promise<void>;
}
