import type { FastifyReply, FastifyRequest } from "fastify";
import { KyselyCustomerRepository } from "../infrastructure/kysely-customer.repository.js";
import {
  getCustomersQuerySchema,
  createCustomerSchema,
  type GetCustomersQuery,
  type CreateCustomerInput,
} from "./customer.schema.js";

interface AuthenticatedTenantContext {
  tenantId: string;
  userId: string;
  role: string;
}

export class CustomerController {
  constructor(private readonly customerRepo: KyselyCustomerRepository) {}

  public handleList = async (
    request: FastifyRequest<{ Querystring: GetCustomersQuery }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const { tenantId } = (
      request as unknown as { tenantContext: AuthenticatedTenantContext }
    ).tenantContext;

    const validation = getCustomersQuerySchema.safeParse(request.query);
    const search = validation.success ? validation.data.q : undefined;

    const customers = await this.customerRepo.findAllByTenant(tenantId, search);

    return reply.status(200).send({ data: customers });
  };

  public handleGetById = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const { tenantId } = (
      request as unknown as { tenantContext: AuthenticatedTenantContext }
    ).tenantContext;
    const { id } = request.params;

    const customer = await this.customerRepo.findById(tenantId, id);

    if (!customer) {
      return reply.status(404).send({
        type: "https://api.jysoluciones.pe/errors/not-found",
        title: "Customer Not Found",
        status: 404,
        detail: `No se encontró el cliente con ID ${id}.`,
        instance: request.url,
      });
    }

    return reply.status(200).send(customer);
  };

  public handleCreate = async (
    request: FastifyRequest<{ Body: CreateCustomerInput }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const { tenantId } = (
      request as unknown as { tenantContext: AuthenticatedTenantContext }
    ).tenantContext;

    const validation = createCustomerSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.status(422).send({
        type: "https://api.jysoluciones.pe/errors/validation-failed",
        title: "Validation Failed",
        status: 422,
        detail: "Datos inválidos para la creación del cliente.",
        instance: request.url,
        invalid_params: validation.error.issues.map((i) => ({
          name: i.path.join("."),
          reason: i.message,
        })),
      });
    }

    const existing = await this.customerRepo.findByDocNumber(
      tenantId,
      validation.data.doc_number,
    );

    if (existing) {
      return reply.status(409).send({
        type: "https://api.jysoluciones.pe/errors/conflict",
        title: "Customer Already Exists",
        status: 409,
        detail: `Ya existe un cliente registrado con el documento ${validation.data.doc_number}.`,
        instance: request.url,
      });
    }

    const created = await this.customerRepo.createCustomer(
      tenantId,
      validation.data,
    );
    return reply.status(201).send(created);
  };
}
