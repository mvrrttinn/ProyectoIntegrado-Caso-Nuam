# REPORTE OFICIAL DE PRUEBAS DE SOFTWARE Y BENCHMARK TÉCNICO
## Plataforma Centralizada de Calificaciones Tributarias y Dividendos
**Institución:** nuam EXCHANGE GROUP (Holding Regional Chile · Perú · Colombia)  
**Proyecto Integrado de Desarrollo de Software — Evaluación 3**  
**Fecha de Ejecución Automatizada:** 13/11/2026 01:40:19  
**Entorno de Ejecución:** Python 3.12/3.14 / Django 5.2 / React 19 + TypeScript / Supabase PostgreSQL + MongoDB Atlas  
**Estado General de la Suite:** ✅ **100% APROBADO (12 de 12 Tests Unitarios + 11 de 11 Casos Protocolo QA - Nivel Destacado)**

---

## 1. Protocolo de Pruebas y Metodología Aplicada
El protocolo de pruebas ejecutado sigue las directrices internacionales del estándar **ISO/IEC/IEEE 29119** (Software Testing) y las normas de aseguramiento de calidad de la **CMF** y **SII (DJ 1949 / DJ 1922)**.

Se cubrieron de forma integral:
1. **Pruebas Unitarias de Precisión Aritmética:** Verificación de algoritmos con clase `Decimal` sin uso de floats (`0.000001` de precisión y suma exacta `1.000000`).
2. **Pruebas de Integración y Compuertas BPMN 2.0:** Validación de Compuerta 1 (Sintaxis CSV) y Compuerta 2 (Consistencia fiscal).
3. **Pruebas de Seguridad y Segregación de Funciones (RBAC - ISO 27001):** Validación de token MFA dinámico de 6 dígitos, autenticación JWT HS256, autodetección de roles y restricción estricta de privilegios (Operador vs. Auditor vs. Admin).
4. **Pruebas Criptográficas de No Repudio:** Firma y detección de manipulación en hashes SHA-256 en la colección inmutable de auditoría.
5. **Pruebas de Rendimiento y Estrés:** Ingesta de lotes concurrentes midiendo latencia media y consumo transaccional.
6. **Pruebas de Resiliencia Cloud & Auto-Migración:** Comprobación de recuperación ante reinicios de contenedor en Render y persistencia en Supabase.

---

## 2. Matriz Comparativa de Resultados de Ejecución (Protocolo QA)

| Caso de Prueba | Funcionalidad Evaluada | Resultado Esperado | Resultado Obtenido | Latencia (ms) | Discrepancias / Observaciones | Estado |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `CP-01` | **CU-01: Autenticación SSO y Token MFA 6 Dígitos** | HTTP 200 OK + JWT HS256 emitido | HTTP 200 (success) | 664.06 ms | Ninguna (MFA validado) | **`APROBADO`** |
| `CP-02` | **Compuerta 1 BPMN: Detección de Inconsistencia Sintáctica CSV** | HTTP 400 Bad Request (Faltan columnas normativas) | HTTP 400 (ERROR_SINTACTICO_CSV) | 3.62 ms | Captura sintáctica preventiva correcta | **`APROBADO`** |
| `CP-03` | **Compuerta 2 BPMN: Descuadre Aritmético (Suma = 0.999999)** | HTTP 422 Unprocessable Entity + Registro de discrepancia | HTTP 422 (ERROR_CONSISTENCIA_FISCAL) | 354.99 ms | Detectada: Suma de factores (0.999999) no cuadra en 1.000000 | **`APROBADO`** |
| `CP-04` | **CU-01 / BPMN: Ingesta Exitosa y Persistencia Transaccional** | HTTP 201 Created + Hash SHA-256 generado | HTTP 201 (success) | 345.43 ms | Ninguna (Cuadre exacto 1.000000) | **`APROBADO`** |
| `CP-05` | **CU-04: Consulta Histórica Multianual con Filtros** | HTTP 200 OK + Listado con factores a 6 decimales | HTTP 200 (30 registros) | 22.72 ms | Ninguna | **`APROBADO`** |
| `CP-06` | **CU-05: Aprobación y Cierre de Lote Fiscal (Auditor nuam)** | HTTP 200 OK + Estado "Cerrado" | HTTP 200 (Estado: Cerrado) | 633.97 ms | Ninguna | **`APROBADO`** |
| `CP-07` | **RBAC ISO/IEC 27001: Bloqueo de Cierre a Operador Corredora** | HTTP 403 Forbidden (RBAC_ACCESS_DENIED) | HTTP 403 (RBAC_ACCESS_DENIED) | 1.41 ms | Violación de privilegios bloqueada | **`APROBADO`** |
| `CP-08` | **CU-06: Verificación de Firma SHA-256 en Bitácora Inmutable** | Integridad VÁLIDA (Hash coincide al 100%) | Estado: VÁLIDO (Hash 4b978a424ada...) | 1.05 ms | Cadena de custodia intacta | **`APROBADO`** |
| `CP-09` | **CU-06: Detección Automática de Adulteración de Datos** | Integridad ALTERADO_ANOMALÍA (Hash discrepante) | Estado: ALTERADO_ANOMALÍA | 543.23 ms | Alerta generada por alteración de firma | **`APROBADO`** |
| `CP-10` | **CU-07: Control de Acceso Exclusivo a Administración de Usuarios** | Admin: HTTP 200 | Operador: HTTP 403 | Admin: HTTP 200 | Operador: HTTP 403 | 4.15 ms | Segregación confirmada | **`APROBADO`** |
| `CP-11` | **Benchmark de Estrés: Ingesta de Lote Masivo (25 Certificados)** | HTTP 201 Created con Latencia < 2000 ms | HTTP 201 procesado en 761.58 ms | 761.58 ms | 0 errores (Procesamiento transaccional óptimo) | **`APROBADO`** |

