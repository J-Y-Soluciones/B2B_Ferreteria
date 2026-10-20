import type {
  CashShift,
  OpenShiftPayload,
  CloseShiftPayload,
} from "../models/cashShift.types";

export interface ICashShiftRepository {
  getCurrentShift(): Promise<CashShift | null>;
  openShift(payload: OpenShiftPayload): Promise<CashShift>;
  closeShift(payload: CloseShiftPayload): Promise<CashShift>;
}
