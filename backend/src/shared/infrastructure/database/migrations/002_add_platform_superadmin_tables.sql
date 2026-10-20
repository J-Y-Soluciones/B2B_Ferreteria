-- 1. Actualizar tabla tenants con suscripción y límites
ALTER TABLE tenants
  ADD COLUMN subscription_status VARCHAR(20) NOT NULL DEFAULT 'TRIAL',
  ADD COLUMN plan_name VARCHAR(20) NOT NULL DEFAULT 'PRO',
  ADD COLUMN monthly_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN subscription_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  ADD COLUMN grace_period_days INT NOT NULL DEFAULT 3,
  ADD COLUMN max_cash_registers INT NOT NULL DEFAULT 3,
  ADD COLUMN max_users INT NOT NULL DEFAULT 5;

-- 2. Permitir que usuarios puedan ser SUPERADMIN (tenant_id nullable para superadmins globales)
ALTER TABLE users ALTER COLUMN tenant_id DROP NOT NULL;

-- 3. Tabla de Bitácora Inmutable de Auditoría Global (Superadmin)
CREATE TABLE platform_audit_logs (
  id UUID PRIMARY KEY,
  superadmin_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  event VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT NOT NULL,
  diff JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_platform_audit_logs_tenant ON platform_audit_logs(tenant_id);
CREATE INDEX idx_platform_audit_logs_superadmin ON platform_audit_logs(superadmin_id);
CREATE INDEX idx_platform_audit_logs_created_at ON platform_audit_logs(created_at DESC);

-- 4. Tabla de Tokens Criptográficos de Seguridad (Invitaciones y Reseteo)
CREATE TABLE email_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256
  token_type VARCHAR(30) NOT NULL,       -- 'ADMIN_INVITATION' | 'PASSWORD_RESET'
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_tokens_hash ON email_tokens(token_hash);
CREATE INDEX idx_email_tokens_user_type ON email_tokens(user_id, token_type);