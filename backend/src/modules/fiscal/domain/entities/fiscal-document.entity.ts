export type FiscalDocType = "01" | "03";
export type FiscalCdrStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface FiscalDocumentProps {
  id: string;
  tenantId: string;
  saleId: string;
  docType: FiscalDocType;
  series: string;
  number: number;
  externalId: string | null;
  cdrStatus: FiscalCdrStatus;
  hashCpe: string | null;
  pdfUrl: string | null;
  xmlUrl: string | null;
  sunatErrorMessage: string | null;
  issuedAt: Date;
}

export class FiscalDocument {
  private constructor(private readonly props: FiscalDocumentProps) {
    Object.freeze(this);
  }

  public static rehydrate(props: FiscalDocumentProps): FiscalDocument {
    return new FiscalDocument(props);
  }

  public get id(): string {
    return this.props.id;
  }
  public get tenantId(): string {
    return this.props.tenantId;
  }
  public get saleId(): string {
    return this.props.saleId;
  }
  public get docType(): FiscalDocType {
    return this.props.docType;
  }
  public get series(): string {
    return this.props.series;
  }
  public get number(): number {
    return this.props.number;
  }
  public get externalId(): string | null {
    return this.props.externalId;
  }
  public get cdrStatus(): FiscalCdrStatus {
    return this.props.cdrStatus;
  }
  public get hashCpe(): string | null {
    return this.props.hashCpe;
  }
  public get pdfUrl(): string | null {
    return this.props.pdfUrl;
  }
  public get xmlUrl(): string | null {
    return this.props.xmlUrl;
  }
  public get sunatErrorMessage(): string | null {
    return this.props.sunatErrorMessage;
  }
  public get issuedAt(): Date {
    return this.props.issuedAt;
  }

  public canBeRetried(): boolean {
    return this.props.cdrStatus !== "ACCEPTED";
  }
}
