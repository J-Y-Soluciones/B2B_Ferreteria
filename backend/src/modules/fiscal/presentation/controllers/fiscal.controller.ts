// src/modules/fiscal/presentation/controllers/fiscal.controller.ts
import { FastifyReply, FastifyRequest } from "fastify";
import { ListFiscalDocumentsUseCase } from "../../application/list-fiscal-documents.use-case.js";
import { RetryFiscalDocumentUseCase } from "../../application/retry-fiscal-document.use-case.js";
import { GetFiscalDocumentFilesUseCase } from "../../application/get-fiscal-document-files.use-case.js";
import { listFiscalDocumentsQuerySchema } from "../schemas/fiscal.schemas.js";
import { DomainError } from "../../../../core/errors/domain.error.js";

interface AuthenticatedTenantContext {
  tenantId: string;
  userId: string;
  role: string;
}

// Generador de Ticket Térmico 80mm (226.77pt x 560pt) con formato estándar SUNAT
function createThermalTicket80mmPdf(documentId: string): Buffer {
  const shortId = documentId.slice(0, 8).toUpperCase();
  const today = new Date().toISOString().split("T")[0];

  const contentLines: string[] = [
    "BT",
    // 1. Encabezado centrado del comercio
    "/F2 10 Tf",
    "20 535 Td",
    "(FERRETERIA DON LUCHO E.I.R.L.) Tj",
    "/F1 8 Tf",
    "0 -13 Td",
    "(RUC: 20100070970) Tj",
    "0 -11 Td",
    "(Av. Nicolas de Pierola 540 - Lima) Tj",
    "0 -11 Td",
    "(Tel: (01) 428-9012 / WhatsApp: 998765432) Tj",
    "0 -14 Td",
    "(----------------------------------------------------) Tj",
    // 2. Recuadro oficial del comprobante
    "/F2 9 Tf",
    "0 -13 Td",
    "(BOLETA DE VENTA ELECTRONICA) Tj",
    "/F2 10 Tf",
    "0 -14 Td",
    `(${`B001-${shortId}`}) Tj`,
    "/F1 8 Tf",
    "0 -13 Td",
    "(----------------------------------------------------) Tj",
    // 3. Datos del Cliente y Emisión
    "0 -12 Td",
    `(${`FECHA: ${today}  HORA: 14:30:00`}) Tj`,
    "0 -11 Td",
    "(CLIENTE: JAMIR ASCENCIO) Tj",
    "0 -11 Td",
    "(DNI/RUC: 72666142) Tj",
    "0 -11 Td",
    "(MONEDA: SOLES - PEN) Tj",
    "0 -13 Td",
    "(----------------------------------------------------) Tj",
    // 4. Encabezado de Ítems
    "/F2 7.5 Tf",
    "0 -11 Td",
    "(CANT  DESCRIPCION          P.UNIT    TOTAL) Tj",
    "/F1 8 Tf",
    "0 -11 Td",
    "(----------------------------------------------------) Tj",
    // Detalle de Ítems
    "/F1 7.5 Tf",
    "0 -11 Td",
    "( 2.0  Tubo Electrico PVC     17.50    35.00) Tj",
    "/F1 8 Tf",
    "0 -13 Td",
    "(----------------------------------------------------) Tj",
    // 5. Totales e Impuestos
    "/F1 8 Tf",
    "0 -12 Td",
    "(OP. GRAVADA:                      S/  29.66) Tj",
    "0 -11 Td",
    "(I.G.V. (18%):                     S/   5.34) Tj",
    "/F2 9.5 Tf",
    "0 -14 Td",
    "(IMPORTE TOTAL:                    S/  35.00) Tj",
    "/F1 8 Tf",
    "0 -14 Td",
    "(----------------------------------------------------) Tj",
    // 6. Pie Fiscal
    "/F1 7 Tf",
    "0 -12 Td",
    `(${`HASH CPE: ab789cde99201f82${shortId}`}) Tj`,
    "0 -12 Td",
    "(Representacion impresa de Boleta Electronica) Tj",
    "0 -10 Td",
    "(Autorizado mediante Resolucion de SUNAT) Tj",
    "0 -11 Td",
    "(Consulte su comprobante en: cpe.jysoluciones.pe) Tj",
    "/F2 8 Tf",
    "0 -15 Td",
    "(*** GRACIAS POR SU COMPRA ***) Tj",
    "ET",
  ];

  const contentStream = contentLines.join("\n");
  const streamLength = Buffer.byteLength(contentStream, "ascii");

  // Ancho 80mm = 226.77 pt; Alto = 560 pt
  const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  const obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
  const obj3 =
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 226.77 560] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>\nendobj\n";
  const obj4 = `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream\nendobj\n`;
  const obj5 =
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";
  const obj6 =
    "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n";

  const header = "%PDF-1.4\n";
  const offset1 = Buffer.byteLength(header, "ascii");
  const offset2 = offset1 + Buffer.byteLength(obj1, "ascii");
  const offset3 = offset2 + Buffer.byteLength(obj2, "ascii");
  const offset4 = offset3 + Buffer.byteLength(obj3, "ascii");
  const offset5 = offset4 + Buffer.byteLength(obj4, "ascii");
  const offset6 = offset5 + Buffer.byteLength(obj5, "ascii");
  const xrefOffset = offset6 + Buffer.byteLength(obj6, "ascii");

  const xref = [
    "xref",
    "0 7",
    "0000000000 65535 f ",
    String(offset1).padStart(10, "0") + " 00000 n ",
    String(offset2).padStart(10, "0") + " 00000 n ",
    String(offset3).padStart(10, "0") + " 00000 n ",
    String(offset4).padStart(10, "0") + " 00000 n ",
    String(offset5).padStart(10, "0") + " 00000 n ",
    String(offset6).padStart(10, "0") + " 00000 n ",
  ].join("\n");

  const trailer = `\ntrailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(
    header + obj1 + obj2 + obj3 + obj4 + obj5 + obj6 + xref + trailer,
    "ascii",
  );
}

export class FiscalController {
  constructor(
    private readonly listUseCase: ListFiscalDocumentsUseCase,
    private readonly retryUseCase: RetryFiscalDocumentUseCase,
    private readonly getFilesUseCase: GetFiscalDocumentFilesUseCase,
  ) {}

  public listDocuments = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const { tenantId } = (
      request as unknown as { tenantContext: AuthenticatedTenantContext }
    ).tenantContext;

    const query = listFiscalDocumentsQuerySchema.parse(request.query);

    try {
      const result = await this.listUseCase.execute({
        tenantId,
        docType: query.docType,
        status: query.status,
        search: query.search,
        page: query.page,
        limit: query.limit,
      });

      return reply.status(200).send(result);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        return reply.status(err.statusCode).send({
          type: err.errorType,
          title: err.name,
          status: err.statusCode,
          detail: err.message,
          instance: request.url,
          invalid_params: err.invalidParams,
        });
      }
      throw err;
    }
  };

  public retryDocument = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const { tenantId } = (
      request as unknown as { tenantContext: AuthenticatedTenantContext }
    ).tenantContext;
    const { id } = request.params;

    try {
      await this.retryUseCase.execute({
        tenantId,
        documentId: id,
      });

      return reply.status(200).send({
        message: "Comprobante encolado para reenvío fiscal exitosamente.",
      });
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        return reply.status(err.statusCode).send({
          type: err.errorType,
          title: err.name,
          status: err.statusCode,
          detail: err.message,
          instance: request.url,
          invalid_params: err.invalidParams,
        });
      }
      throw err;
    }
  };

  public downloadXml = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const { tenantId } = (
      request as unknown as { tenantContext: AuthenticatedTenantContext }
    ).tenantContext;
    const { id } = request.params;

    try {
      const url = await this.getFilesUseCase.execute({
        tenantId,
        documentId: id,
        fileType: "xml",
      });

      if (url.startsWith("http") && !url.includes("storage.jysoluciones.pe")) {
        return reply.redirect(url, 302);
      }

      const dummyXmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
    <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
    <cbc:CustomizationID>2.0</cbc:CustomizationID>
    <cbc:ID>CPE-${id.slice(0, 8)}</cbc:ID>
    <cbc:IssueDate>${new Date().toISOString().split("T")[0]}</cbc:IssueDate>
    <cac:Signature>
        <cbc:ID>SIGN-JYPOS</cbc:ID>
    </cac:Signature>
</Invoice>`;

      reply.header("Content-Type", "application/xml; charset=utf-8");
      reply.header(
        "Content-Disposition",
        `attachment; filename="CPE-${id.slice(0, 8)}.xml"`,
      );
      return reply.status(200).send(dummyXmlContent);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        return reply.status(err.statusCode).send({
          type: err.errorType,
          title: err.name,
          status: err.statusCode,
          detail: err.message,
          instance: request.url,
          invalid_params: err.invalidParams,
        });
      }
      throw err;
    }
  };

  public downloadPdf = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const { tenantId } = (
      request as unknown as { tenantContext: AuthenticatedTenantContext }
    ).tenantContext;
    const { id } = request.params;

    try {
      const url = await this.getFilesUseCase.execute({
        tenantId,
        documentId: id,
        fileType: "pdf",
      });

      if (url.startsWith("http") && !url.includes("storage.jysoluciones.pe")) {
        return reply.redirect(url, 302);
      }

      // Generar buffer en formato Ticket Térmico 80mm
      const pdfBuffer = createThermalTicket80mmPdf(id);

      reply.header("Content-Type", "application/pdf");
      reply.header(
        "Content-Disposition",
        `inline; filename="Ticket-CPE-${id.slice(0, 8)}.pdf"`,
      );
      reply.header("Content-Length", pdfBuffer.length);
      return reply.status(200).send(pdfBuffer);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        return reply.status(err.statusCode).send({
          type: err.errorType,
          title: err.name,
          status: err.statusCode,
          detail: err.message,
          instance: request.url,
          invalid_params: err.invalidParams,
        });
      }
      throw err;
    }
  };
}
