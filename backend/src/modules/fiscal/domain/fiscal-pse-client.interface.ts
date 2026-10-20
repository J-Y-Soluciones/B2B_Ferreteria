import {
  FiscalDocumentPayload,
  FiscalDispatchSuccessResponse,
} from "./fiscal.types.js";

export interface IFiscalPseClient {
  dispatchToPse(
    tenantId: string,
    payload: FiscalDocumentPayload,
  ): Promise<FiscalDispatchSuccessResponse>;
}
