import { Generated } from "kysely";

export type PlatformAuditEvent =
  | "TENANT_CREATED"
  | "TENANT_UPDATED"
  | "SUBSCRIPTION_STATUS_CHANGED"
  | "SUBSCRIPTION_PLAN_CHANGED"
  | "MODULES_UPDATED"
  | "USER_PASSWORD_RESET_REQUESTED"
  | "IMPERSONATION_STARTED"
  | "TENANT_IMPERSONATED";

export interface DatabaseSchema {
  tenants: {
    id: string;
    business_name: string;
    trade_name: string | null;
    ruc: string;
    profile: "HARDWARE_STORE" | "LUBRICENTER";
    module_credits: boolean;
    module_multiwarehouse: boolean;
    module_sunat: boolean;
    allow_negative_stock: boolean;
    // Campos añadidos para Plataforma y Suscripciones SaaS:
    subscription_status: "TRIAL" | "ACTIVE" | "SUSPENDED" | "CANCELLED";
    plan_name: "BASIC" | "PRO" | "ENTERPRISE";
    monthly_fee: string;
    subscription_expires_at: Date;
    grace_period_days: number;
    max_cash_registers: number;
    max_users: number;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
  };
  users: {
    id: string;
    tenant_id: string | null; // Nullable para Superadmins globales
    email: string;
    password_hash: string;
    full_name: string;
    role: "SUPERADMIN" | "TENANT_ADMIN" | "CASHIER" | "WAREHOUSE_OPERATOR";
    token_version: number;
    is_active: boolean;
    must_change_password: Generated<boolean>;
    created_at: Generated<Date>;
  };
  // Nueva tabla: Auditoría Global
  platform_audit_logs: {
    id: string;
    superadmin_id: string;
    tenant_id: string | null;
    event: PlatformAuditEvent;
    ip_address: string;
    user_agent: string;
    diff: unknown;
    created_at: Generated<Date>;
  };
  // Nueva tabla: Tokens de Invitación y Reseteo de Contraseña
  email_tokens: {
    id: string;
    user_id: string;
    token_hash: string;
    token_type: "ADMIN_INVITATION" | "PASSWORD_RESET";
    expires_at: Date;
    used_at: Date | null;
    created_at: Generated<Date>;
  };
  products: {
    id: string;
    tenant_id: string;
    category_id: string | null;
    sku: string | null;
    barcode: string | null;
    name: string;
    base_unit: string;
    cost_price: string;
    base_sale_price: string;
    is_service: boolean;
    is_active: boolean;
    created_at: Generated<Date>;
  };
  product_conversions: {
    id: string;
    tenant_id: string;
    product_id: string;
    presentation_name: string;
    barcode: string | null;
    conversion_rate: string;
    sale_price: string;
    is_active: boolean;
  };
  inventories: {
    id: Generated<string>;
    tenant_id: string;
    warehouse_id: string;
    product_id: string;
    current_stock: string;
    min_stock: string;
    updated_at: Generated<Date>;
  };
  inventory_movements: {
    id: Generated<string>;
    tenant_id: string;
    warehouse_id: string;
    product_id: string;
    movement_type:
      | "INITIAL_STOCK"
      | "PURCHASE_ENTRY"
      | "POSITIVE_ADJUSTMENT"
      | "NEGATIVE_ADJUSTMENT";
    quantity: string;
    unit_cost: string | null;
    previous_stock: string;
    new_stock: string;
    reason: string;
    user_id: string;
    created_at: Generated<Date>;
  };
  customers: {
    id: string;
    tenant_id: string;
    doc_number: string | null;
    name: string;
    phone: string | null;
    credit_limit: string;
    current_debt: string;
    created_at: Generated<Date>;
  };
  credit_accounts: {
    id: string;
    tenant_id: string;
    customer_id: string;
    sale_id: string;
    principal_amount: string;
    balance: string;
    status: "PENDING" | "PARTIALLY_PAID" | "PAID" | "DEFAULTED";
    due_date: Date | null;
    created_at: Generated<Date>;
  };
  cash_shifts: {
    id: string;
    tenant_id: string;
    cash_register_id: string;
    user_id: string;
    status: "OPEN" | "CLOSED";
    initial_cash: string;
    opened_at: Generated<Date>;
    closed_at: Date | null;
    declared_cash: string | null;
    declared_cards: string | null;
    declared_yape_plin: string | null;
    expected_cash: string | null;
    expected_cards: string | null;
    expected_yape_plin: string | null;
    cash_difference: string | null;
    notes: string | null;
  };
  sales: {
    id: string;
    tenant_id: string;
    warehouse_id: string;
    shift_id: string;
    customer_id: string | null;
    user_id: string;
    ticket_number: string;
    subtotal: string;
    discount: string;
    total: string;
    status: "COMPLETED" | "VOIDED";
    reference_value: string | null;
    created_at: Generated<Date>;
  };
  sale_items: {
    id: string;
    sale_id: string;
    product_id: string;
    conversion_id: string | null;
    quantity_sold: string;
    conversion_rate: string;
    base_quantity_deducted: string;
    unit_price: string;
    subtotal: string;
  };
  sale_payments: {
    id: string;
    sale_id: string;
    payment_method: "CASH" | "YAPE_PLIN" | "CARD" | "CREDIT";
    amount: string;
    reference_code: string | null;
  };
  fiscal_outbox: {
    id: Generated<string>;
    tenant_id: string;
    sale_id: string;
    payload: unknown;
    status: "PENDING" | "PROCESSING" | "SENT" | "FAILED";
    retry_count: Generated<number>;
    last_error: string | null;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
  };
  debt_payments: {
    id: string;
    tenant_id: string;
    credit_account_id: string;
    shift_id: string;
    amount: string;
    payment_method: "CASH" | "YAPE_PLIN" | "CARD" | "CREDIT";
    reference_code: string | null;
    created_at: Generated<Date>;
  };
  cash_movements: {
    id: string;
    tenant_id: string;
    shift_id: string;
    movement_type: "INITIAL_FLOAT" | "INFLOW" | "OUTFLOW" | "DEBT_COLLECTION";
    amount: string;
    reason: string;
    created_at: Generated<Date>;
  };
  fiscal_documents: {
    id: Generated<string>;
    tenant_id: string;
    sale_id: string;
    doc_type: "01" | "03";
    series: string;
    number: number;
    external_id: string | null;
    cdr_status: "PENDING" | "ACCEPTED" | "REJECTED";
    hash_cpe: string | null;
    pdf_url: string | null;
    xml_url: string | null;
    sunat_error_message: string | null;
    issued_at: Generated<Date>;
  };
  categories: {
    id: string;
    tenant_id: string;
    name: string;
  };
  warehouses: {
    id: string;
    tenant_id: string;
    name: string;
    address: string | null;
    is_default: boolean;
    created_at: Generated<Date>;
  };
  cash_registers: {
    id: string;
    tenant_id: string;
    name: string;
    is_active: boolean;
  };
}
