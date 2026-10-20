// src/modules/fiscal/infrastructure/stub-fiscal-pse.client.ts
import { IFiscalPseClient } from "../domain/fiscal-pse-client.interface.js";
import {
  FiscalDocumentPayload,
  FiscalDispatchSuccessResponse,
} from "../domain/fiscal.types.js";

export class StubFiscalPseClient implements IFiscalPseClient {
  public async dispatchToPse(
    _tenantId: string,
    payload: FiscalDocumentPayload,
  ): Promise<FiscalDispatchSuccessResponse> {
    const isInvoice = payload.docType === "01";
    const series = isInvoice ? "F001" : "B001";
    const number = Math.floor(1000 + Math.random() * 9000);
    const externalId = `PSE-${series}-${number}`;

    return {
      series,
      number,
      externalId,
      cdrStatus: "ACCEPTED",
      hashCpe: "ab789cde99201f82" + Math.random().toString(36).substring(2, 10),
      pdfUrl: `https://storage.jysoluciones.pe/cpe/${series}-${number}.pdf`,
      xmlUrl: `https://storage.jysoluciones.pe/cpe/${series}-${number}.xml`,
      sunatErrorMessage: null,
    };
  }
}
