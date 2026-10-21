import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import { Argon2PasswordHasher } from "../src/modules/identity/infrastructure/argon2-password-hasher.js";
import { DatabaseSchema } from "../src/shared/infrastructure/database/database.types.js";
import { env } from "../src/core/config/env.js";

// Identificadores deterministas para pruebas e integración
export const SEED_IDS = {
  // SUPERADMIN GLOBAL
  USER_SUPERADMIN: "00000000-0000-4000-8000-000000000001",

  // TENANT 1: LUBRICENTRO EL PISTÓN (ACTIVO - PRO)
  TENANT_PISTON: "22222222-2222-4222-8222-222222222222",
  USER_PISTON_ADMIN: "22222222-aaaa-4aaa-8aaa-222222222222",
  USER_PISTON_CASHIER1: "22222222-bbbb-4bbb-8bbb-222222222221",
  USER_PISTON_CASHIER2: "22222222-bbbb-4bbb-8bbb-222222222222",
  USER_PISTON_OPERATOR: "22222222-cccc-4ccc-8ccc-222222222223",
  WH_PISTON_MAIN: "22222222-cccc-4ccc-8ccc-222222222221",
  WH_PISTON_SECONDARY: "22222222-cccc-4ccc-8ccc-222222222222",
  REG_PISTON_1: "22222222-eeee-4eee-8eee-222222222221",
  REG_PISTON_2: "22222222-eeee-4eee-8eee-222222222222",

  // TENANT 2: FERRETERÍA DON LUCHO (TRIAL - BASIC - Vence en 7 días)
  TENANT_DON_LUCHO: "11111111-1111-4111-8111-111111111111",
  USER_LUCHO_ADMIN: "11111111-aaaa-4aaa-8aaa-111111111111",
  USER_LUCHO_CASHIER: "11111111-bbbb-4bbb-8bbb-111111111111",
  WH_LUCHO_MAIN: "11111111-cccc-4ccc-8ccc-111111111111",
  REG_LUCHO_1: "11111111-eeee-4eee-8eee-111111111111",

  // TENANT 3: MATERIALES & ACABADOS RAMOS (SUSPENDIDO - Mora 10 días)
  TENANT_RAMOS: "33333333-3333-4333-8333-333333333333",
  USER_RAMOS_ADMIN: "33333333-aaaa-4aaa-8aaa-333333333333",
  WH_RAMOS_MAIN: "33333333-cccc-4ccc-8ccc-333333333333",
  REG_RAMOS_1: "33333333-eeee-4eee-8eee-333333333333",
};

