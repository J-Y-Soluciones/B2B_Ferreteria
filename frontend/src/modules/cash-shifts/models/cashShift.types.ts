//src/modules/cash-shifts/models/cashShift.types.ts
export type CashShiftStatus = "OPEN" | "CLOSED";

export interface CashShiftAudit {
  expectedCash: number;
  declaredCash: number;
  cashDifference: number;
  expectedCards: number;
  declaredCards: number;
  expectedYapePlin: number;
  declaredYapePlin: number;
}

export type ShiftAuditResult = CashShiftAudit;

export interface CashShift {
  id: string;
  tenantId: string;
  cashRegisterId: string;
  userId: string;
  status: CashShiftStatus;
  initialCash: number;
  openedAt: string;
  closedAt?: string;
  audit?: CashShiftAudit;
}

export interface OpenShiftPayload {
  cashRegisterId?: string;
  initialCash: number;
}

export interface CloseShiftPayload {
  shiftId: string;
  declaredCash: number;
  declaredCards: number;
  declaredYapePlin: number;
  notes: string;
}