---

## 3. Matriz de Pruebas Unitarias de Arquitectura (Django Test Suite)

Comando ejecutado: `python manage.py test apps.core` — **12 de 12 Tests Exitosos (OK)** en 27.69s.

| Test Unitario | Módulo / Método | Validación Técnica Realizada | Estado |
| :--- | :--- | :--- | :---: |
| `test_cu01_login_exitoso_con_mfa` | `SecurityRBACService` | Emisión de JWT tras validar firma y token MFA de 6 dígitos. | ✅ **OK** |
| `test_cu01_login_fallido_mfa_invalido` | `SecurityRBACService` | Rechazo inmediato (HTTP 401) ante código MFA incorrecto. | ✅ **OK** |
| `test_cu02_compuerta1_error_sintactico_csv` | `CsvIngestionService` | Intercepción BPMN Compuerta 1 con emisión de HTTP 400. | ✅ **OK** |
| `test_cu03_compuerta2_descuadre_factores_http422` | `TaxEngineService` | Intercepción BPMN Compuerta 2 ante suma != 1.000000 (HTTP 422). | ✅ **OK** |
| `test_cu03_ingesta_exitosa_y_persistencia_http201` | `CsvIngestionService` | Persistencia atómica de emisor, certificado y factores (HTTP 201). | ✅ **OK** |
| `test_cu04_consulta_historica_certificados_http200` | `CertificadosListView` | Filtros multianuales y serialización de factores tributarios. | ✅ **OK** |
| `test_cu05_cierre_lote_autorizado_auditor_http200` | `CertificadoCerrarView` | Cierre definitivo de lote fiscal por parte del Auditor nuam. | ✅ **OK** |
| `test_cu05_cierre_lote_denegado_operador_http403` | `CertificadoCerrarView` | Restricción RBAC: Operador Corredora bloqueado al intentar cerrar. | ✅ **OK** |
| `test_cu06_bitacora_inmutable_sha256_valida` | `AuditAlertsService` | Verificación de firma SHA-256 coincidente en bitácora. | ✅ **OK** |
| `test_cu06_bitacora_deteccion_manipulacion_anomalia` | `AuditAlertsService` | Detección automática de adulteración maliciosa en bitácora. | ✅ **OK** |
| `test_cu07_admin_rbac_gestion_usuarios_exclusiva` | `UsuariosListCreateView` | Acceso exclusivo del Administrador a gestión y edición de usuarios. | ✅ **OK** |
| `test_benchmark_estres_latencia_ingesta` | `CsvIngestionService` | Prueba de estrés: 50 ingestas consecutivas con latencia promedio < 500 ms. | ✅ **OK** |

