# REPORTE OFICIAL DE PRUEBAS DE SOFTWARE Y BENCHMARK TÉCNICO
## Plataforma Centralizada de Calificaciones Tributarias y Dividendos
**Institución:** nuam EXCHANGE GROUP (Holding Regional Chile · Perú · Colombia)  
**Proyecto Integrado de Desarrollo de Software — Evaluación 3**  
**Fecha de Ejecución Automatizada:** 12/11/2026 21:59:16  
**Entorno de Ejecución:** Python 3.12 / Django 5.2 / React 19 + TypeScript / Supabase PostgreSQL + MongoDB Atlas  
**Estado General de la Suite:** ✅ **100% APROBADO (11 de 11 Casos de Prueba - Nivel Destacado)**

---

## 1. Protocolo de Pruebas y Metodología Aplicada
El protocolo de pruebas ejecutado sigue las directrices internacionales del estándar **ISO/IEC/IEEE 29119** (Software Testing) y las normas de aseguramiento de calidad de la **CMF** y **SII (DJ 1949 / DJ 1922)**.

Se cubrieron de forma integral:
1. **Pruebas Unitarias de Precisión Aritmética:** Verificación de algoritmos con clase `Decimal` sin uso de floats (`0.000001` de precisión y suma exacta `1.000000`).
2. **Pruebas de Integración y Compuertas BPMN 2.0:** Validación de Compuerta 1 (Sintaxis CSV) y Compuerta 2 (Consistencia fiscal).
3. **Pruebas de Seguridad y Segregación de Funciones (RBAC - ISO 27001):** Validación de token MFA de 6 dígitos, autenticación JWT y restricción de roles (Operador vs. Auditor vs. Admin).
4. **Pruebas Criptográficas de No Repudio:** Firma y detección de manipulación en hashes SHA-256 en la colección inmutable de auditoría.
5. **Pruebas de Rendimiento y Estrés:** Ingesta de lotes concurrentes midiendo latencia media y consumo transaccional.

---

## 2. Matriz Comparativa de Resultados de Ejecución

| Caso de Prueba | Funcionalidad Evaluada | Resultado Esperado | Resultado Obtenido | Latencia (ms) | Discrepancias / Observaciones | Estado |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `CP-01` | **CU-01: Autenticación SSO y Token MFA 6 Dígitos** | HTTP 200 OK + JWT HS256 emitido | HTTP 200 (success) | 379.11 ms | Ninguna (MFA validado) | **`APROBADO`** |
| `CP-02` | **Compuerta 1 BPMN: Detección de Inconsistencia Sintáctica CSV** | HTTP 400 Bad Request (Faltan columnas normativas) | HTTP 400 (ERROR_SINTACTICO_CSV) | 5.34 ms | Captura sintáctica preventiva correcta | **`APROBADO`** |
| `CP-03` | **Compuerta 2 BPMN: Descuadre Aritmético (Suma = 0.999999)** | HTTP 422 Unprocessable Entity + Registro de discrepancia | HTTP 422 (ERROR_CONSISTENCIA_FISCAL) | 98.69 ms | Detectada: La suma de factores (0.999999) no cuadra en 1.0000... | **`APROBADO`** |
| `CP-04` | **CU-01 / BPMN: Ingesta Exitosa y Persistencia Transaccional** | HTTP 201 Created + Hash SHA-256 generado | HTTP 201 (success) | 101.36 ms | Ninguna (Cuadre exacto 1.000000) | **`APROBADO`** |
| `CP-05` | **CU-04: Consulta Histórica Multianual con Filtros** | HTTP 200 OK + Listado con factores a 6 decimales | HTTP 200 (2 registros) | 19.04 ms | Ninguna | **`APROBADO`** |
| `CP-06` | **CU-05: Aprobación y Cierre de Lote Fiscal (Auditor nuam)** | HTTP 200 OK + Estado "Cerrado" | HTTP 200 (Estado: Cerrado) | 168.98 ms | Ninguna | **`APROBADO`** |
| `CP-07` | **RBAC ISO/IEC 27001: Bloqueo de Cierre a Operador Corredora** | HTTP 403 Forbidden (RBAC_ACCESS_DENIED) | HTTP 403 (RBAC_ACCESS_DENIED) | 1.77 ms | Violación de privilegios bloqueada | **`APROBADO`** |
| `CP-08` | **CU-06: Verificación de Firma SHA-256 en Bitácora Inmutable** | Integridad VÁLIDA (Hash coincide al 100%) | Estado: VÁLIDO (Hash a22da61adbdc...) | 0.98 ms | Cadena de custodia intacta | **`APROBADO`** |
| `CP-09` | **CU-06: Detección Automática de Adulteración de Datos** | Integridad ALTERADO_ANOMALÍA (Hash discrepante) | Estado: ALTERADO_ANOMALÍA | 166.96 ms | Alerta generada por alteración de firma | **`APROBADO`** |
| `CP-10` | **CU-07: Control de Acceso Exclusivo a Administración de Usuarios** | Admin: HTTP 200 | Operador: HTTP 403 | Admin: HTTP 200 | Operador: HTTP 403 | 3.13 ms | Segregación confirmada | **`APROBADO`** |
| `CP-11` | **Benchmark de Estrés: Ingesta de Lote Masivo (25 Certificados)** | HTTP 201 Created con Latencia < 2000 ms | HTTP 201 procesado en 348.15 ms | 348.15 ms | 0 errores (Procesamiento transaccional óptimo) | **`APROBADO`** |

