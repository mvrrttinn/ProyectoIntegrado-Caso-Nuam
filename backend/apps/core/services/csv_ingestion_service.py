"""
Componente: csv_ingestion_service.py
Interfaz: IUploadAPI (Diagrama de Componentes UML 2.5)
Orquestador de ingesta masiva de dividendos con sanitización OWASP A03 y compuertas BPMN 2.0.
"""

import csv
from decimal import Decimal
import io
import re
from typing import Dict, Any, List, Tuple
from django.db import transaction
from django.utils import timezone
from apps.core.models import Emisor, CertificadoDividendo, FactorTributario, Usuario
from apps.core.services.tax_engine_service import TaxEngineService
from apps.core.services.audit_alerts_service import AuditAlertsService


class CsvSyntaxException(Exception):
    """Compuerta 1 BPMN: Error sintáctico o estructura CSV corrupta/incompleta (HTTP 400)."""
    pass


class FiscalConsistencyException(Exception):
    """Compuerta 2 BPMN: Error de cuadre aritmético o consistencia tributaria (HTTP 422)."""
    def __init__(self, message: str, discrepancies: List[Dict[str, Any]]):
        super().__init__(message)
        self.discrepancies = discrepancies


class CsvIngestionService:
    """
    Servicio de procesamiento de archivos de nómina de dividendos.
    """

    COLUMNAS_OBLIGATORIAS = [
        'folio_certificado',
        'rut_emisor',
        'razon_social',
        'anio_tributario',
        'fecha_pago',
        'monto_total_bruto',
        'monto_afecto',
        'monto_exento',
        'monto_credito'
    ]

    @classmethod
    def sanitizar_valor(cls, valor: Any) -> str:
        """
        Sanitización estricta contra inyección de fórmulas CSV (CWE-1236 / OWASP A03)
        y scripts maliciosos (XSS).
        """
        if valor is None:
            return ""
        s = str(valor).strip()
        # Si inicia con caracteres de comando u operadores de fórmula en Excel (=, +, -, @, tab, cr)
        if s.startswith(('=', '+', '-', '@', '\t', '\r')):
            s = "'" + s
        # Neutralizar tags de script
        s = re.sub(r'<[^>]*>', '', s)
        return s

    @classmethod
    def procesar_archivo_csv(cls, archivo_bytes: bytes, usuario: Usuario) -> Dict[str, Any]:
        """
        Flujo integral BPMN 2.0:
        1. Decodificación y validación sintáctica (Compuerta 1 -> HTTP 400).
        2. Validación algorítmica de consistencia fiscal (Compuerta 2 -> HTTP 422).
        3. Persistencia atómica transaccional y registro SHA-256 (HTTP 201).
        """
        # 1. Decodificar archivo
        try:
            contenido = archivo_bytes.decode('utf-8-sig')
        except UnicodeDecodeError:
            try:
                contenido = archivo_bytes.decode('latin-1')
            except Exception as e:
                raise CsvSyntaxException(f"Error de codificación: el archivo no es un texto válido. {e}")

        # Detectar delimitador (coma o punto y coma)
        lineas = [l for l in contenido.splitlines() if l.strip()]
        if not lineas:
            raise CsvSyntaxException("El archivo CSV está completamente vacío.")

        primera_linea = lineas[0]
        delimitador = ';' if ';' in primera_linea and ',' not in primera_linea else ','

        reader = csv.DictReader(io.StringIO(contenido), delimiter=delimitador)
        if not reader.fieldnames:
            raise CsvSyntaxException("No se pudieron identificar las cabeceras del archivo CSV.")

        # Normalizar cabeceras en minúsculas y sin espacios
        cabeceras_normalizadas = [cls.sanitizar_valor(col).lower() for col in reader.fieldnames]
        reader.fieldnames = cabeceras_normalizadas

        # Compuerta 1 BPMN: Verificar que estén todas las columnas requeridas
        faltantes = [col for col in cls.COLUMNAS_OBLIGATORIAS if col not in cabeceras_normalizadas]
        if faltantes:
            raise CsvSyntaxException(
                f"Estructura sintáctica inválida. Faltan las siguientes columnas obligatorias: {', '.join(faltantes)}"
            )

        filas_procesadas = []
        discrepancias = []

        # 2. Validación preventiva por fila (Compuerta 2)
        for idx, row in enumerate(reader, start=2):
            folio = cls.sanitizar_valor(row.get('folio_certificado'))
            rut_emisor = cls.sanitizar_valor(row.get('rut_emisor'))
            razon_social = cls.sanitizar_valor(row.get('razon_social'))
            anio_tributario_str = cls.sanitizar_valor(row.get('anio_tributario'))
            fecha_pago = cls.sanitizar_valor(row.get('fecha_pago'))
            bruto_str = cls.sanitizar_valor(row.get('monto_total_bruto'))
            afecto_str = cls.sanitizar_valor(row.get('monto_afecto'))
            exento_str = cls.sanitizar_valor(row.get('monto_exento'))
            credito_str = cls.sanitizar_valor(row.get('monto_credito'))

            # Validación de celdas no vacías
            if not folio or not rut_emisor or not bruto_str:
                discrepancias.append({
                    'fila': idx,
                    'folio': folio or f"FILA_{idx}",
                    'tipo_error': 'DATOS_INCOMPLETOS',
                    'descripcion': 'La fila contiene celdas requeridas en blanco.'
                })
                continue

            # Cálculo en el motor tributario con precisión Decimal
            try:
                resultado_factores = TaxEngineService.calcular_factores(
                    monto_total_bruto=bruto_str,
                    monto_afecto=afecto_str or '0',
                    monto_exento=exento_str or '0',
                    monto_credito=credito_str or '0'
                )
            except Exception as exc:
                discrepancias.append({
                    'fila': idx,
                    'folio': folio,
                    'tipo_error': 'ERROR_ARITMETICO',
                    'descripcion': str(exc)
                })
                continue

            # Compuerta 2 BPMN: ¿Es cuadre exacto? (suma == 1.000000)
            if not resultado_factores['es_cuadre_exacto']:
                discrepancias.append({
                    'fila': idx,
                    'folio': folio,
                    'tipo_error': 'DESCUADRE_FISCAL_PROPORCIONES',
                    'suma_obtenida': resultado_factores['suma_proporciones'],
                    'suma_esperada': '1.000000',
                    'diferencia': resultado_factores['diferencia_descuadre'],
                    'descripcion': (
                        f"La suma de factores ({resultado_factores['suma_proporciones']}) no cuadra en 1.000000. "
                        f"Discrepancia detectada: {resultado_factores['diferencia_descuadre']}."
                    )
                })
            else:
                filas_procesadas.append({
                    'folio': folio,
                    'rut_emisor': rut_emisor,
                    'razon_social': razon_social,
                    'anio_tributario': int(anio_tributario_str) if anio_tributario_str.isdigit() else 2026,
                    'fecha_pago': fecha_pago,
                    'monto_total_bruto': resultado_factores['to_decimal'] if hasattr(resultado_factores, 'to_decimal') else Decimal(bruto_str.replace(',', '.')),
                    'factores': resultado_factores
                })

        # Si se detectaron discrepancias en alguna fila, abortar todo el lote (Atomicidad Fiscal)
        if discrepancias:
            # Registrar evento de alerta de auditoría
            AuditAlertsService.registrar_evento(
                usuario=usuario,
                accion="RECHAZO_LOTE_DISCREPANCIAS",
                estado="RECHAZADO_DISCREPANCIA",
                detalles_extra={'total_errores': len(discrepancias), 'discrepancias': discrepancias}
            )
            raise FiscalConsistencyException(
                message=f"Se detectaron {len(discrepancias)} discrepancias fiscales o aritméticas en el lote CSV.",
                discrepancies=discrepancias
            )

        if not filas_procesadas:
            raise CsvSyntaxException("El archivo CSV no contiene registros procesables válidos.")

        # 3. Flujo Exitoso: Persistencia atómica ACID (PostgreSQL / Supabase)
        certificados_creados = []
        with transaction.atomic():
            for item in filas_procesadas:
                # Crear o actualizar Emisor
                emisor, _ = Emisor.objects.update_or_create(
                    rut_emisor=item['rut_emisor'],
                    defaults={
                        'razon_social': item['razon_social'] or f"Emisor {item['rut_emisor']}",
                        'pais_origen': 'Chile'
                    }
                )

                # Crear o actualizar CertificadoDividendo
                cert, _ = CertificadoDividendo.objects.update_or_create(
                    folio_certificado=item['folio'],
                    defaults={
                        'rut_emisor': emisor,
                        'anio_tributario': item['anio_tributario'],
                        'fecha_pago': item['fecha_pago'],
                        'monto_total_bruto': item['monto_total_bruto'],
                        'estado_proceso': 'Aprobado'
                    }
                )

                # Persistir factores tributarios
                dec_objs = item['factores']['decimal_objects']
                FactorTributario.objects.update_or_create(
                    folio_certificado=cert,
                    defaults={
                        'factor_afecto': dec_objs['factor_afecto'],
                        'factor_exento': dec_objs['factor_exento'],
                        'factor_credito': dec_objs['factor_credito'],
                        'estado_validacion': 'VALIDADO'
                    }
                )

                # Registrar auditoría con hash SHA-256 canónico
                AuditAlertsService.registrar_evento(
                    usuario=usuario,
                    accion="INGRESO_NOMINA_CSV",
                    folio_certificado=cert.folio_certificado,
                    factores_calculados={
                        'factor_afecto': float(dec_objs['factor_afecto']),
                        'factor_exento': float(dec_objs['factor_exento']),
                        'suma_proporciones': 1.000000
                    },
                    estado="VALIDADO_EXITOSO"
                )

                certificados_creados.append(cert.folio_certificado)

        return {
            'status': 'success',
            'mensaje': f"Procesamiento masivo completado exitosamente. Se integraron {len(certificados_creados)} certificados.",
            'total_registros': len(certificados_creados),
            'certificados': certificados_creados,
            'cuadre_proporciones': '1.000000 (Exacto)'
        }
