# Archivos de Simulación para Carga Masiva CSV — nuam EXCHANGE

Esta carpeta contiene 3 archivos CSV listos para arrastrar y soltar en la sección **"Carga Masiva de Dividendos"** de la plataforma web, simulando los 3 escenarios normativos de las compuertas BPMN 2.0:

---

## 🟢 1. Carga Válida y Exitosa (`1_CARGA_VALIDA_EXITOSA.csv`)
* **Compuerta BPMN 1 (Sintaxis):** ✅ APROBADA (Todas las columnas presentes y ordenadas).
* **Compuerta BPMN 2 (Consistencia Fiscal):** ✅ APROBADA (Suma exacta de factor afecto + factor exento = `1.000000`).
* **Resultado en Pantalla:**
  * Alerta verde de éxito (`HTTP 201 Created`).
  * Muestra el resumen de certificados procesados.
  * Genera el sello criptográfico SHA-256 en la bitácora inmutable.
  * Los certificados aparecen de inmediato en el **Repositorio Central**.

---

## 🟡 2. Error Fiscal por Descuadre Aritmético (`2_ERROR_COMPUERTA2_DESCUADRE_FISCAL.csv`)
* **Compuerta BPMN 1 (Sintaxis):** ✅ APROBADA (El archivo está bien estructurado).
* **Compuerta BPMN 2 (Consistencia Fiscal):** ❌ **RECHAZADA (Compuerta 2 intercepta).**
* **Causa:** En el folio `LT-2026-2001`, la suma de proporciones da `0.999999` (descuadre de `0.000001` contra `1.000000`).
* **Resultado en Pantalla:**
  * Alerta amarilla/roja de error de consistencia (`HTTP 422 Unprocessable Entity`).
  * Despliega la **matriz de discrepancias** indicando la fila afectada, la suma obtenida y la diferencia exacta.
  * La transacción se revierte de forma atómica (ACID), sin dejar datos corruptos.

---

## 🔴 3. Error Sintáctico por Columnas Faltantes (`3_ERROR_COMPUERTA1_SINTAXIS_FALTAN_COLUMNAS.csv`)
* **Compuerta BPMN 1 (Sintaxis):** ❌ **RECHAZADA (Compuerta 1 preventiva).**
* **Causa:** Faltan columnas normativas obligatorias (`razon_social`, `anio_tributario`, `fecha_pago`, `monto_afecto`, `monto_exento`, `monto_credito`).
* **Resultado en Pantalla:**
  * Alerta roja preventiva (`HTTP 400 Bad Request`).
  * Indica exactamente cuáles columnas normativas están ausentes en el encabezado.
  * Detiene la ejecución antes de tocar la base de datos para no consumir recursos innecesarios.
