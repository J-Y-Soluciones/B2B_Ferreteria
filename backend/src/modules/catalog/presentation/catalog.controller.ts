import { FastifyReply, FastifyRequest } from "fastify";
import { ScanProductUseCase } from "../application/scan-product.use-case.js";
import { SearchProductsUseCase } from "../application/search-products.use-case.js";
import { CreateProductUseCase } from "../application/create-product.use-case.js";
import { UpdateProductUseCase } from "../application/update-product.use-case.js";
import {
  scanProductQuerySchema,
  searchProductsQuerySchema,
  ScanProductQueryParams,
  SearchProductsQueryParams,
} from "./catalog.schema.js";
import {
  createProductSchema,
  updateProductSchema,
  CreateProductInput,
  UpdateProductInput,
} from "./create-product.schema.js";
import { formatProductResponse } from "./catalog.serializer.js";
import { DomainError } from "../../../core/errors/domain.error.js";
import { z } from "zod";

interface AuthenticatedTenantContext {
  tenantId: string;
  userId: string;
  role: string;
}

export class CatalogController {
  constructor(
    private readonly scanUseCase: ScanProductUseCase,
    private readonly searchUseCase: SearchProductsUseCase,
    private readonly createUseCase: CreateProductUseCase,
    private readonly updateUseCase: UpdateProductUseCase,
  ) {}

  public handleScan = async (
    request: FastifyRequest<{ Querystring: ScanProductQueryParams }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const { tenantId } = (
      request as unknown as { tenantContext: AuthenticatedTenantContext }
    ).tenantContext;
    const validation = scanProductQuerySchema.safeParse(request.query);
    if (!validation.success) {
      reply.status(422).send({
        type: "https://api.jysoluciones.pe/errors/validation-failed",
        title: "Validation Failed",
        status: 422,
        detail: "Parámetros inválidos para escaneo de producto.",
        instance: request.url,
        invalid_params: validation.error.issues.map((i: z.ZodIssue) => ({
          name: i.path.join("."),
          reason: i.message,
        })),
      });
      return;
    }

    try {
      const result = await this.scanUseCase.execute({
        tenantId,
        barcode: validation.data.barcode,
        warehouseId: validation.data.warehouse_id,
      });
      reply.status(200).send(formatProductResponse(result));
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        reply.status(err.statusCode).send({
          type: err.errorType,
          title: err.name,
          status: err.statusCode,
          detail: err.message,
          instance: request.url,
          invalid_params: err.invalidParams,
        });
        return;
      }
      throw err;
    }
  };

  public handleSearch = async (
    request: FastifyRequest<{ Querystring: SearchProductsQueryParams }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const { tenantId } = (
      request as unknown as { tenantContext: AuthenticatedTenantContext }
    ).tenantContext;
    const validation = searchProductsQuerySchema.safeParse(request.query);
    if (!validation.success) {
      reply.status(422).send({
        type: "https://api.jysoluciones.pe/errors/validation-failed",
        title: "Validation Failed",
        status: 422,
        detail: "Parámetros inválidos para búsqueda de catálogo.",
        instance: request.url,
        invalid_params: validation.error.issues.map((i: z.ZodIssue) => ({
          name: i.path.join("."),
          reason: i.message,
        })),
      });
      return;
    }

    try {
      const rawResults = await this.searchUseCase.execute({
        tenantId,
        term: validation.data.term,
        warehouseId: validation.data.warehouse_id,
        limit: validation.data.limit,
      });

      const formattedResults = (
        Array.isArray(rawResults) ? rawResults : []
      ).map(formatProductResponse);
      reply.status(200).send(formattedResults);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        reply.status(err.statusCode).send({
          type: err.errorType,
          title: err.name,
          status: err.statusCode,
          detail: err.message,
          instance: request.url,
          invalid_params: err.invalidParams,
        });
        return;
      }
      throw err;
    }
  };

  public handleCreate = async (
    request: FastifyRequest<{ Body: CreateProductInput }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const { tenantId } = (
      request as unknown as { tenantContext: AuthenticatedTenantContext }
    ).tenantContext;
    const validation = createProductSchema.safeParse(request.body);

    if (!validation.success) {
      reply.status(422).send({
        type: "https://api.jysoluciones.pe/errors/validation-failed",
        title: "Validation Failed",
        status: 422,
        detail: "El cuerpo de la solicitud no cumple con el esquema requerido.",
        instance: request.url,
        invalid_params: validation.error.issues.map((i: z.ZodIssue) => ({
          name: i.path.join("."),
          reason: i.message,
        })),
      });
      return;
    }

    try {
      const result = await this.createUseCase.execute({
        tenantId,
        ...validation.data,
      });
      reply.status(201).send(result);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        reply.status(err.statusCode).send({
          type: err.errorType,
          title: err.name,
          status: err.statusCode,
          detail: err.message,
          instance: request.url,
          invalid_params: err.invalidParams,
        });
        return;
      }
      throw err;
    }
  };

  public handleUpdate = async (
    request: FastifyRequest<{
      Params: { id: string };
      Body: UpdateProductInput;
    }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const { tenantId } = (
      request as unknown as { tenantContext: AuthenticatedTenantContext }
    ).tenantContext;
    const { id } = request.params;
    const validation = updateProductSchema.safeParse(request.body);

    if (!validation.success) {
      reply.status(422).send({
        type: "https://api.jysoluciones.pe/errors/validation-failed",
        title: "Validation Failed",
        status: 422,
        detail: "El cuerpo de la solicitud no cumple con el esquema requerido.",
        instance: request.url,
        invalid_params: validation.error.issues.map((i: z.ZodIssue) => ({
          name: i.path.join("."),
          reason: i.message,
        })),
      });
      return;
    }

    try {
      await this.updateUseCase.execute({
        tenantId,
        productId: id,
        ...validation.data,
      });
      reply.status(204).send();
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        reply.status(err.statusCode).send({
          type: err.errorType,
          title: err.name,
          status: err.statusCode,
          detail: err.message,
          instance: request.url,
          invalid_params: err.invalidParams,
        });
        return;
      }
      throw err;
    }
  };
}
