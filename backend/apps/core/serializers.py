"""
Serializadores DRF - Plataforma Centralizada nuam
Transformación de datos y validaciones de entrada/salida.
"""

from decimal import Decimal
from rest_framework import serializers
from apps.core.models import (
    Rol, Usuario, Emisor, CertificadoDividendo, FactorTributario, LogAuditoria
)


class RolSerializer(serializers.ModelSerializer):
    permisos = serializers.SerializerMethodField()

    class Meta:
        model = Rol
        fields = ['id_rol', 'nombre_rol', 'descripcion', 'nivel_acceso', 'permisos']

    def get_permisos(self, obj):
        return obj.obtener_permisos()


class UsuarioSerializer(serializers.ModelSerializer):
    rol_nombre = serializers.CharField(source='id_rol.nombre_rol', read_only=True)

    class Meta:
        model = Usuario
        fields = ['id_usuario', 'rut', 'nombre', 'email', 'id_rol', 'rol_nombre', 'id_corredora', 'estado']
        extra_kwargs = {
            'password_hash': {'write_only': True}
        }


class EmisorSerializer(serializers.ModelSerializer):
    rut_valido = serializers.SerializerMethodField()

    class Meta:
        model = Emisor
        fields = ['rut_emisor', 'razon_social', 'pais_origen', 'sector_economico', 'rut_valido']

    def get_rut_valido(self, obj):
        return obj.validar_rut()


class FactorTributarioSerializer(serializers.ModelSerializer):
    suma_proporciones = serializers.SerializerMethodField()
    es_cuadre_exacto = serializers.SerializerMethodField()

    class Meta:
        model = FactorTributario
        fields = [
            'id_factor', 'folio_certificado', 'factor_afecto', 'factor_exento',
            'factor_credito', 'fecha_calculo', 'estado_validacion',
            'suma_proporciones', 'es_cuadre_exacto'
        ]

    def get_suma_proporciones(self, obj):
        return str(obj.calcular_suma_factores())

    def get_es_cuadre_exacto(self, obj):
        return obj.es_cuadre_exacto()


class CertificadoDividendoSerializer(serializers.ModelSerializer):
    razon_social_emisor = serializers.CharField(source='rut_emisor.razon_social', read_only=True)
    rut_emisor_str = serializers.CharField(source='rut_emisor.rut_emisor', read_only=True)
    factores = FactorTributarioSerializer(many=True, read_only=True)
    primer_factor = serializers.SerializerMethodField()

    class Meta:
        model = CertificadoDividendo
        fields = [
            'folio_certificado', 'rut_emisor', 'rut_emisor_str', 'razon_social_emisor',
            'anio_tributario', 'fecha_pago', 'monto_total_bruto', 'estado_proceso',
            'factores', 'primer_factor'
        ]

    def get_primer_factor(self, obj):
        fac = obj.factores.first()
        if not fac:
            return None
        return {
            'factor_afecto': str(fac.factor_afecto),
            'factor_exento': str(fac.factor_exento),
            'factor_credito': str(fac.factor_credito),
            'suma_proporciones': str(fac.calcular_suma_factores()),
            'es_cuadre_exacto': fac.es_cuadre_exacto(),
            'estado_validacion': fac.estado_validacion
        }


class LogAuditoriaSerializer(serializers.ModelSerializer):
    timestamp = serializers.DateTimeField(source='fecha_hora', read_only=True)

    class Meta:
        model = LogAuditoria
        fields = [
            'id_log', 'folio_certificado', 'usuario_rut', 'accion',
            'fecha_hora', 'timestamp', 'payload_detalle', 'hash_sha256'
        ]


class LoginInputSerializer(serializers.Serializer):
    identificador = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    rol = serializers.CharField(required=False, allow_blank=True)
    codigo_mfa = serializers.CharField(required=True, min_length=6, max_length=6)


class CalculoFactoresInputSerializer(serializers.Serializer):
    monto_total_bruto = serializers.DecimalField(max_digits=18, decimal_places=2, required=True)
    monto_afecto = serializers.DecimalField(max_digits=18, decimal_places=2, required=True)
    monto_exento = serializers.DecimalField(max_digits=18, decimal_places=2, required=True)
    monto_credito = serializers.DecimalField(max_digits=18, decimal_places=2, required=True)