### Métricas Consolidadas del Protocolo
- **Total Casos de Prueba Ejecutados:** 11
- **Casos Aprobados Exitosamente:** 11 (100.0%)
- **Casos Fallidos:** 0 (0.0%)
- **Latencia Promedio por Operación:** **117.59 ms** (Excelente rendimiento para aplicaciones financieras críticas).

---

## 3. Análisis de Validación Técnica frente a Rúbrica y Normativa

### 3.1. Cumplimiento de Compuertas BPMN 2.0 (Compuerta 1 y Compuerta 2)
- **Compuerta 1 (Validación Sintáctica):** Ante archivos CSV con columnas ausentes o cabeceras corruptas, el sistema responde de manera unificada con **`HTTP 400 Bad Request`**, evitando la ejecución innecesaria de rutinas pesadas de base de datos.
- **Compuerta 2 (Validación Fiscal DJ 1949):** Al procesar nóminas con sumas de factores discrepantes (por ejemplo, `suma = 0.999999`), el motor tributario detiene la transacción atómica, emite **`HTTP 422 Unprocessable Entity`** y devuelve la matriz detallada con la fila, diferencia y sugerencia de corrección.

### 3.2. Cumplimiento de Segregación de Funciones (RBAC - ISO/IEC 27001)
- La ejecución del endpoint de aprobación y cierre de lotes (`POST /api/v1/certificados/<folio>/cerrar/`) demostró una segregación perfecta:
  - **Auditor nuam:** Acceso permitido con actualización inmediata a estado `Cerrado` y emisión de log SHA-256 (**`HTTP 200 OK`**).
  - **Operador Corredora:** Acceso bloqueado automáticamente con código de infracción normativo (**`HTTP 403 Forbidden`**).

### 3.3. Integridad Criptográfica de la Bitácora (Persistencia Híbrida)
- La prueba `CP-09` demostró que cualquier modificación manual o adulteración directa sobre los campos JSON en la base de datos invalida de inmediato la firma SHA-256 (`es_integro = False`), garantizando una cadena de auditoría inmutable e inviolable frente a auditorías externas de la CMF.

---

## 4. Recomendaciones de Mejora Continua y DevSecOps
1. **Pipeline CI/CD en GitHub Actions:** Integrar la ejecución obligatoria de `python manage.py run_qa_protocol` en cada Pull Request hacia `develop` y `main`, bloqueando el merge si la latencia promedio supera los 500 ms o si algún test unitario falla.
2. **Sincronización en Streaming con Supabase Realtime:** Para la versión de despliegue en producción regional, acoplar WebSockets para notificar a los auditores en tiempo real tan pronto un lote con discrepancia sea subido por una corredora.
3. **Rotación Automática de Secretos JWT:** Configurar políticas de renovación y revocación de llaves criptográficas cada 90 días en cumplimiento del estándar PCI-DSS e ISO 27001.

---
*Reporte generado de forma desatendida por el comando de certificación QA de la plataforma nuam Exchange Group.*
