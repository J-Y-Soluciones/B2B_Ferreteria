export interface FiscalDispatchItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface FiscalDocumentPayload {
  saleId: string;
  docType: "01" | "03"; // 01: Factura, 03: Boleta
  customerDocNumber: string;
  customerName: string;
  items: FiscalDispatchItem[];
  total: number;
}

export interface FiscalDispatchSuccessResponse {
  externalId: string;
  series: string;
  number: number;
  cdrStatus: "ACCEPTED" | "REJECTED";
  hashCpe: string;
  pdfUrl: string;
  xmlUrl: string;
  sunatErrorMessage: string | null;
}

export class FiscalNonRetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FiscalNonRetryableError";
  }
}
