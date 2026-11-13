"""
Configuración del Panel Administrativo de Django - nuam Exchange Group
Gestión integral de Roles, Usuarios RBAC, Emisores, Certificados y Logs de Auditoría.
"""

from django.contrib import admin
from apps.core.models import (
    Rol, Usuario, Emisor, CertificadoDividendo, FactorTributario, LogAuditoria
)


@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ('id_rol', 'nombre_rol', 'nivel_acceso', 'descripcion')
    search_fields = ('nombre_rol', 'descripcion')
    ordering = ('nivel_acceso',)


@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('rut', 'nombre', 'email', 'id_rol', 'id_corredora', 'estado')
    list_filter = ('id_rol', 'estado', 'id_corredora')
    search_fields = ('rut', 'nombre', 'email', 'id_corredora')
    ordering = ('nombre', 'rut')
    actions = ['activar_usuarios', 'inactivar_usuarios']

    @admin.action(description="Activar cuentas seleccionadas")
    def activar_usuarios(self, request, queryset):
        queryset.update(estado='ACTIVO')

    @admin.action(description="Inactivar cuentas seleccionadas")
    def inactivar_usuarios(self, request, queryset):
        queryset.update(estado='INACTIVO')


@admin.register(Emisor)
class EmisorAdmin(admin.ModelAdmin):
    list_display = ('rut_emisor', 'razon_social', 'pais_origen', 'sector_economico')
    search_fields = ('rut_emisor', 'razon_social')
    list_filter = ('pais_origen', 'sector_economico')


class FactorTributarioInline(admin.TabularInline):
    model = FactorTributario
    extra = 0
    readonly_fields = ('fecha_calculo',)


@admin.register(CertificadoDividendo)
class CertificadoDividendoAdmin(admin.ModelAdmin):
    list_display = ('folio_certificado', 'rut_emisor', 'anio_tributario', 'fecha_pago', 'monto_total_bruto', 'estado_proceso')
    list_filter = ('anio_tributario', 'estado_proceso')
    search_fields = ('folio_certificado', 'rut_emisor__razon_social', 'rut_emisor__rut_emisor')
    inlines = [FactorTributarioInline]


@admin.register(FactorTributario)
class FactorTributarioAdmin(admin.ModelAdmin):
    list_display = ('id_factor', 'folio_certificado', 'factor_afecto', 'factor_exento', 'factor_credito', 'estado_validacion', 'fecha_calculo')
    list_filter = ('estado_validacion',)
    search_fields = ('folio_certificado__folio_certificado',)


@admin.register(LogAuditoria)
class LogAuditoriaAdmin(admin.ModelAdmin):
    list_display = ('id_log', 'accion', 'folio_certificado', 'usuario_rut', 'fecha_hora', 'hash_sha256')
    list_filter = ('accion', 'fecha_hora')
    search_fields = ('id_log', 'folio_certificado__folio_certificado', 'usuario_rut__rut', 'hash_sha256')
    readonly_fields = ('id_log', 'fecha_hora', 'hash_sha256', 'payload_detalle')
