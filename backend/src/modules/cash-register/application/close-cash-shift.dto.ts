export interface CloseCashShiftCommand {
  tenantId: string;
  shiftId: string;
  userId: string;
  declaredCash: number;
  declaredCards: number;
  declaredYapePlin: number;
  notes: string | null;
}

export interface CloseCashShiftResult {
  id: string;
  status: "CLOSED";
  closedAt: string;
  audit: {
    expectedCash: number;
    declaredCash: number;
    cashDifference: number;
    expectedCards: number;
    declaredCards: number;
    expectedYapePlin: number;
    declaredYapePlin: number;
  };
}
