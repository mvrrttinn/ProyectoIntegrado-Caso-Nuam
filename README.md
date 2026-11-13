# Mantenedor Web Centralizado de Calificaciones Tributarias y Dividendos
## nuam EXCHANGE GROUP (Holding Bursátil Regional Chile · Perú · Colombia)
**Proyecto Integrado de Desarrollo de Software — Evaluación 3 (Nivel Destacado)**

---

## 📖 Descripción y Planteamiento del Problema
En el mercado bursátil regional, las corredoras de bolsa gestionan la información tributaria de dividendos a través de procesos manuales y planillas de cálculo dispersas. Esta práctica introduce **riesgos críticos de descuadre aritmético** en las proporciones de renta afecta y exenta, provocando observaciones tributarias y sanciones severas por incumplimiento ante el **Servicio de Impuestos Internos (SII - Declaraciones Juradas DJ 1949 / DJ 1922)** y normativas de la **Comisión para el Mercado Financiero (CMF)**.

Esta plataforma proporciona una **solución web centralizada, transaccional y resiliente** que automatiza la ingesta masiva (CSV), validación algorítmica preventiva, cálculo con precisión estricta a 6 decimales (`Decimal('0.000001')`), segregación de funciones (RBAC) y bitácora de auditoría inmutable con firmas criptográficas **SHA-256**.

---

## 🏛️ Arquitectura del Software (Modelo 4+1 Vistas de Kruchten)
El desarrollo respeta con rigurosidad 1:1 el diseño de la **Evaluación 2**:
- **Vista Lógica (UML 2.5):** Estructura orientada a objetos en 3FN con 6 entidades de datos (`Rol`, `Usuario`, `Emisor`, `CertificadoDividendo`, `FactorTributario`/`DetalleFactorTributario`, `LogAuditoria`).
- **Vista de Procesos (BPMN 2.0):** Implementación de compuertas de decisión:
  - *Compuerta 1 (Sintaxis CSV):* Validación de codificación y columnas obligatorias -> `HTTP 400 Bad Request`.
  - *Compuerta 2 (Consistencia Fiscal):* Verificación de la regla $factor\_afecto + factor\_exento = 1.000000$. En caso de discrepancia -> `HTTP 422 Unprocessable Entity`.
  - *Flujo Transaccional:* Persistencia atómica (`transaction.atomic()`) y firma SHA-256 -> `HTTP 201 Created`.
- **Vista de Desarrollo (Componentes):** Arquitectura desacoplada en 4 capas de servicio (`csv_ingestion_service`, `tax_engine_service`, `security_rbac_service`, `audit_alerts_service`).
- **Vista Física / Despliegue:** Persistencia híbrida combinando **PostgreSQL en Supabase** (motor relacional ACID para transacciones financieras) y **MongoDB Atlas** (almacén documental NoSQL inmutable con hashes SHA-256).

---

## ⚖️ Matriz de Justificación Tecnológica (Subsanación Criterio 2.1.2.4)

| Componente | Tecnología Seleccionada | Alternativas Descartadas | Justificación Técnica y Normativa (nuam / CMF) |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | **React 19 + TypeScript + Vite** | Angular, Vue 3, Vanilla JS | Ecosistema reactivo estándar en fintech. TypeScript garantiza tipado estático estricto para evitar errores de punto flotante en la UI. Vite 8 ofrece un tiempo de compilación inferior a 150 ms con Hot Module Replacement (HMR). |
| **Backend REST** | **Python 3.12 + Django 5.2 + DRF** | FastAPI, Express.js, Spring Boot | Django provee un ORM maduro con transacciones atómicas nativas (`atomic()`), motor criptográfico de contraseñas (`PBKDF2/Argon2`) y un módulo REST Framework ideal para implementar políticas de autorización RBAC (ISO 27001). |
| **Motor de Cálculo** | **Python `decimal.Decimal` (ROUND_HALF_UP)** | Float nativo (IEEE-754) | **Regla no negociable:** Los floats en binario producen errores de redondeo (ej. `0.1 + 0.2 = 0.30000000000000004`). La clase `Decimal` garantiza precisión exacta de 6 dígitos decimales (`0.000001`) exigida por el SII para las declaraciones juradas DJ 1949/1922. |
| **Base Relacional ACID** | **PostgreSQL 15 vía Supabase** | MySQL, Oracle DB, SQLite en prod | Soporte de transacciones complejas, extensiones criptográficas, pooling transaccional PGBouncer y compatibilidad total con Django ORM. |
| **Auditoría y Trazabilidad** | **MongoDB Atlas + Hashes SHA-256** | Tabla relacional simple | Almacenamiento no relacional flexible para esquemas de eventos JSON semi-estructurados con cadena de custodia criptográfica inmune a repudiación legal ante la CMF. |
| **Seguridad de Acceso** | **JWT (HS256) + MFA de 6 Dígitos** | Sesiones por cookie básicas | Cumplimiento de **ISO/IEC 27001 Control A.9 (Segregación de Funciones)**: Los operadores de corredora no pueden autorizar ni cerrar lotes fiscales; los auditores no pueden subir nóminas masivas. |

---

## 🚀 Guía de Instalación y Puesta en Marcha

