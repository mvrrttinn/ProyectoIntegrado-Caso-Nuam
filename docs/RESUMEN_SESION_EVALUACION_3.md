# Respaldo de Sesión y Guía Operativa — Evaluación 3
**Proyecto:** Mantenedor Centralizado de Calificaciones Tributarias y Dividendos  
**Institución:** nuam EXCHANGE GROUP (Holding Bursátil Regional Chile · Perú · Colombia)  
**Última Actualización:** 13 de Noviembre de 2026  
**Documento para continuación de trabajo en equipo y defensa técnica en INACAP**

---

## 📌 1. Estado Actual del Ecosistema y Despliegues en la Nube

El ecosistema se encuentra **100% operativo en producción cloud** con persistencia real y no efímera:

| Componente | Estado | Proveedor / URL | Descripción Técnica |
| :--- | :---: | :--- | :--- |
| **Frontend Web (SPA)** | 🚀 **Activo** | [Vercel](https://proyecto-integrado-caso-nuam.vercel.app) | React 19 + TypeScript + Vite. Branding oficial nuam, responsive, favicon corporativo y validaciones en español. |
| **Backend REST API** | 🚀 **Activo** | [Render](https://proyectointegrado-caso-nuam.onrender.com) | Python 3.14 / Django 5.2 / DRF. Conectado a base de datos persistente externa, CORS abierto y compuertas BPMN 2.0. |
| **Base de Datos Relacional** | 🗄️ **Activo** | **Supabase PostgreSQL** (`zcjwldqhjduftkqfwsyb`) | 6 tablas en 3FN (`TB_ROLES`, `TB_USUARIOS`, `TB_EMISORES`, `TB_CERTIFICADOS_DIVIDENDOS`, `TB_FACTORES_TRIBUTARIOS`, `TB_AUDIT_LOGS`). **Persistencia definitiva garantizada.** |
| **Auditoría Documental** | 🔒 **Activo** | **MongoDB Atlas** / Persistencia Híbrida | Almacenamiento inmutable de eventos con sellado criptográfico SHA-256. |
| **Suite de Pruebas Unitarias** | 🏆 **100% Aprobada** | `backend/apps/core/tests.py` | 12 de 12 tests unitarios pasando (`python manage.py test apps.core` - OK). |
| **Protocolo QA & Benchmark** | 🏆 **100% Aprobado** | `docs/REPORTE_PRUEBAS_EVALUACION_3.md` | 11 de 11 casos de prueba normativos aprobados (Latencia promedio: 303 ms). |

---

## 🔑 2. Credenciales Oficiales de Demostración

El portal cuenta con inicio de sesión corporativo unificado con autodetección de roles desde la base de datos:

| Rol Institucional | Correo Electrónico | RUT Oficial | Contraseña Institucional | Código MFA | Facultades Normativas |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Operador Corredora** | `operador@larrainvial.cl` | `12.345.678-9` | `Nuam2026!` | `123456` o `📲 OTP` | Carga masiva CSV y validación DJ 1949. **Bloqueado para cerrar lotes (HTTP 403).** |
| **Auditor nuam** | `auditor@nuam.com` | `9.876.543-2` | `Nuam2026!` | `123456` o `📲 OTP` | Revisión técnica regional, auditoría SHA-256 y **aprobación/cierre de lotes fiscales**. Modo lectura en carga CSV. |
| **Administrador Plataforma** | `admin@nuam.com` | `11.222.333-4` | `Nuam2026!` *(o clave personalizada)* | `123456` o `📲 OTP` | Control total, matriz de segregación RBAC, edición y creación de usuarios institucionales. |

> [!TIP]
> **Persistencia de Usuarios Modificados:**
> Anteriormente Render usaba un SQLite efímero que se borraba al entrar en reposo. **Esto ya fue solucionado**: Render ahora apunta a Supabase PostgreSQL. Si editas un usuario, cambias una contraseña o das de alta a alguien desde el panel RBAC, el cambio quedará grabado permanentemente en la nube y se reflejará en cualquier computador o celular.

---

## 🛡️ 3. Lo que se Avanzó y Resolvió Hoy

### 3.1. Persistencia Real en la Nube (Render $\to$ Supabase PostgreSQL)
* **Diagnóstico previo:** Los cambios en usuarios se perdían al entrar desde el celular porque Render Free reinicia el contenedor tras inactividad y borraba la base de datos temporal local.
* **Solución aplicada:**
  1. Se vinculó la variable de entorno `DATABASE_URL` en Render apuntando a **Supabase PostgreSQL** vía Session Pooler (IPv4).
  2. Se configuró el Build Command de Render con flag `--fake-initial`:
     ```bash
     pip install -r requirements.txt && python manage.py migrate --fake-initial
     ```
  3. Se adaptó `backend/config/wsgi.py` para sincronizar migraciones con `fake_initial=True`.

### 3.2. Identidad Visual y Branding Oficial nuam
* **Pestaña del Navegador:** Ya no dice "frontend". Ahora luce formal:  
  `<title>nuam EXCHANGE — Calificaciones Tributarias</title>`
* **Favicon Oficial:** Se integró el isotipo institucional **"N"** en degradado naranja-rojo como favicon del sitio (`/favicon.png`).
* **Header de Login y Navbar:** Ambas vistas incorporan el imagotipo de nuam junto a los títulos institucionales.

### 3.3. Archivos CSV para Demostración en Vivo (`ejemplos_csv/`)
Para simular el flujo ante la comisión o el profesor, se crearon 3 archivos en la carpeta [`ejemplos_csv/`](file:///c:/Users/sistemas/Documents/GitHub/ProyectoIntegrado-Caso-Nuam/ejemplos_csv):
1. **`1_CARGA_VALIDA_EXITOSA.csv`:** Carga óptima. Genera `HTTP 201 Created` y guarda los certificados con hash SHA-256.
2. **`2_ERROR_COMPUERTA2_DESCUADRE_FISCAL.csv`:** Error de inconsistencia fiscal DJ 1949. Suma de factores da `0.999999` $\to$ Genera `HTTP 422 Unprocessable Entity` con tabla de discrepancias.
3. **`3_ERROR_COMPUERTA1_SINTAXIS_FALTAN_COLUMNAS.csv`:** Error de estructura sintáctica. Faltan columnas obligatorias $\to$ Genera `HTTP 400 Bad Request` preventiva.

### 3.4. Configuración de Entorno Local (`.env`)
Se configuraron los archivos locales protegidos por `.gitignore`:
* **`frontend/.env`:** Apunta directamente al backend en producción:
  ```env
  VITE_API_BASE_URL=https://proyectointegrado-caso-nuam.onrender.com/api/v1
  ```
* **`backend/.env`:** Contiene los parámetros de desarrollo y fallback a SQLite para pruebas desconectadas.

### 3.5. Alineación Superior del Menú Lateral (Sidebar)
* **Problema:** Los botones del menú de navegación (`Dashboard`, `Carga Masiva`, `Repositorio`, `Bitácora`) quedaban flotando en la mitad inferior de la pantalla debido a un `justify-content: space-between` en el contenedor flex.
* **Solución aplicada:** Se reestructuró el CSS en `App.css` aplicando `.sidebar-nav { flex: 1; }` y `.sidebar-footer { margin-top: auto; }`. Con esto, las opciones de gestión quedan ancladas limpiamente arriba debajo del título **"MÓDULOS DE GESTIÓN"**, y el sello de conformidad CMF/ISO se mantiene abajo.

### 3.6. Política de Contraseñas Reforzadas (ISO/IEC 27001 Control A.9)
A solicitud de la comisión docente, se implementó una política estricta de robustez tanto en frontend como en backend para la creación y edición de usuarios:
* **Reglas validadas:**
  1. Mínimo **8 caracteres**.
  2. Al menos **1 letra mayúscula** (`A-Z`).
  3. Al menos **1 letra minúscula** (`a-z`).
  4. Al menos **1 número** (`0-9`).
  5. Al menos **1 carácter especial o signo** (`!`, `@`, `#`, `$`, `%`, `&`, `*`, etc.).
* **Frontend:** Se integró un componente visual interactivo `PasswordPolicyChecklist` en los modales de **Registrar Usuario** y **Editar Usuario**, que marca con `✅` en verde cada requisito cumplido en tiempo real mientras el usuario escribe.
* **Backend:** Método `Usuario.validar_password_reforzada()` ejecutado en `POST /api/v1/usuarios/` y `PATCH /api/v1/usuarios/<id>/`, devolviendo `HTTP 400 Bad Request` si la contraseña no cumple con la política.

### 3.7. Gestión y Depuración de Datos de Prueba (Eliminación de Entradas Manuales)
Para evitar la saturación de certificados y usuarios generados durante las pruebas y demostraciones en clases:
* **Eliminación Individual de Certificados/Lotes (`DELETE /api/v1/certificados/<folio>/`):**
  * Tanto en el **Repositorio Multianual** como en el **Dashboard Cierre Fiscal**, los perfiles autorizados (**Administrador Plataforma** y **Auditor nuam**) disponen del botón vectorial de papelera SVG por cada fila para eliminar un lote específico y sus factores tributarios asociados en cascada.
  * Incluye ventana modal de confirmación y registro criptográfico de la acción en `TB_AUDIT_LOGS`.
* **Limpieza Masiva de Lotes de Prueba (`POST /api/v1/certificados/limpiar-pruebas/`):**
  * Botón **"🧹 Limpiar Lotes de Prueba"** en la cabecera del Repositorio (disponible para Administradores y Auditores).
  * Purga automáticamente todos los certificados cargados manualmente durante las pruebas y restablece el repositorio dejando limpios los **5 lotes oficiales base normativos de la CMF**.
* **Eliminación de Usuarios de Prueba (`DELETE /api/v1/usuarios/<id>/`):**
  * En **Gobernanza RBAC**, el Administrador puede eliminar usuarios creados de prueba con botón de papelera SVG y confirmación modal (protegiendo siempre la cuenta del Administrador raíz).
* **Protección contra Cierre Accidental:** Se eliminó el cierre involuntario de ventanas flotantes por clic en el fondo oscuro en todos los modales de gestión.

### 3.8. Notificación Flotante de Carga Global con Branding nuam y Spinner Circular
Para evitar la sensación de congelamiento o incertidumbre en la pantalla durante operaciones asíncronas (eliminación de lotes, ingesta masiva CSV, validaciones y guardado):
* **Componente `FloatingLoader`:** Se desarrolló un componente visual flotante tipo toast con efecto glassmorphism (`backdrop-filter: blur(16px)`) ubicado prominentemente en el **centro superior** (`top: 1.5rem; left: 50%; transform: translateX(-50%)`) con animación suave de descenso (`toastSlideDownCenter`).
* **Branding e Iconografía Oficial:** Presenta el imagotipo oficial de **nuam EXCHANGE** enmarcado por un anillo de carga circular giratorio (`loader-spinner-ring`) en degradado naranja-rojo corporativo (`#f97316` / `#ef4444`).
* **Intercepción Reactiva Global:** Integrado a través del cliente API (`fetchWithLoader`), mostrando mensajes contextuales claros en español según la acción en curso (*"Eliminando lote fiscal...", "Ingestando nómina masiva...", "Guardando cambios de perfil...", etc.*).
* **Iconografía SVG y Alineación:** Reemplazo de emojis genéricos por botones vectoriales SVG (`.btn-icon-delete`) con alineación en línea fija (`.table-actions-cell`), impidiendo quiebres visuales de línea en tablas tanto en el Dashboard como en el Repositorio y RBAC.

### 3.9. Diseño Responsivo Mobile y Limpieza Visual Institucional
* **Limpieza de Nomenclatura Académica:** Se eliminaron todas las etiquetas tipo `(CU-01)`, `(CU-04)`, `(CU-06)`, `(CU-07)` de los títulos, botones y tablas de la interfaz de usuario, sustituyéndolas por títulos corporativos formales (*"Gobernanza de Accesos y Control de Seguridad RBAC"*, *"Repositorio Histórico Multianual"*, *"Bitácora Inmutable de Auditoría Criptográfica"*, etc.).
* **Menú Hamburguesa Móvil (☰):** En dispositivos móviles ($\le 768px$), aparece un botón hamburguesa en la barra superior que despliega el menú lateral como un cajón *off-canvas* con telón oscuro (*backdrop*). Se cierra automáticamente al seleccionar un módulo o tocar fuera.
* **Métricas y Tablas Adaptativas:** Las tarjetas KPI se reorganizan de 4 columnas a 2 en tablets y 1 columna en smartphones. Las tablas cuentan con deslizamiento táctil horizontal ininterrumpido sin desbordar el viewport del teléfono.
* **Preservación Total del Escritorio:** Toda la vista de escritorio ($> 1024px$) permanece 100% idéntica sin ninguna modificación estructural.

### 3.10. Formato Automático de RUT Chileno y Validación Módulo 11
* **Auto-completado en Tiempo Real:** Al ingresar el RUT en el formulario de creación de usuarios, el usuario solo debe teclear los números (sin preocuparse por puntos ni guiones). El sistema formatea automáticamente el texto en vivo a `XX.XXX.XXX-X`.
* **Validación Algorítmica Módulo 11:** Verificación instantánea del dígito verificador. Si es correcto, muestra un sello verde `✅ RUT válido (Módulo 11 CMF)`; si el dígito no corresponde a la fórmula bancaria, advierte al operador con `⚠️ Dígito verificador no coincide`.
* **Normalización en Backend y Login:** El backend normaliza de forma canónica cualquier RUT recibido antes de persistirlo en Supabase PostgreSQL y permite que en el inicio de sesión (`LoginView`) los usuarios puedan ingresar su RUT con o sin puntos ni guiones de forma indistinta.

---

## 💻 4. Guía para Continuar Trabajando desde Casa

Si tu compañero va a retomar el proyecto en su computador:

### Paso 1: Sincronizar el Repositorio
1. Abrir **GitHub Desktop**.
2. Hacer clic en **Fetch origin** y luego en **Pull origin** para descargar los últimos cambios de la rama `main`.

### Paso 2: Opciones de Ejecución

#### Opción A: Probar Directamente en Internet (Sin instalar nada)
Simplemente ingresar a:  
👉 **[https://proyecto-integrado-caso-nuam.vercel.app](https://proyecto-integrado-caso-nuam.vercel.app)**  
Cualquier acción se sincroniza en tiempo real contra Render y Supabase.

> [!TIP]
> **Para simular la vista móvil en el computador:**  
> En Google Chrome o Microsoft Edge presiona **F12** y luego **Ctrl + Shift + M** (o el ícono de celular/tablet en la esquina superior izquierda de DevTools). Podrás probar el menú hamburguesa (☰), las tarjetas KPI apiladas y el deslizamiento táctil horizontal sin necesidad de abrir el teléfono.

#### Opción B: Ejecutar Frontend Local con Backend Nube
Si va a tocar código de React:
```powershell
cd frontend
npm install
npm run dev
```
*(El frontend local le hablará automáticamente al backend en Render gracias a `frontend/.env`).*

#### Opción C: Ejecutar Suite de Tests y Verificación QA
Para comprobar la salud del backend y la rúbrica de evaluación:
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py test apps.core
python manage.py run_qa_protocol
```

---

## 🎯 5. Argumentos Clave para la Defensa frente a la Comisión INACAP

1. **¿Por qué la suma de factores nunca presenta discrepancias por redondeo?**  
   *Respuesta:* "No utilizamos tipos de punto flotante primitivos (`float`). Empleamos la clase estándar `decimal.Decimal` con redondeo bancario estricto `ROUND_HALF_UP` a 6 decimales (`0.000001`), garantizando que $factor\_afecto + factor\_exento$ sume exactamente `1.000000` bajo la normativa DJ 1949 del SII."

2. **¿Cómo garantizan la Segregación de Funciones (SoD) exigida por la CMF e ISO 27001?**  
   *Respuesta:* "Bajo el estándar ISO/IEC 27001 Control A.9, las funciones operativas y fiscalizadoras están estrictamente aisladas mediante decoradores `@rol_requerido`. Si un Operador intenta ejecutar el endpoint `/cerrar/`, el sistema bloquea inmediatamente la petición devolviendo un código `HTTP 403 Forbidden`."

3. **¿Cómo se comprueba que la bitácora de auditoría no fue adulterada?**  
   *Respuesta:* "Cada registro emite un hash canónico SHA-256 sobre su payload. Si un administrador o tercero modifica un registro directamente en la base de datos, el algoritmo de auditoría detecta la alteración matemática y clasifica el evento como `ALTERADO_ANOMALÍA`, alertando al oficial de cumplimiento."

4. **¿Cómo cumple el sistema con la Ley N° 21.719 de Protección de Datos Personales (y estándar ISO 27001 / 27701)?**  
   *Respuesta:* "El sistema adopta el principio de **Privacidad desde el Diseño** (*Privacy by Design*):
   * **Derechos ARCO:** Soporte nativo para *Acceso y Rectificación* (`PATCH /usuarios/<id>/`) y *Supresión / Cancelación* (`DELETE /usuarios/<id>/`).
   * **Seguridad Criptográfica:** Las contraseñas se almacenan exclusivamente con salteado irreversible PBKDF2-SHA256 y nunca se exponen en las respuestas de la API (`write_only: True`).
   * **Trazabilidad y Responsabilidad Proactiva (*Accountability*):** Cada acceso, modificación o baja de datos genera un registro inmutable con firma SHA-256 en la bitácora de auditoría.
   * **Autenticación Fuerte:** Doble factor MFA obligatorio para impedir accesos no autorizados a datos financieros."

5. **¿Cómo se relaciona con la norma técnica de pruebas ISO/IEC/IEEE 29119?**  
   *Respuesta:* "En el ámbito de calidad de software y aseguramiento de testing, el proyecto cuenta con el **100% de conformidad**: 12 de 12 pruebas unitarias pasando (`apps.core.tests`) y 11 de 11 casos de prueba normativos aprobados en el protocolo de benchmark técnico (`docs/REPORTE_PRUEBAS_EVALUACION_3.md`)."

---

## 📋 6. Reglas de Trabajo con Git
- **Todo commit y push se realiza manualmente desde GitHub Desktop.**
- Mensajes de commit descriptivos y claros.
- Antes de comenzar a editar código, presionar siempre **Fetch origin / Pull origin** para evitar conflictos.
