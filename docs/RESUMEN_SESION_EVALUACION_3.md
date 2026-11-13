# Respaldo de Sesión y Guía Operativa — Evaluación 3
**Proyecto:** Mantenedor Centralizado de Calificaciones Tributarias y Dividendos  
**Institución:** nuam EXCHANGE GROUP (Holding Bursátil Regional Chile · Perú · Colombia)  
**Fecha de Sesión:** 12 de Noviembre de 2026  
**Documento para consulta rápida en el Instituto (INACAP)**

---

## 📌 1. Estado Actual del Proyecto

| Componente | Estado | Dónde está alojado / Configurado |
| :--- | :---: | :--- |
| **Base de Datos Relacional** | ✅ **100% Creada** | **Supabase PostgreSQL** en la nube (Proyecto ID: `zcjwldqhjduftkqfwsyb`). Contiene las 6 tablas (`TB_ROLES`, `TB_USUARIOS`, `TB_EMISORES`, `TB_CERTIFICADOS_DIVIDENDOS`, `TB_FACTORES_TRIBUTARIOS`, `TB_AUDIT_LOGS`) con llaves e índices. |
| **Frontend Web (SPA)** | 🚀 **Desplegado** | **Vercel**: [`https://proyecto-integrado-caso-nuam.vercel.app`](https://proyecto-integrado-caso-nuam.vercel.app) (React 19 + TypeScript + Vite). |
| **Backend REST API** | ✅ **Operativo** | Python 3.12 / Django 5.2 / DRF con compuertas BPMN 2.0 y cálculo estricto a 6 decimales (`Decimal`). |
| **Suite de Pruebas QA** | 🏆 **100% Aprobada** | 11 de 11 casos de prueba aprobados con reporte generado en `docs/REPORTE_PRUEBAS_EVALUACION_3.md`. |

---

## 🔑 2. Credenciales Oficiales de Demostración

La aplicación cuenta con **botones de acceso rápido en 1 clic** en el login. Si te piden ingresar manualmente:

| Perfil / Rol | Correo / RUT | Contraseña | Código MFA | Facultades Normativas |
| :--- | :--- | :--- | :---: | :--- |
| **Operador Corredora** | `operador@larrainvial.cl`<br>`12.345.678-9` | `Nuam2026!` | `123456` | Carga masiva CSV y validación DJ 1949. **Bloqueado para cerrar lotes (HTTP 403).** |
| **Auditor nuam** | `auditor@nuam.com`<br>`9.876.543-2` | `Nuam2026!` | `123456` | Revisión técnica regional, auditoría SHA-256 y **aprobación/cierre de lotes fiscales**. Modo solo lectura en carga CSV. |
| **Administrador Plataforma** | `admin@nuam.com`<br>`11.222.333-4` | `Nuam2026!` | `123456` | Control total, matriz de segregación RBAC y gestión de usuarios. |

---

## 💻 3. Cómo Levantar el Proyecto en el Instituto (Localmente)

Si en el instituto vas a correr el proyecto en una máquina del laboratorio:

### Paso 1: Clonar y entrar al repositorio
```powershell
git clone https://github.com/tu-usuario/ProyectoIntegrado-Caso-Nuam.git
cd ProyectoIntegrado-Caso-Nuam
```

### Paso 2: Levantar el Backend (Django)
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_nuam
python manage.py runserver 8000
```

### Paso 3: Levantar el Frontend (React)
En otra terminal:
```powershell
cd frontend
npm install
npm run dev
```
Abres `http://localhost:5173` y pruebas todo el sistema en vivo.

### Paso 4: Ejecutar el Protocolo de Pruebas QA
```powershell
cd backend
python manage.py run_qa_protocol
```

---

## 🌐 4. Tarea Pendiente: Conectar Vercel con el Backend en la Nube

Actualmente el frontend en Vercel muestra `Failed to fetch` al intentar autenticar porque aún no conectamos el backend en internet.

**Pasos a realizar cuando Outlook se restablezca y puedas entrar a GitHub:**
1. Entrar a **[render.com](https://render.com)** con GitHub.
2. Crear un **New Web Service** apuntando al repositorio `ProyectoIntegrado-Caso-Nuam`:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt && python manage.py migrate`
   - **Start Command:** `python manage.py runserver 0.0.0.0:$PORT`
   - **Environment Variables:** Copiar las variables de `backend/.env` (DATABASE_URL de Supabase, SECRET_KEY, etc.).
3. Render te entregará una URL como `https://nuam-backend.onrender.com`.
4. En **Vercel** vas a tu proyecto $\to$ **Settings** $\to$ **Environment Variables**:
   - Creas `VITE_API_BASE_URL` = `https://nuam-backend.onrender.com/api/v1`
   - Le das a **Redeploy** en Vercel.

¡Con eso el login en `https://proyecto-integrado-caso-nuam.vercel.app` funcionará desde cualquier celular o computador sin depender de tu PC!

---

## 🎯 5. Puntos Clave para la Defensa / Evaluación

Si te preguntan los profesores:
1. **¿Por qué la suma de factores no se desajusta en el cálculo?**  
   *Respuesta:* "No utilizamos números flotantes (`float`) en ninguna parte del backend. Empleamos la clase estándar `Decimal` con redondeo bancario `ROUND_HALF_UP` y precisión estricta de 6 decimales (`0.000001`), asegurando que $factor\_afecto + factor\_exento$ sume exactamente `1.000000` según la normativa de la DJ 1949 del SII."
2. **¿Cómo garantizan que un operador no apruebe sus propios lotes?**  
   *Respuesta:* "Implementamos control de acceso basado en roles (RBAC) bajo la norma ISO/IEC 27001 Control A.9. Si un Operador intenta ejecutar el endpoint `/cerrar/`, el sistema bloquea la transacción emitiendo `HTTP 403 Forbidden`."
3. **¿Cómo se asegura la integridad de la auditoría?**  
   *Respuesta:* "Cada evento genera un hash canónico SHA-256 sobre el payload. Si alguien altera manualmente un registro en la base de datos, el algoritmo de verificación detecta inmediatamente la discrepancia y marca el estado como `ALTERADO_ANOMALÍA`."