### Prerrequisitos
- **Python:** Versión 3.12 o 3.13 instalada.
- **Node.js:** Versión 20 o 22 instalada con `npm`.
- **Git:** Instalado y configurado.

---

### Paso 1: Configuración del Backend (Django)

```powershell
# 1. Posicionarse en el backend
cd backend

# 2. Crear entorno virtual (si no existe) y activarlo
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # En PowerShell
# O en CMD: .\.venv\Scripts\activate.bat

# 3. Instalar dependencias oficiales
pip install -r requirements.txt

# 4. Configurar variables de entorno
# Revisar backend/.env (viene preconfigurado con soporte Supabase y fallback local transparente)

# 5. Ejecutar migraciones de base de datos
python manage.py migrate

# 6. Sembrar datos oficiales del prototipo nuam
python manage.py seed_nuam

# 7. Iniciar el servidor backend
python manage.py runserver 8000
```
La API quedará disponible en: `http://localhost:8000/api/v1/`

---

### Paso 2: Configuración del Frontend (React 19 + TypeScript + Vite)

```powershell
# Abrir una nueva terminal y situarse en frontend
cd frontend

# 1. Instalar dependencias npm
npm install

# 2. Compilar y verificar tipado TypeScript
npm run build

# 3. Iniciar el servidor de desarrollo
npm run dev
```
La aplicación web quedará accesible en: `http://localhost:5173/`

---

## 🔑 Credenciales Oficiales de Demostración (Perfiles de Acceso Rápido)

La pantalla de inicio de sesión incorpora botones de **acceso rápido en 1 clic** para cada rol:

| Rol Institucional | Usuario / Correo | Contraseña | Código MFA | Privilegios y Restricciones |
| :--- | :--- | :--- | :---: | :--- |
| **Operador Corredora** | `operador@larrainvial.cl` | `Nuam2026!` | `123456` | Ingesta masiva CSV, validación DJ 1949, consulta de lotes de su corredora. **Bloqueado para cerrar lotes fiscales (HTTP 403).** |
| **Auditor nuam** | `auditor@nuam.com` | `Nuam2026!` | `123456` | Revisión técnica regional, verificación SHA-256 en vivo y **aprobación y cierre de lotes fiscales**. Modo solo lectura en ingesta CSV. |
| **Administrador Plataforma** | `admin@nuam.com` | `Nuam2026!` | `123456` | Acceso universal, gobernanza de roles RBAC, gestión de cuentas de usuario y auditoría global. |

---

## 🧪 Ejecución del Protocolo Automatizado de Pruebas QA

Para ejecutar la suite completa de pruebas unitarias, de integración, de seguridad y benchmark con generación desatendida del reporte técnico:

```powershell
cd backend
python manage.py run_qa_protocol
```

También es posible ejecutar las pruebas estándar de Django:
```powershell
python manage.py test apps.core
```

El resultado detallado y la tabla comparativa se persisten en:
📄 [REPORTE_PRUEBAS_EVALUACION_3.md](file:///e:/Mis%20Documentos/OneDrive%20-%20INACAP/GitHub/ProyectoIntegrado-Caso-Nuam/docs/REPORTE_PRUEBAS_EVALUACION_3.md)

---

## 📂 Estructura del Repositorio
```text
ProyectoIntegrado-Caso-Nuam/
├── backend/
│   ├── apps/
│   │   └── core/
│   │       ├── management/commands/
│   │       │   ├── seed_nuam.py            # Sembrador de datos iniciales
│   │       │   └── run_qa_protocol.py      # Certificador QA automatizado
│   │       ├── migrations/                 # Migraciones ORM (6 tablas TB_*)
│   │       ├── services/                   # Componentes del Diagrama UML
│   │       │   ├── csv_ingestion_service.py # Ingesta y compuertas BPMN
│   │       │   ├── tax_engine_service.py   # Motor de cálculo a 6 decimales
│   │       │   ├── security_rbac_service.py # JWT, MFA y autorización RBAC
│   │       │   └── audit_alerts_service.py  # Bitácora SHA-256 y NoSQL
│   │       ├── models.py                   # 6 Entidades y métodos POO
│   │       ├── serializers.py              # Serializadores DRF
│   │       ├── views.py                    # Vistas con compuertas y códigos HTTP
│   │       ├── urls.py                     # Enrutador REST v1
│   │       └── tests.py                    # Suite de 12 pruebas integrales
│   ├── config/                             # Ajustes Django y settings híbridos
│   ├── .env                                # Configuración Supabase y MongoDB
│   └── requirements.txt                    # Dependencias Python
├── frontend/
│   ├── src/
│   │   ├── components/                     # Las 6 Vistas SPA interactivas
│   │   ├── services/api.ts                 # Cliente API REST y JWT
│   │   ├── types.ts                        # Interfaces TypeScript 1:1
│   │   ├── App.tsx                         # Orquestador SPA
│   │   └── App.css                         # Estilos institucionales WCAG 2.1 AA
│   ├── package.json
│   └── vite.config.ts
└── docs/
    └── REPORTE_PRUEBAS_EVALUACION_3.md     # Reporte de certificación QA
```

---
*Desarrollado para el cumplimiento académico y técnico de la Evaluación 3 — Proyecto Integrado de Software.*