async function seed() {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const db = new Kysely<DatabaseSchema>({
    dialect: new PostgresDialect({ pool }),
  });

  const hasher = new Argon2PasswordHasher();

  // Hash de contraseñas
  const rawSuperadminPassword =
    process.env.SEED_SUPERADMIN_PASSWORD || "AdminSuper2026!";
  const rawTenantPassword = process.env.SEED_TENANT_PASSWORD || "password123";

  const superadminPasswordHash = await hasher.hash(rawSuperadminPassword);
  const defaultTenantPasswordHash = await hasher.hash(rawTenantPassword);

  console.log("🔄 Iniciando sembrado determinista con Superadmin y Tenants...");

  try {
    // 1. Limpieza en orden inverso de claves foráneas para idempotencia total
    await db.deleteFrom("platform_audit_logs").execute();
    await db.deleteFrom("email_tokens").execute();
    await db.deleteFrom("inventory_movements").execute();
    await db.deleteFrom("sale_payments").execute();
    await db.deleteFrom("sale_items").execute();
    await db.deleteFrom("fiscal_documents").execute();
    await db.deleteFrom("fiscal_outbox").execute();
    await db.deleteFrom("debt_payments").execute();
    await db.deleteFrom("credit_accounts").execute();
    await db.deleteFrom("sales").execute();
    await db.deleteFrom("cash_movements").execute();
    await db.deleteFrom("cash_shifts").execute();
    await db.deleteFrom("inventories").execute();
    await db.deleteFrom("product_conversions").execute();
    await db.deleteFrom("products").execute();
    await db.deleteFrom("categories").execute();
    await db.deleteFrom("cash_registers").execute();
    await db.deleteFrom("warehouses").execute();
    await db.deleteFrom("customers").execute();
    await db.deleteFrom("users").execute();
    await db.deleteFrom("tenants").execute();

    const now = new Date();

    // 2. TENANTS (Con campos de suscripción, límites y add-ons)
    // Fechas calculadas para estados de prueba
    const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 2. TENANTS
    await db
      .insertInto("tenants")
      .values([
        // Tenant 1: ACTIVO (PRO)
        {
          id: SEED_IDS.TENANT_PISTON,
          business_name: "Lubricentro El Pistón S.A.C.",
          trade_name: "Lubricentro El Pistón",
          ruc: "20608912348", // 👈 Válido (termina en 8)
          profile: "LUBRICENTER",
          subscription_status: "ACTIVE",
          plan_name: "PRO",
          monthly_fee: "349.00",
          subscription_expires_at: inThirtyDays,
          grace_period_days: 3,
          max_cash_registers: 2,
          max_users: 4,
          module_sunat: true,
          module_credits: true,
          module_multiwarehouse: true,
          allow_negative_stock: false,
        },
        // Tenant 2: EN TRIAL (BASIC)
        {
          id: SEED_IDS.TENANT_DON_LUCHO,
          business_name: "Ferretería Don Lucho E.I.R.L.",
          trade_name: "Ferretería Don Lucho",
          ruc: "20100070970", // 👈 Válido (termina en 0)
          profile: "HARDWARE_STORE",
          subscription_status: "TRIAL",
          plan_name: "BASIC",
          monthly_fee: "119.00",
          subscription_expires_at: inSevenDays,
          grace_period_days: 7,
          max_cash_registers: 1,
          max_users: 2,
          module_sunat: true,
          module_credits: true,
          module_multiwarehouse: false,
          allow_negative_stock: false,
        },
        // Tenant 3: SUSPENDIDO (BASIC)
        {
          id: SEED_IDS.TENANT_RAMOS,
          business_name: "Materiales & Acabados Ramos",
          trade_name: "Acabados Ramos",
          ruc: "20491823900", // 👈 Válido (termina en 0, no en 1)
          profile: "HARDWARE_STORE",
          subscription_status: "SUSPENDED",
          plan_name: "BASIC",
          monthly_fee: "119.00",
          subscription_expires_at: tenDaysAgo,
          grace_period_days: 3,
          max_cash_registers: 1,
          max_users: 2,
          module_sunat: false,
          module_credits: true,
          module_multiwarehouse: false,
          allow_negative_stock: false,
        },
      ])
      .execute();

    // 3. USUARIOS
    await db
      .insertInto("users")
      .values([
        // 3.1. Superadmin Global (Sin tenant_id)
        {
          id: SEED_IDS.USER_SUPERADMIN,
          tenant_id: null,
          email: "admin@jysoluciones.pe",
          password_hash: superadminPasswordHash,
          full_name: "Super Root JY",
          role: "SUPERADMIN",
          token_version: 1,
          is_active: true,
        },
        // 3.2. Usuarios Lubricentro El Pistón (4 usuarios asignados a cuota)
        {
          id: SEED_IDS.USER_PISTON_ADMIN,
          tenant_id: SEED_IDS.TENANT_PISTON,
          email: "admin@elpiston.pe",
          password_hash: defaultTenantPasswordHash,
          full_name: "Carlos Gómez (Admin Pistón)",
          role: "TENANT_ADMIN",
          token_version: 1,
          is_active: true,
        },
        {
          id: SEED_IDS.USER_PISTON_CASHIER1,
          tenant_id: SEED_IDS.TENANT_PISTON,
          email: "caja1@elpiston.pe",
          password_hash: defaultTenantPasswordHash,
          full_name: "Marcos Soto (Caja Bahía)",
          role: "CASHIER",
          token_version: 1,
          is_active: true,
        },
        {
          id: SEED_IDS.USER_PISTON_CASHIER2,
          tenant_id: SEED_IDS.TENANT_PISTON,
          email: "caja2@elpiston.pe",
          password_hash: defaultTenantPasswordHash,
          full_name: "Roberto Díaz (Caja Mostrador)",
          role: "CASHIER",
          token_version: 1,
          is_active: true,
        },
        {
          id: SEED_IDS.USER_PISTON_OPERATOR,
          tenant_id: SEED_IDS.TENANT_PISTON,
          email: "almacen@elpiston.pe",
          password_hash: defaultTenantPasswordHash,
          full_name: "Jorge Méndez (Almacenero)",
          role: "WAREHOUSE_OPERATOR",
          token_version: 1,
          is_active: true,
        },
        // 3.3. Usuarios Ferretería Don Lucho (2 usuarios)
        {
          id: SEED_IDS.USER_LUCHO_ADMIN,
          tenant_id: SEED_IDS.TENANT_DON_LUCHO,
          email: "admin@donlucho.pe",
          password_hash: defaultTenantPasswordHash,
          full_name: "Luis Lucho Ramos (Admin)",
          role: "TENANT_ADMIN",
          token_version: 1,
          is_active: true,
        },
        {
          id: SEED_IDS.USER_LUCHO_CASHIER,
          tenant_id: SEED_IDS.TENANT_DON_LUCHO,
          email: "cajero@donlucho.pe",
          password_hash: defaultTenantPasswordHash,
          full_name: "Rosa Morales (Cajera)",
          role: "CASHIER",
          token_version: 1,
          is_active: true,
        },
        // 3.4. Usuario Materiales Ramos (1 usuario)
        {
          id: SEED_IDS.USER_RAMOS_ADMIN,
          tenant_id: SEED_IDS.TENANT_RAMOS,
          email: "admin@acabadosramos.pe",
          password_hash: defaultTenantPasswordHash,
          full_name: "Fernando Ramos (Admin)",
          role: "TENANT_ADMIN",
          token_version: 1,
          is_active: true,
        },
      ])
      .execute();

    // 4. ALMACENES
    await db
      .insertInto("warehouses")
      .values([
        // Lubricentro (Multi-almacén: 2 almacenes)
        {
          id: SEED_IDS.WH_PISTON_MAIN,
          tenant_id: SEED_IDS.TENANT_PISTON,
          name: "Bahía Principal & Taller",
          address: "Av. Industrial 500, Lurin",
          is_default: true,
        },
        {
          id: SEED_IDS.WH_PISTON_SECONDARY,
          tenant_id: SEED_IDS.TENANT_PISTON,
          name: "Depósito de Tambores y Filtros",
          address: "Av. Industrial 502, Lurin",
          is_default: false,
        },
        // Don Lucho
        {
          id: SEED_IDS.WH_LUCHO_MAIN,
          tenant_id: SEED_IDS.TENANT_DON_LUCHO,
          name: "Almacén Mostrador",
          address: "Jr. Comercio 123",
          is_default: true,
        },
        // Ramos
        {
          id: SEED_IDS.WH_RAMOS_MAIN,
          tenant_id: SEED_IDS.TENANT_RAMOS,
          name: "Local Central",
          address: "Calle Los Cedros 890",
          is_default: true,
        },
      ])
      .execute();

    // 5. CAJAS REGISTRADORAS
    await db
      .insertInto("cash_registers")
      .values([
        // Lubricentro (2 cajas = cuota completa)
        {
          id: SEED_IDS.REG_PISTON_1,
          tenant_id: SEED_IDS.TENANT_PISTON,
          name: "Caja Bahía Rápida 01",
          is_active: true,
        },
        {
          id: SEED_IDS.REG_PISTON_2,
          tenant_id: SEED_IDS.TENANT_PISTON,
          name: "Caja Tienda Lubricantes 02",
          is_active: true,
        },
        // Don Lucho (1 caja)
        {
          id: SEED_IDS.REG_LUCHO_1,
          tenant_id: SEED_IDS.TENANT_DON_LUCHO,
          name: "Caja Mostrador 01",
          is_active: true,
        },
        // Ramos (1 caja)
        {
          id: SEED_IDS.REG_RAMOS_1,
          tenant_id: SEED_IDS.TENANT_RAMOS,
          name: "Caja Principal 01",
          is_active: true,
        },
      ])
      .execute();

    // 6. AUDITORÍA INICIAL (Para poblar la vista de audit logs en el dashboard)
    await db
      .insertInto("platform_audit_logs")
      .values([
        {
          id: "44444444-1111-4444-8444-111111111111",
          superadmin_id: SEED_IDS.USER_SUPERADMIN,
          tenant_id: SEED_IDS.TENANT_PISTON,
          event: "TENANT_CREATED",
          ip_address: "127.0.0.1",
          user_agent: "Mozilla/5.0 (Seed Initializer)",
          diff: JSON.stringify({
            tenant: "Lubricentro El Pistón S.A.C.",
            plan: "PRO",
            status: "ACTIVE",
          }),
        },
        {
          id: "44444444-2222-4444-8444-222222222222",
          superadmin_id: SEED_IDS.USER_SUPERADMIN,
          tenant_id: SEED_IDS.TENANT_RAMOS,
          event: "SUBSCRIPTION_STATUS_CHANGED",
          ip_address: "127.0.0.1",
          user_agent: "Mozilla/5.0 (Seed Initializer)",
          diff: JSON.stringify({
            before: { status: "ACTIVE" },
            after: { status: "SUSPENDED" },
            reason: "Falta de pago tras superar días de gracia",
          }),
        },
      ])
      .execute();

    // =========================================================================
    // 7. CATÁLOGO MAESTRO: PRODUCTOS, SERVICIOS, CONVERSIONES E INVENTARIO
    // =========================================================================

    // --- FERRETERÍA DON LUCHO ---
    const DON_LUCHO_PRODS = {
      CEMENTO: "11111111-9999-4999-8999-111111111101",
      CABLE: "11111111-9999-4999-8999-111111111102",
      CLAVOS: "11111111-9999-4999-8999-111111111103",
      FLETE_LOCAL: "11111111-9999-4999-8999-111111111104",
      CORTE_TUBO: "11111111-9999-4999-8999-111111111105",
    };

    // --- LUBRICENTRO EL PISTÓN ---
    const PISTON_PRODS = {
      ACEITE_MOBIL_20W50: "22222222-9999-4999-8999-222222222201",
      FILTRO_ACEITE_COROLLA: "22222222-9999-4999-8999-222222222202",
      REFRIGERANTE_VERDE: "22222222-9999-4999-8999-222222222203",
      SRV_CAMBIO_ACEITE: "22222222-9999-4999-8999-222222222204",
      SRV_ENGRASE: "22222222-9999-4999-8999-222222222205",
    };

    await db
      .insertInto("products")
      .values([
        // --- DON LUCHO: BIENES FÍSICOS ---
        {
          id: DON_LUCHO_PRODS.CEMENTO,
          tenant_id: SEED_IDS.TENANT_DON_LUCHO,
          category_id: null,
          sku: "MAT-CEM-SOL",
          barcode: "7751234567890",
          name: "Cemento Sol Tipo I - Bolsa 42.5 kg",
          base_unit: "BOLSA",
          cost_price: "24.50",
          base_sale_price: "29.90",
          is_service: false,
          is_active: true,
        },
        {
          id: DON_LUCHO_PRODS.CABLE,
          tenant_id: SEED_IDS.TENANT_DON_LUCHO,
          category_id: null,
          sku: "ELE-CBL-14AWG",
          barcode: "7751234567891",
          name: "Cable Vulcanizado 2x14 AWG Indeco",
          base_unit: "MTR",
          cost_price: "2.10",
          base_sale_price: "3.50",
          is_service: false,
          is_active: true,
        },
        {
          id: DON_LUCHO_PRODS.CLAVOS,
          tenant_id: SEED_IDS.TENANT_DON_LUCHO,
          category_id: null,
          sku: "CLA-MAD-3IN",
          barcode: "7751234567892",
          name: "Clavo para Madera C/C 3 Pulgadas",
          base_unit: "KGM",
          cost_price: "4.80",
          base_sale_price: "7.00",
          is_service: false,
          is_active: true,
        },
        // --- DON LUCHO: SERVICIOS INTANGIBLES ---
        {
          id: DON_LUCHO_PRODS.FLETE_LOCAL,
          tenant_id: SEED_IDS.TENANT_DON_LUCHO,
          category_id: null,
          sku: "SRV-FLETE-URB",
          barcode: null,
          name: "Servicio de Transporte y Flete a Obra (Zona 1)",
          base_unit: "NIU",
          cost_price: "20.00",
          base_sale_price: "50.00",
          is_service: true,
          is_active: true,
        },
        {
          id: DON_LUCHO_PRODS.CORTE_TUBO,
          tenant_id: SEED_IDS.TENANT_DON_LUCHO,
          category_id: null,
          sku: "SRV-CORTE-PRE",
          barcode: null,
          name: "Corte y Dimensionado de Tubos / Fierro",
          base_unit: "NIU",
          cost_price: "0.00",
          base_sale_price: "5.00",
          is_service: true,
          is_active: true,
        },

        // --- EL PISTÓN: BIENES FÍSICOS ---
        {
          id: PISTON_PRODS.ACEITE_MOBIL_20W50,
          tenant_id: SEED_IDS.TENANT_PISTON,
          category_id: null,
          sku: "LUB-MOB-20W50",
          barcode: "7759876543210",
          name: "Aceite Mobil Super 20W-50 Multigrado Granel",
          base_unit: "LTR",
          cost_price: "18.50",
          base_sale_price: "28.00",
          is_service: false,
          is_active: true,
        },
        {
          id: PISTON_PRODS.FILTRO_ACEITE_COROLLA,
          tenant_id: SEED_IDS.TENANT_PISTON,
          category_id: null,
          sku: "REP-FLT-TOY01",
          barcode: "7759876543211",
          name: "Filtro de Aceite Blindado Toyota Corolla / Yaris",
          base_unit: "NIU",
          cost_price: "15.00",
          base_sale_price: "32.00",
          is_service: false,
          is_active: true,
        },
        {
          id: PISTON_PRODS.REFRIGERANTE_VERDE,
          tenant_id: SEED_IDS.TENANT_PISTON,
          category_id: null,
          sku: "REF-PRE-33",
          barcode: "7759876543212",
          name: "Refrigerante / Anticongelante 33% Verde",
          base_unit: "GALON",
          cost_price: "22.00",
          base_sale_price: "38.00",
          is_service: false,
          is_active: true,
        },
        // --- EL PISTÓN: SERVICIOS INTANGIBLES ---
        {
          id: PISTON_PRODS.SRV_CAMBIO_ACEITE,
          tenant_id: SEED_IDS.TENANT_PISTON,
          category_id: null,
          sku: "SRV-TALLER-LUB01",
          barcode: null,
          name: "Mano de Obra: Cambio de Aceite y Filtro en Bahía",
          base_unit: "NIU",
          cost_price: "5.00",
          base_sale_price: "25.00",
          is_service: true,
          is_active: true,
        },
        {
          id: PISTON_PRODS.SRV_ENGRASE,
          tenant_id: SEED_IDS.TENANT_PISTON,
          category_id: null,
          sku: "SRV-TALLER-ENG02",
          barcode: null,
          name: "Engrase Integral de Chasis y Terminales de Dirección",
          base_unit: "NIU",
          cost_price: "8.00",
          base_sale_price: "35.00",
          is_service: true,
          is_active: true,
        },
      ])
      .execute();

    // --- CONVERSIONES / PRESENTACIONES DERIVADAS ---
    await db
      .insertInto("product_conversions")
      .values([
        // Don Lucho: Cable por Rollo de 100 Metros
        {
          id: "11111111-7777-4777-8777-111111111101",
          tenant_id: SEED_IDS.TENANT_DON_LUCHO,
          product_id: DON_LUCHO_PRODS.CABLE,
          presentation_name: "Rollo Cerrado x 100 Metros",
          barcode: "7751234599991",
          conversion_rate: "100.00",
          sale_price: "310.00", // Descuento por volumen frente a comprar 100m sueltos
          is_active: true,
        },
        // Don Lucho: Clavos por Caja Cerrada de 25 Kg
        {
          id: "11111111-7777-4777-8777-111111111102",
          tenant_id: SEED_IDS.TENANT_DON_LUCHO,
          product_id: DON_LUCHO_PRODS.CLAVOS,
          presentation_name: "Caja Mayorista x 25 Kg",
          barcode: "7751234599992",
          conversion_rate: "25.00",
          sale_price: "155.00",
          is_active: true,
        },
        // El Pistón: Aceite en Galón (3.785 Litros)
        {
          id: "22222222-7777-4777-8777-222222222201",
          tenant_id: SEED_IDS.TENANT_PISTON,
          product_id: PISTON_PRODS.ACEITE_MOBIL_20W50,
          presentation_name: "Galón x 3.785 Litros (Envase)",
          barcode: "7759876599991",
          conversion_rate: "3.785",
          sale_price: "98.00",
          is_active: true,
        },
        // El Pistón: Aceite en Tambor Industrial (208 Litros)
        {
          id: "22222222-7777-4777-8777-222222222202",
          tenant_id: SEED_IDS.TENANT_PISTON,
          product_id: PISTON_PRODS.ACEITE_MOBIL_20W50,
          presentation_name: "Tambor Industrial x 208 Litros",
          barcode: "7759876599992",
          conversion_rate: "208.000",
          sale_price: "4950.00",
          is_active: true,
        },
      ])
      .execute();

    // --- INVENTARIOS FÍSICOS (Solo para bienes físicos, no servicios) ---
    await db
      .insertInto("inventories")
      .values([
        // Don Lucho (Almacén Central)
        {
          tenant_id: SEED_IDS.TENANT_DON_LUCHO,
          warehouse_id: SEED_IDS.WH_LUCHO_MAIN,
          product_id: DON_LUCHO_PRODS.CEMENTO,
          current_stock: "150.00",
          min_stock: "25.00",
        },
        {
          tenant_id: SEED_IDS.TENANT_DON_LUCHO,
          warehouse_id: SEED_IDS.WH_LUCHO_MAIN,
          product_id: DON_LUCHO_PRODS.CABLE,
          current_stock: "850.00", // 850 metros disponibles
          min_stock: "100.00",
        },
        {
          tenant_id: SEED_IDS.TENANT_DON_LUCHO,
          warehouse_id: SEED_IDS.WH_LUCHO_MAIN,
          product_id: DON_LUCHO_PRODS.CLAVOS,
          current_stock: "240.00", // 240 Kilos disponibles
          min_stock: "50.00",
        },

        // El Pistón (Bahía Taller)
        {
          tenant_id: SEED_IDS.TENANT_PISTON,
          warehouse_id: SEED_IDS.WH_PISTON_MAIN,
          product_id: PISTON_PRODS.ACEITE_MOBIL_20W50,
          current_stock: "420.00", // 420 Litros a granel
          min_stock: "60.00",
        },
        {
          tenant_id: SEED_IDS.TENANT_PISTON,
          warehouse_id: SEED_IDS.WH_PISTON_MAIN,
          product_id: PISTON_PRODS.FILTRO_ACEITE_COROLLA,
          current_stock: "28.00",
          min_stock: "5.00",
        },
        {
          tenant_id: SEED_IDS.TENANT_PISTON,
          warehouse_id: SEED_IDS.WH_PISTON_MAIN,
          product_id: PISTON_PRODS.REFRIGERANTE_VERDE,
          current_stock: "40.00",
          min_stock: "8.00",
        },
      ])
      .execute();

    console.log("✅ Seed completado con éxito:");
    console.log(
      `   - Superadmin creado: admin@jysoluciones.pe (Pass: ${process.env.SEED_SUPERADMIN_PASSWORD ? "****** (desde .env)" : "AdminSuper2026!"})`,
    );
    console.log("   - 3 Tenants listos con estados: ACTIVE, TRIAL, SUSPENDED");
    console.log(
      "   - Métricas en vivo listas para ser consumidas por GET /api/v1/platform/metrics",
    );
  } catch (error) {
    console.error("❌ Error ejecutando el seed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
