export interface OpenCashShiftCommand {
  tenantId: string;
  userId: string;
  cashRegisterId?: string;
  initialCash: number;
}

export interface OpenCashShiftResult {
  shiftId: string;
  cashRegisterId?: string;
  userId: string;
  status: "OPEN";
  initialCash: number;
  openedAt: string;
}
