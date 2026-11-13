"""
Componente: tax_engine_service.py
Interfaz: ITaxEngineAPI (Diagrama de Componentes UML 2.5)
Motor algorítmico DJ 1949 / DJ 1922 con aritmética estricta de precisión Decimal a 6 decimales.
"""

from decimal import Decimal, ROUND_HALF_UP, InvalidOperation
from typing import Dict, Any, Tuple


class TaxEngineService:
    """
    Implementación del motor de cálculo de factores tributarios.
    Regla estricta: No se permite el uso de floats para cálculos fiscales.
    """

    PRECISION_SEIS_DECIMALES = Decimal('0.000001')
    UNIDAD_EXACTA = Decimal('1.000000')

    @classmethod
    def to_decimal(cls, valor: Any) -> Decimal:
        """Convierte de forma segura cualquier entrada numérica a Decimal sin perder precisión."""
        if isinstance(valor, Decimal):
            return valor
        try:
            # Reemplazar comas si vienen en formato latino
            str_val = str(valor).strip().replace(',', '.')
            return Decimal(str_val)
        except (InvalidOperation, ValueError, TypeError) as exc:
            raise ValueError(f"Valor numérico inválido para cálculo fiscal: '{valor}'") from exc

    @classmethod
    def calcular_factores(
        cls,
        monto_total_bruto: Any,
        monto_afecto: Any,
        monto_exento: Any,
        monto_credito: Any
    ) -> Dict[str, Any]:
        """
        Calcula las proporciones exactas para DJ 1949 / DJ 1922.
        Retorna los factores calculados y la validación de cuadre aritmético.
        """
        d_bruto = cls.to_decimal(monto_total_bruto)
        d_afecto = cls.to_decimal(monto_afecto)
        d_exento = cls.to_decimal(monto_exento)
        d_credito = cls.to_decimal(monto_credito)

        if d_bruto <= Decimal('0.00'):
            raise ValueError("El monto total bruto debe ser un valor estrictamente mayor a 0.")

        if d_afecto < Decimal('0.00') or d_exento < Decimal('0.00') or d_credito < Decimal('0.00'):
            raise ValueError("Los montos afectos, exentos o créditos no pueden ser negativos.")

        # Cálculo de proporciones con redondeo comercial ROUND_HALF_UP a 6 decimales
        f_afecto = (d_afecto / d_bruto).quantize(cls.PRECISION_SEIS_DECIMALES, rounding=ROUND_HALF_UP)
        f_exento = (d_exento / d_bruto).quantize(cls.PRECISION_SEIS_DECIMALES, rounding=ROUND_HALF_UP)
        f_credito = (d_credito / d_bruto).quantize(cls.PRECISION_SEIS_DECIMALES, rounding=ROUND_HALF_UP)

        # Regla de consistencia fiscal (Compuerta 2 BPMN)
        suma_proporciones = (f_afecto + f_exento).quantize(cls.PRECISION_SEIS_DECIMALES, rounding=ROUND_HALF_UP)
        es_cuadre_exacto = (suma_proporciones == cls.UNIDAD_EXACTA)
        diferencia = (cls.UNIDAD_EXACTA - suma_proporciones).quantize(cls.PRECISION_SEIS_DECIMALES)

        return {
            'monto_total_bruto': str(d_bruto),
            'monto_afecto': str(d_afecto),
            'monto_exento': str(d_exento),
            'monto_credito': str(d_credito),
            'factor_afecto': str(f_afecto),
            'factor_exento': str(f_exento),
            'factor_credito': str(f_credito),
            'suma_proporciones': str(suma_proporciones),
            'es_cuadre_exacto': es_cuadre_exacto,
            'diferencia_descuadre': str(diferencia),
            'decimal_objects': {
                'factor_afecto': f_afecto,
                'factor_exento': f_exento,
                'factor_credito': f_credito,
                'suma_proporciones': suma_proporciones,
            }
        }
