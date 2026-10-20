-- Migración 003: Añadir evento inmutable de impersonación de comercio
ALTER TYPE platform_audit_event_enum ADD VALUE IF NOT EXISTS 'TENANT_IMPERSONATED';