import { FastifyReply, FastifyRequest } from "fastify";
import { OnboardTenantUseCase } from "../../application/use-cases/onboard-tenant.use-case.js";
import { UpdateSubscriptionStatusUseCase } from "../../application/use-cases/update-subscription-status.use-case.js";
import { UpdateTenantModulesUseCase } from "../../application/use-cases/update-tenant-modules.use-case.js";
import { IPlatformTenantRepository } from "../../domain/ports/platform-tenant.repository.port.js";
import { ITokenService } from "../../../identity/domain/security.interfaces.js";
import { DomainError } from "../../../../core/errors/domain.error.js";
import { ImpersonateTenantUseCase } from "../../application/use-cases/impersonate-tenant.use-case.js"; // 👈 Nuevo import
import { UpdateTenantFullUseCase } from "../../application/use-cases/update-tenant-full.use-case.js";
import { updateTenantFullSchema } from "../schemas/platform-tenant.schemas.js";

import {
  listTenantsQuerySchema,
  onboardTenantSchema,
  updateSubscriptionStatusSchema,
  updateTenantModulesSchema,
} from "../schemas/platform-tenant.schemas.js";

export class PlatformTenantController {
  constructor(
    private readonly onboardTenantUseCase: OnboardTenantUseCase,
    private readonly updateSubscriptionStatusUseCase: UpdateSubscriptionStatusUseCase,
    private readonly updateTenantModulesUseCase: UpdateTenantModulesUseCase,
    private readonly impersonateTenantUseCase: ImpersonateTenantUseCase,
    private readonly updateTenantFullUseCase: UpdateTenantFullUseCase, // 👈 5º argumento
    private readonly tenantRepo: IPlatformTenantRepository, // 👈 6º argumento
    private readonly tokenService: ITokenService, // 👈 7º argumento
  ) {}

  public async listTenants(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const query = listTenantsQuerySchema.parse(request.query);

    const { tenants, total } = await this.tenantRepo.findAll({
      status: query.status,
      searchTerm: query.search,
      limit: query.limit,
      offset: query.offset,
    });

    // Contrato estricto esperado por el frontend
    reply.status(200).send({
      items: tenants.map((t) => ({
        id: t.id,
        ruc: t.ruc.value,
        business_name: t.businessName,
        trade_name: t.tradeName,
        admin_email:
          "admin@" + t.tradeName.toLowerCase().replace(/\s+/g, "") + ".pe",
        profile: t.profile,
        plan_name: t.subscription.planName,
        status: t.subscription.status,
        expires_at: t.subscription.expiresAt.toISOString(),
        monthly_fee_pen: t.subscription.monthlyFee.amount,
        days_overdue: 0,
        trial_days_remaining: 0,
        modules: {
          sunat: t.moduleSunat,
          credits: t.moduleCredits,
          multiwarehouse: t.moduleMultiwarehouse,
          allow_negative_stock: t.allowNegativeStock, // 👈 CORREGIDO: Ahora lee el estado real de BD
        },
        quotas: {
          current_registers: 1,
          max_registers: t.maxCashRegisters,
          current_users: 1,
          max_users: t.maxUsers,
        },
        created_at: t.createdAt.toISOString(),
      })),
      total,
    });
  }

  public async getTenantById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { id } = request.params;
    const t = await this.tenantRepo.findById(id);

    if (!t) {
      return reply.status(404).send({
        type: "https://api.jysoluciones.pe/errors/not-found",
        title: "Tenant Not Found",
        status: 404,
        detail: `Comercio con ID '${id}' no encontrado.`,
        instance: request.url,
      });
    }

