// scripts/setup-db.ts
import { Pool } from "pg";
import { env } from "../src/core/config/env.js";

const DDL_SCHEMA = `
-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. ENUMERACIONES
DO $$ BEGIN
  CREATE TYPE business_profile_enum AS ENUM ('HARDWARE_STORE', 'LUBRICENTER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('SUPERADMIN', 'TENANT_ADMIN', 'CASHIER', 'WAREHOUSE_OPERATOR');
EXCEPTION WHEN duplicate_object THEN 
  ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'SUPERADMIN';
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status_enum AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_tier_enum AS ENUM ('BASIC', 'PRO', 'ENTERPRISE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE platform_audit_event_enum AS ENUM (
    'TENANT_CREATED',
    'SUBSCRIPTION_STATUS_CHANGED',
    'SUBSCRIPTION_PLAN_CHANGED',
    'MODULES_UPDATED',
    'USER_PASSWORD_RESET_REQUESTED',
    'IMPERSONATION_STARTED',
    'TENANT_UPDATED',
    'TENANT_IMPERSONATED'
  );
EXCEPTION WHEN duplicate_object THEN
  BEGIN
    ALTER TYPE platform_audit_event_enum ADD VALUE IF NOT EXISTS 'TENANT_UPDATED';
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER TYPE platform_audit_event_enum ADD VALUE IF NOT EXISTS 'TENANT_IMPERSONATED';
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

DO $$ BEGIN
  CREATE TYPE email_token_type_enum AS ENUM ('PASSWORD_RESET', 'ADMIN_INVITATION');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE shift_status_enum AS ENUM ('OPEN', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method_enum AS ENUM ('CASH', 'YAPE_PLIN', 'CARD', 'CREDIT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sale_status_enum AS ENUM ('COMPLETED', 'VOIDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE credit_status_enum AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'DEFAULTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE cash_movement_type_enum AS ENUM ('INITIAL_FLOAT', 'INFLOW', 'OUTFLOW', 'DEBT_COLLECTION');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE inventory_movement_type_enum AS ENUM (
    'INITIAL_STOCK',
    'PURCHASE_ENTRY',
    'POSITIVE_ADJUSTMENT',
    'NEGATIVE_ADJUSTMENT'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE outbox_status_enum AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE fiscal_doc_type_enum AS ENUM ('01', '03');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE cdr_status_enum AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. TENANCY Y SEGURIDAD
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name VARCHAR(150) NOT NULL,
    trade_name VARCHAR(150),
    ruc VARCHAR(11) UNIQUE NOT NULL,
    profile business_profile_enum NOT NULL DEFAULT 'HARDWARE_STORE',
    subscription_status subscription_status_enum NOT NULL DEFAULT 'TRIAL',
    plan_name subscription_tier_enum NOT NULL DEFAULT 'PRO',
    monthly_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    subscription_expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '14 days',
    grace_period_days INT NOT NULL DEFAULT 3,
    max_cash_registers INT NOT NULL DEFAULT 1,
    max_users INT NOT NULL DEFAULT 2,
    module_credits BOOLEAN NOT NULL DEFAULT FALSE,
    module_multiwarehouse BOOLEAN NOT NULL DEFAULT FALSE,
    module_sunat BOOLEAN NOT NULL DEFAULT FALSE,
    allow_negative_stock BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_status subscription_status_enum NOT NULL DEFAULT 'TRIAL';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan_name subscription_tier_enum NOT NULL DEFAULT 'PRO';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '14 days';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS grace_period_days INT NOT NULL DEFAULT 3;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_cash_registers INT NOT NULL DEFAULT 1;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_users INT NOT NULL DEFAULT 2;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(120) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'CASHIER',
    token_version INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ALTER COLUMN tenant_id DROP NOT NULL;

-- 4. TABLAS DE PLATAFORMA (SUPERADMIN)
CREATE TABLE IF NOT EXISTS platform_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    superadmin_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    event platform_audit_event_enum NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT NOT NULL,
    diff JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    token_type email_token_type_enum NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CATÁLOGO, CONVERSIONES E INVENTARIO
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(80) NOT NULL,
    CONSTRAINT uq_categories_tenant_name UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sku VARCHAR(50),
    barcode VARCHAR(50),
    name VARCHAR(180) NOT NULL,
    base_unit VARCHAR(10) NOT NULL,
    cost_price NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    base_sale_price NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    is_service BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_products_tenant_barcode UNIQUE (tenant_id, barcode),
    CONSTRAINT uq_products_tenant_sku UNIQUE (tenant_id, sku)
);

CREATE TABLE IF NOT EXISTS product_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    presentation_name VARCHAR(60) NOT NULL,
    barcode VARCHAR(50),
    conversion_rate NUMERIC(12, 4) NOT NULL CHECK (conversion_rate > 0),
    sale_price NUMERIC(12, 4) NOT NULL CHECK (sale_price >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_conversions_tenant_barcode UNIQUE (tenant_id, barcode)
);

CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(80) NOT NULL,
    address VARCHAR(200),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    current_stock NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    min_stock NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_inventories_tenant_wh_product UNIQUE (tenant_id, warehouse_id, product_id)
);

CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    movement_type inventory_movement_type_enum NOT NULL,
    quantity NUMERIC(14, 4) NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC(12, 4) CHECK (unit_cost >= 0),
    previous_stock NUMERIC(14, 4) NOT NULL,
    new_stock NUMERIC(14, 4) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. CAJAS Y ARQUEO
CREATE TABLE IF NOT EXISTS cash_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS cash_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cash_register_id UUID NOT NULL REFERENCES cash_registers(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status shift_status_enum NOT NULL DEFAULT 'OPEN',
    initial_cash NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    declared_cash NUMERIC(12, 2),
    declared_cards NUMERIC(12, 2),
    declared_yape_plin NUMERIC(12, 2),
    expected_cash NUMERIC(12, 2),
    expected_cards NUMERIC(12, 2),
    expected_yape_plin NUMERIC(12, 2),
    cash_difference NUMERIC(12, 2),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS cash_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    shift_id UUID NOT NULL REFERENCES cash_shifts(id) ON DELETE RESTRICT,
    movement_type cash_movement_type_enum NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    reason VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. CLIENTES, VENTAS Y COBROS
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    doc_number VARCHAR(15),
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    credit_limit NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    current_debt NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_customers_tenant_doc UNIQUE (tenant_id, doc_number)
);

CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    shift_id UUID NOT NULL REFERENCES cash_shifts(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    ticket_number BIGINT NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL,
    status sale_status_enum NOT NULL DEFAULT 'COMPLETED',
    reference_value VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_sales_tenant_ticket UNIQUE (tenant_id, ticket_number)
);

CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    conversion_id UUID REFERENCES product_conversions(id) ON DELETE RESTRICT,
    quantity_sold NUMERIC(12, 4) NOT NULL CHECK (quantity_sold > 0),
    conversion_rate NUMERIC(12, 4) NOT NULL DEFAULT 1.0000,
    base_quantity_deducted NUMERIC(14, 4) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS sale_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    payment_method payment_method_enum NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    reference_code VARCHAR(50)
);

-- 8. CUENTAS POR COBRAR (FIADOS)
CREATE TABLE IF NOT EXISTS credit_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE RESTRICT,
    principal_amount NUMERIC(12, 2) NOT NULL,
    balance NUMERIC(12, 2) NOT NULL,
    status credit_status_enum NOT NULL DEFAULT 'PENDING',
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS debt_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    credit_account_id UUID NOT NULL REFERENCES credit_accounts(id) ON DELETE RESTRICT,
    shift_id UUID NOT NULL REFERENCES cash_shifts(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method payment_method_enum NOT NULL,
    reference_code VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. SATÉLITE FISCAL (OUTBOX & DOCUMENTS)
CREATE TABLE IF NOT EXISTS fiscal_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    status outbox_status_enum NOT NULL DEFAULT 'PENDING',
    retry_count INT NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_outbox_sale UNIQUE (sale_id)
);

CREATE TABLE IF NOT EXISTS fiscal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE RESTRICT,
    doc_type fiscal_doc_type_enum NOT NULL,
    series VARCHAR(4) NOT NULL,
    number INT NOT NULL,
    external_id VARCHAR(100),
    cdr_status cdr_status_enum NOT NULL DEFAULT 'PENDING',
    hash_cpe VARCHAR(120),
    pdf_url TEXT,
    xml_url TEXT,
    sunat_error_message TEXT,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_fiscal_tenant_series_number UNIQUE (tenant_id, doc_type, series, number),
    CONSTRAINT uq_fiscal_sale UNIQUE (sale_id)
);

-- 10. ÍNDICES DE RENDIMIENTO CRÍTICO
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON platform_audit_logs (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_superadmin ON platform_audit_logs (superadmin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_tokens_lookup ON email_tokens (token_hash) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_tenant_barcode ON products (tenant_id, barcode) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_conversions_tenant_barcode ON product_conversions (tenant_id, barcode) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_inventories_lookup ON inventories (tenant_id, warehouse_id, product_id);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_shift ON sales (tenant_id, shift_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_reference_value ON sales (tenant_id, reference_value) WHERE reference_value IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fiscal_outbox_pending ON fiscal_outbox (status, retry_count) WHERE status IN ('PENDING', 'PROCESSING');
CREATE INDEX IF NOT EXISTS idx_credit_accounts_customer_status ON credit_accounts (tenant_id, customer_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_lookup ON inventory_movements (tenant_id, warehouse_id, product_id, created_at DESC);
`;

async function setup() {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  console.log("🔄 Aplicando esquema DDL actualizado...");
  try {
    await pool.query(DDL_SCHEMA);
    console.log("✅ Esquema DDL aplicado con éxito.");
  } catch (error) {
    console.error("❌ Error aplicando el esquema DDL:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setup();
