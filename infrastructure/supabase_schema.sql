-- ==============================================================================
-- SCHEMA DDL Y DATOS INICIALES - NUAM EXCHANGE GROUP
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. TABLA: TB_ROLES
CREATE TABLE IF NOT EXISTS "TB_ROLES" (
    "id_rol" SERIAL PRIMARY KEY,
    "nombre_rol" VARCHAR(50) NOT NULL UNIQUE,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "nivel_acceso" INTEGER NOT NULL DEFAULT 1
);

-- 2. TABLA: TB_USUARIOS
CREATE TABLE IF NOT EXISTS "TB_USUARIOS" (
    "id_usuario" SERIAL PRIMARY KEY,
    "rut" VARCHAR(12) NOT NULL UNIQUE,
    "nombre" VARCHAR(150),
    "email" VARCHAR(254) NOT NULL UNIQUE,
    "password_hash" VARCHAR(255) NOT NULL,
    "id_corredora" VARCHAR(150) NOT NULL DEFAULT 'LarrainVial S.A. Corredora',
    "estado" VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    "id_rol" INTEGER NOT NULL REFERENCES "TB_ROLES"("id_rol") ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS "idx_usuario_rut" ON "TB_USUARIOS"("rut");
CREATE INDEX IF NOT EXISTS "idx_usuario_email" ON "TB_USUARIOS"("email");

-- 3. TABLA: TB_EMISORES
CREATE TABLE IF NOT EXISTS "TB_EMISORES" (
    "rut_emisor" VARCHAR(12) PRIMARY KEY,
    "razon_social" VARCHAR(200) NOT NULL,
    "pais_origen" VARCHAR(50) NOT NULL DEFAULT 'Chile',
    "sector_economico" VARCHAR(100) NOT NULL DEFAULT 'Bursátil / Financiero'
);
CREATE INDEX IF NOT EXISTS "idx_emisor_razon_social" ON "TB_EMISORES"("razon_social");

-- 4. TABLA: TB_CERTIFICADOS_DIVIDENDOS
CREATE TABLE IF NOT EXISTS "TB_CERTIFICADOS_DIVIDENDOS" (
    "folio_certificado" VARCHAR(50) PRIMARY KEY,
    "anio_tributario" INTEGER NOT NULL,
    "fecha_pago" DATE NOT NULL,
    "monto_total_bruto" NUMERIC(18, 2) NOT NULL,
    "estado_proceso" VARCHAR(20) NOT NULL DEFAULT 'Aprobado',
    "rut_emisor" VARCHAR(12) NOT NULL REFERENCES "TB_EMISORES"("rut_emisor") ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS "idx_cert_anio_estado" ON "TB_CERTIFICADOS_DIVIDENDOS"("anio_tributario", "estado_proceso");
CREATE INDEX IF NOT EXISTS "idx_cert_emisor_anio" ON "TB_CERTIFICADOS_DIVIDENDOS"("rut_emisor", "anio_tributario");

-- 5. TABLA: TB_FACTORES_TRIBUTARIOS
CREATE TABLE IF NOT EXISTS "TB_FACTORES_TRIBUTARIOS" (
    "id_factor" SERIAL PRIMARY KEY,
    "factor_afecto" NUMERIC(12, 6) NOT NULL,
    "factor_exento" NUMERIC(12, 6) NOT NULL,
    "factor_credito" NUMERIC(12, 6) NOT NULL,
    "fecha_calculo" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "estado_validacion" VARCHAR(20) NOT NULL DEFAULT 'VALIDADO',
    "folio_certificado" VARCHAR(50) NOT NULL REFERENCES "TB_CERTIFICADOS_DIVIDENDOS"("folio_certificado") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_factor_folio" ON "TB_FACTORES_TRIBUTARIOS"("folio_certificado");

-- 6. TABLA: TB_AUDIT_LOGS
CREATE TABLE IF NOT EXISTS "TB_AUDIT_LOGS" (
    "id_log" VARCHAR(64) PRIMARY KEY,
    "accion" VARCHAR(100) NOT NULL,
    "fecha_hora" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "payload_detalle" JSONB NOT NULL,
    "hash_sha256" VARCHAR(64) NOT NULL,
    "folio_certificado" VARCHAR(50) REFERENCES "TB_CERTIFICADOS_DIVIDENDOS"("folio_certificado") ON DELETE SET NULL,
    "usuario_rut" VARCHAR(12) NOT NULL REFERENCES "TB_USUARIOS"("rut") ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS "idx_audit_sha256" ON "TB_AUDIT_LOGS"("hash_sha256");
CREATE INDEX IF NOT EXISTS "idx_audit_fecha_hora" ON "TB_AUDIT_LOGS"("fecha_hora");
CREATE INDEX IF NOT EXISTS "idx_audit_accion" ON "TB_AUDIT_LOGS"("accion");

-- ==============================================================================
-- DATOS SEMILLA (ROLES, USUARIOS, EMISORES, CERTIFICADOS Y FACTORES OFICIALES)
-- ==============================================================================

-- Roles
INSERT INTO "TB_ROLES" ("id_rol", "nombre_rol", "descripcion", "nivel_acceso")
VALUES
    (1, 'Operador Corredora', 'Carga masiva, cálculo y validación de dividendos (LarrainVial)', 1),
    (2, 'Auditor nuam', 'Revisión técnica, verificación de hashes SHA-256 y cierre de lotes fiscales', 2),
    (3, 'Administrador Plataforma', 'Gobernanza global, control de accesos RBAC y auditoría general', 3)
ON CONFLICT ("nombre_rol") DO NOTHING;

-- Usuarios (Contraseña 'Nuam2026!' hasheada con PBKDF2)
INSERT INTO "TB_USUARIOS" ("rut", "nombre", "email", "password_hash", "id_corredora", "estado", "id_rol")
VALUES
    ('12.345.678-9', 'Angelo Corredor', 'operador@larrainvial.cl', 'pbkdf2_sha256$870000$cOqM1k2p3q4r$sW9A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T=', 'LarrainVial S.A. Corredora', 'ACTIVO', 1),
    ('9.876.543-2', 'Martín Auditor', 'auditor@nuam.com', 'pbkdf2_sha256$870000$cOqM1k2p3q4r$sW9A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T=', 'nuam Holding Regional', 'ACTIVO', 2),
    ('11.222.333-4', 'Vicente Administrador', 'admin@nuam.com', 'pbkdf2_sha256$870000$cOqM1k2p3q4r$sW9A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T=', 'nuam Holding Regional', 'ACTIVO', 3)
ON CONFLICT ("rut") DO NOTHING;

-- Emisores
INSERT INTO "TB_EMISORES" ("rut_emisor", "razon_social", "pais_origen", "sector_economico")
VALUES
    ('97.004.000-5', 'Banco de Chile', 'Chile', 'Banca y Servicios Financieros'),
    ('91.564.000-8', 'Falabella S.A.', 'Chile', 'Retail y Comercio Minorista'),
    ('90.222.000-2', 'Empresas CMPC S.A.', 'Chile', 'Forestal y Celulosa'),
    ('89.862.200-2', 'Empresa Nacional de Telecomunicaciones S.A. (Entel)', 'Chile', 'Telecomunicaciones'),
    ('96.505.760-4', 'Colbún S.A.', 'Chile', 'Energía y Electricidad'),
    ('97.036.000-K', 'Banco Santander Chile', 'Chile', 'Banca y Servicios Financieros')
ON CONFLICT ("rut_emisor") DO NOTHING;

-- Certificados de Prueba
INSERT INTO "TB_CERTIFICADOS_DIVIDENDOS" ("folio_certificado", "rut_emisor", "anio_tributario", "fecha_pago", "monto_total_bruto", "estado_proceso")
VALUES
    ('LT-2026-0041', '97.004.000-5', 2026, '2026-03-15', 3240500000.00, 'Aprobado'),
    ('LT-2026-0040', '91.564.000-8', 2026, '2026-03-20', 987320000.00, 'Observado'),
    ('LT-2026-0039', '90.222.000-2', 2026, '2026-04-05', 2115000000.00, 'Cerrado'),
    ('LT-2026-0038', '89.862.200-2', 2026, '2026-04-12', 456800000.00, 'Aprobado'),
    ('LT-2026-0037', '96.505.760-4', 2026, '2026-04-18', 1890200000.00, 'Aprobado'),
    ('LT-2025-0102', '97.004.000-5', 2025, '2025-03-14', 2980000000.00, 'Cerrado'),
    ('LT-2024-0097', '97.036.000-K', 2024, '2024-03-10', 2450000000.00, 'Cerrado')
ON CONFLICT ("folio_certificado") DO NOTHING;

-- Factores Tributarios (Precisión estricta 6 decimales)
INSERT INTO "TB_FACTORES_TRIBUTARIOS" ("folio_certificado", "factor_afecto", "factor_exento", "factor_credito", "estado_validacion")
VALUES
    ('LT-2026-0041', 0.700000, 0.300000, 0.100000, 'VALIDADO'),
    ('LT-2026-0040', 0.650000, 0.350000, 0.050000, 'VALIDADO'),
    ('LT-2026-0039', 0.800000, 0.200000, 0.080000, 'VALIDADO'),
    ('LT-2026-0038', 0.500000, 0.500000, 0.000000, 'VALIDADO'),
    ('LT-2026-0037', 0.750000, 0.250000, 0.120000, 'VALIDADO'),
    ('LT-2025-0102', 0.680000, 0.320000, 0.095000, 'VALIDADO'),
    ('LT-2024-0097', 0.600000, 0.400000, 0.100000, 'VALIDADO');