    reply.status(200).send({
      id: t.id,
      business_name: t.businessName,
      trade_name: t.tradeName,
      ruc: t.ruc.value,
      profile: t.profile,
      subscription_status: t.subscription.status,
      plan_name: t.subscription.planName,
      monthly_fee: t.subscription.monthlyFee.amount,
      subscription_expires_at: t.subscription.expiresAt.toISOString(),
      grace_period_days: t.subscription.gracePeriodDays,
      module_sunat: t.moduleSunat,
      module_credits: t.moduleCredits,
      module_multiwarehouse: t.moduleMultiwarehouse,
      max_cash_registers: t.maxCashRegisters,
      max_users: t.maxUsers,
      created_at: t.createdAt.toISOString(),
    });
  }

  public async onboardTenant(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const body = onboardTenantSchema.parse(request.body);
    const platformCtx = request.platformContext;
    const superadminId =
      platformCtx?.superadminId ||
      (request as any).user?.sub ||
      (request as any).user?.id ||
      "superadmin-system";

    const result = await this.onboardTenantUseCase.execute({
      superadminId,
      ipAddress: request.ip || "127.0.0.1",
      userAgent: (request.headers["user-agent"] as string) || "unknown",
      businessName: body.business_name,
      tradeName: body.trade_name,
      ruc: body.ruc,
      profile: body.profile,
      planName: body.plan_name,
      warehouseName: body.warehouse_name,
      warehouseAddress: body.warehouse_address,
      cashRegisterName: body.cash_register_name,
      adminFullName: body.admin_full_name,
      adminEmail: body.admin_email,
      adminPasswordPlain: body.admin_password_plain,
      sendInvitationEmail: body.send_invitation_email,
      moduleSunat: body.module_sunat,
      moduleCredits: body.module_credits,
      moduleMultiwarehouse: body.module_multiwarehouse,
      allowNegativeStock: body.allow_negative_stock,
    });

    reply.status(201).send(result);
  }

  public async updateStatus(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { id } = request.params;
    const body = updateSubscriptionStatusSchema.parse(request.body);
    const platformCtx = request.platformContext!;

    await this.updateSubscriptionStatusUseCase.execute({
      superadminId: platformCtx.superadminId,
      ipAddress: request.ip,
      userAgent: request.headers["user-agent"] || "unknown",
      tenantId: id,
      status: body.status,
      reason: body.reason,
      newExpiresAt: body.new_expires_at
        ? new Date(body.new_expires_at)
        : undefined,
      newMonthlyFee: body.new_monthly_fee,
    });

    reply
      .status(200)
      .send({ message: "Estado de suscripción actualizado exitosamente." });
  }

  public async updateModules(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { id } = request.params;
    const body = updateTenantModulesSchema.parse(request.body);
    const platformCtx = request.platformContext!;

    await this.updateTenantModulesUseCase.execute({
      superadminId: platformCtx.superadminId,
      ipAddress: request.ip,
      userAgent: request.headers["user-agent"] || "unknown",
      tenantId: id,
      moduleSunat: body.module_sunat,
      moduleCredits: body.module_credits,
      moduleMultiwarehouse: body.module_multiwarehouse,
      maxCashRegisters: body.max_cash_registers,
      maxUsers: body.max_users,
      allowNegativeStock: body.allow_negative_stock,
    });

    reply
      .status(200)
      .send({ message: "Módulos y límites del comercio actualizados." });
  }
  public async impersonateTenant(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { id } = request.params;
    const platformCtx = request.platformContext!;

    try {
      const result = await this.impersonateTenantUseCase.execute({
        superadminId: platformCtx.superadminId,
        tenantId: id,
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"] || "unknown",
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
  }

  public async updateTenant(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { id } = request.params;

    const parseResult = updateTenantFullSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(422).send({
        type: "https://api.jysoluciones.pe/errors/validation-failed",
        title: "Validation Failed",
        status: 422,
        detail: "Datos inválidos en la actualización del comercio.",
        instance: request.url,
        invalid_params: parseResult.error.issues.map((i) => ({
          name: i.path.join("."),
          reason: i.message,
        })),
      });
    }

    // Extracción segura sin riesgo de TypeError
    const superadminId =
      request.platformContext?.superadminId ||
      (request as any).user?.sub ||
      (request as any).user?.id ||
      "superadmin-system";

    try {
      const updated = await this.updateTenantFullUseCase.execute({
        tenantId: id,
        superadminId,
        ipAddress: request.ip || "127.0.0.1",
        userAgent: (request.headers["user-agent"] as string) || "unknown",
        ...parseResult.data,
      });

      return reply.status(200).send(updated);
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

      request.log.error(err);
      return reply.status(400).send({
        type: "https://api.jysoluciones.pe/errors/bad-request",
        title: "Error al actualizar comercio",
        status: 400,
        detail:
          err instanceof Error
            ? err.message
            : "Error interno al actualizar el comercio.",
        instance: request.url,
      });
    }
  }
}