---

## 4. Análisis de Validación Técnica frente a Rúbrica y Normativa

### 4.1. Cumplimiento de Compuertas BPMN 2.0 (Compuerta 1 y Compuerta 2)
- **Compuerta 1 (Validación Sintáctica):** Ante archivos CSV con columnas ausentes o cabeceras corruptas, el sistema responde de manera unificada con **`HTTP 400 Bad Request`**, evitando la ejecución innecesaria de rutinas pesadas de base de datos.
- **Compuerta 2 (Validación Fiscal DJ 1949):** Al procesar nóminas con sumas de factores discrepantes (por ejemplo, `suma = 0.999999`), el motor tributario detiene la transacción atómica, emite **`HTTP 422 Unprocessable Entity`** y devuelve la matriz detallada con la fila, diferencia y sugerencia de corrección.

### 4.2. Cumplimiento de Segregación de Funciones (RBAC - ISO/IEC 27001)
- La ejecución del endpoint de aprobación y cierre de lotes (`POST /api/v1/certificados/<folio>/cerrar/`) demostró una segregación perfecta:
  - **Auditor nuam:** Acceso permitido con actualización inmediata a estado `Cerrado` y emisión de log SHA-256 (**`HTTP 200 OK`**).
  - **Operador Corredora:** Acceso bloqueado automáticamente con código de infracción normativo (**`HTTP 403 Forbidden`**).
- **Gestión Integral de Usuarios (CU-07):** El Administrador puede actualizar nombres, correos, corretajes, roles, estados y contraseñas seguras bajo cifrado PBKDF2 (`PATCH /api/v1/usuarios/<id>/`).

### 4.3. Integridad Criptográfica de la Bitácora (Persistencia Híbrida)
- La prueba `CP-09` demostró que cualquier modificación manual o adulteración directa sobre los campos JSON en la base de datos invalida de inmediato la firma SHA-256 (`es_integro = False`), garantizando una cadena de auditoría inmutable e inviolable frente a auditorías externas de la CMF.

### 4.4. Políticas de Seguridad de Contraseñas y Depuración Segura de Datos
- **Contraseñas Reforzadas (ISO/IEC 27001):** Validación integral (8+ caracteres, mayúscula, minúscula, número y símbolo especial) implementada tanto a nivel cliente (checklist interactivo en tiempo real) como backend (`HTTP 400 Bad Request` ante incumplimiento).
- **Depuración Manual y Limpieza de Lotes de Prueba:** Se incorporaron los endpoints de eliminación atómica (`DELETE /api/v1/certificados/<folio>/`, `DELETE /api/v1/usuarios/<id>/`) y limpieza de lotes de demostración (`POST /api/v1/certificados/limpiar-pruebas/`), restableciendo la base de datos a sus 5 lotes oficiales normativos con registro de auditoría SHA-256.
- **Feedback Visual Ininterrumpido:** Notificación flotante global con isotipo nuam y spinner circular reactivo ante todas las llamadas asíncronas para eliminar la sensación de bloqueo en la interfaz.

### 4.5. Accesibilidad, Adaptabilidad Móvil y Presentación Institucional
- **Diseño Responsivo (WCAG 2.1 AA):** Adaptación a smartphones y tablets mediante menú hamburguesa desplegable (*off-canvas drawer*), reorganización fluida de tarjetas KPI (1 y 2 columnas) y deslizamiento táctil horizontal en tablas sin desbordamiento.
- **Nomenclatura Corporativa:** Limpieza completa de etiquetas académicas `(CU-...)` en la interfaz de usuario, adoptando títulos y roles de grado corporativo financiero internacional para la defensa ante la comisión.

---

## 5. Resumen de Calidad y Conclusión Técnica
La suite completa de software se encuentra en un estado **robusto, resiliente y de nivel de producción**. El cumplimiento frente a los requerimientos de la Evaluación 3 y las normativas CMF / SII alcanza el **100% de conformidad técnica**.
