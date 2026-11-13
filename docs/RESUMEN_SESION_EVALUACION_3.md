# Respaldo de Sesión y Guía Operativa — Evaluación 3
**Proyecto:** Mantenedor Centralizado de Calificaciones Tributarias y Dividendos  
**Institución:** nuam EXCHANGE GROUP (Holding Bursátil Regional Chile · Perú · Colombia)  
**Fecha de Sesión:** 13 de Noviembre de 2026  
**Documento de referencia rápida para continuación de trabajo y defensa en INACAP**

---

## 📌 1. Estado Actual del Ecosistema y Despliegues en la Nube

| Componente | Estado | Proveedor / URL | Descripción Técnica |
| :--- | :---: | :--- | :--- |
| **Frontend Web (SPA)** | 🚀 **Activo** | [Vercel](https://proyecto-integrado-caso-nuam.vercel.app) | React 19 + TypeScript + Vite. Interfaz corporativa limpia, responsiva y con validaciones en español. |
| **Backend REST API** | 🚀 **Activo** | [Render](https://proyectointegrado-caso-nuam.onrender.com) | Python 3.14 / Django 5.2 / Django REST Framework. Configurado con `ALLOWED_HOSTS` y CORS habilitado. |
| **Base de Datos Relacional** | 🗄️ **Activo** | **Supabase PostgreSQL** (`zcjwldqhjduftkqfwsyb`) | 6 tablas en 3FN (`TB_ROLES`, `TB_USUARIOS`, `TB_EMISORES`, `TB_CERTIFICADOS_DIVIDENDOS`, `TB_FACTORES_TRIBUTARIOS`, `TB_AUDIT_LOGS`). |
| **Auditoría Documental** | 🔒 **Activo** | **MongoDB Atlas** / Persistencia Híbrida | Almacenamiento inmutable de eventos con sellado criptográfico SHA-256. |
| **Suite de Pruebas Unitarias** | 🏆 **100% Aprobada** | `backend/apps/core/tests.py` | 12 de 12 pruebas unitarias de arquitectura pasando (`Ran 12 tests in 27s - OK`). |
| **Protocolo QA & Benchmark** | 🏆 **100% Aprobado** | `docs/REPORTE_PRUEBAS_EVALUACION_3.md` | 11 de 11 casos de prueba normativos aprobados (Latencia promedio: 303 ms). |

---

## 🔑 2. Credenciales Oficiales de Demostración

El portal cuenta con inicio de sesión corporativo unificado. Cada usuario es reconocido automáticamente por su rol según la base de datos:

| Rol Institucional | Correo Electrónico | RUT Oficial | Contraseña Institucional | Código MFA | Facultades Normativas |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Operador Corredora** | `operador@larrainvial.cl` | `12.345.678-9` | `Nuam2026!` | `123456` o `📲 OTP` | Carga masiva CSV y validación DJ 1949. **Bloqueado para cerrar lotes (HTTP 403).** |
| **Auditor nuam** | `auditor@nuam.com` | `9.876.543-2` | `Nuam2026!` | `123456` o `📲 OTP` | Revisión técnica regional, auditoría SHA-256 y **aprobación/cierre de lotes fiscales**. Modo lectura en carga CSV. |
| **Administrador Plataforma** | `admin@nuam.com` | `11.222.333-4` | `Nuam2026!` *(o clave personalizada)* | `123456` o `📲 OTP` | Control total, matriz de segregación RBAC, edición y creación de usuarios institucionales. |

> [!TIP]
> **Autenticación con Claves y Correos Personalizados:**
> Si como Administrador editaste tu correo o contraseña en el módulo de Gobernanza RBAC, puedes ingresar con tus nuevos datos o mediante tu RUT `11.222.333-4`. Además, el sistema cuenta con una **red de contingencia institucional**: el Administrador siempre puede ingresar con `admin@nuam.com` y `Nuam2026!` en caso de olvido o desincronización de credenciales.

---

## 🛡️ 3. Principales Mejoras Implementadas en la Sesión

### 3.1. Experiencia de Usuario y Login Profesional
- **Eliminación de accesos rápidos de prueba:** Se retiraron los botones de maqueta/demo para presentar un formulario corporativo sobrio y formal.
- **Funcionalidad "Recordar Usuario":** Casilla `☑️ Recordar mi usuario en este equipo`. Persiste en `localStorage` el último RUT o correo institucional ingresado. Al desmarcarla o cambiar de usuario, el formulario inicia limpio sin imponer correos genéricos.
- **Detección automática de roles:** Se suprimió el selector manual de roles en el inicio de sesión. El backend determina el rol legítimo de cada cuenta directamente desde `TB_USUARIOS`, erradicando discrepancias o errores de rol.
- **Factor de Autenticación MFA Dinámico:** El campo de código MFA inicia limpio con *placeholder* `000000`. Mediante el botón **"📲 Generar OTP"**, el usuario puede emitir códigos dinámicos de 6 dígitos en tiempo real.
- **Mensajes de validación claros en español:** Se sustituyeron respuestas genéricas en inglés (como *Failed to fetch*) por explicaciones directas ante datos incompletos, MFA ausente o contraseñas inválidas.

### 3.2. Gobernanza RBAC y Edición Completa de Usuarios (CU-07)
- **Modal de Edición (`✏️ Editar`):** Permite al Administrador modificar:
  - Nombre Completo.
  - Correo Electrónico Institucional (validando unicidad contra duplicados).
  - Institución o Corredora de Bolsa.
  - Rol Asignado (`Operador Corredora`, `Auditor nuam`, `Administrador Plataforma`).
  - Estado de la Cuenta (`ACTIVO` o `INACTIVO`).
  - **Contraseña Personalizada:** Hashing criptográfico mediante PBKDF2/Argon2 con guardado atómico.
- **Registro de Nuevos Usuarios (`➕`):** Formulario modal completo para dar de alta nuevos colaboradores bursátiles con contraseñas personalizadas.
- **Trazabilidad Inmutable:** Cada modificación de usuarios emite automáticamente un evento en la bitácora con firma criptográfica SHA-256.

### 3.3. Resiliencia en la Nube y Auto-Migración (Render)
- Se integró en `backend/config/wsgi.py` y en `security_rbac_service.py` un disparador automático que detecta si el contenedor de Render se reinició con base de datos en blanco. En tal caso, ejecuta `call_command('migrate')` de forma silenciosa para asegurar la presencia perpetua de los roles y usuarios maestros.

---

## 💻 4. Comandos de Operación y Pruebas en el Entorno Local

Si deseas ejecutar o validar el proyecto en tu máquina local o en el laboratorio:

### Backend (Django)
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

### Ejecutar Suite de Tests Unitarios (12 de 12 OK)
```powershell
cd backend
python manage.py test apps.core
```

### Ejecutar Protocolo de Certificación QA y Benchmark
```powershell
cd backend
python manage.py run_qa_protocol
```

### Frontend (React + Vite)
```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

---

## 🎯 5. Puntos Clave para la Defensa / Evaluación frente a la Comisión

1. **¿Por qué la suma de factores no presenta pérdidas por redondeo o float?**  
   *Respuesta:* "No utilizamos tipos de punto flotante primitivos (`float`) en ninguna capa de cálculo. Empleamos la clase estándar `decimal.Decimal` con redondeo bancario estricto `ROUND_HALF_UP` y precisión de 6 decimales (`0.000001`), garantizando que la suma entre factor afecto y exento equivalga exactamente a `1.000000` según la normativa de la DJ 1949 del SII."

2. **¿Cómo se asegura el principio de segregación de funciones (SoD)?**  
   *Respuesta:* "Bajo el estándar ISO/IEC 27001 Control A.9, las funciones operativas y auditoras están estrictamente aisladas mediante decoradores `@rol_requerido`. Si un Operador intenta ejecutar el endpoint `/cerrar/`, el sistema bloquea inmediatamente la petición devolviendo un código `HTTP 403 Forbidden`."

3. **¿Cómo se verifica que la bitácora de auditoría no haya sido adulterada?**  
   *Respuesta:* "Cada registro genera un hash canónico SHA-256 sobre su carga útil (RUT, acción, fecha y detalles). Si un tercero altera directamente cualquier valor en la base de datos, el algoritmo de auditoría detecta la discrepancia matemática del hash y clasifica el evento como `ALTERADO_ANOMALÍA`, alertando a la oficialía de cumplimiento de nuam."

---

## 📋 6. Recordatorio de Trabajo con Git
- Los cambios realizados en disco se gestionan exclusivamente desde **GitHub Desktop**.
- Realizar commit con un mensaje descriptivo (ej: `feat: modern login with remembered user and full profile editing`).
- Presionar **Push origin** para que Render y Vercel desplieguen automáticamente las actualizaciones.
