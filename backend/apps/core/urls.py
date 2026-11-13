"""
Rutas de la API - apps.core
Versión: v1
"""

from django.urls import path
from apps.core.views import (
    LoginView, UploadDividendosView, CalcularFactoresView,
    CertificadosListView, CerrarLoteFiscalView, CertificadoDetailDeleteView,
    LimpiarCertificadosPruebaView, AuditoriaListView,
    DashboardStatsView, UsuariosListCreateView, UsuarioDetailView, RolesListView
)

urlpatterns = [
    # CU-01 & Autenticación MFA
    path('auth/login/', LoginView.as_view(), name='api-login'),

    # CU-01 & Ingesta Masiva CSV (Compuertas 1 y 2 BPMN)
    path('dividendos/upload/', UploadDividendosView.as_view(), name='api-dividendos-upload'),

    # CU-02 & CU-03 Motor Aritmético de Cálculo
    path('factores/calcular/', CalcularFactoresView.as_view(), name='api-factores-calcular'),

    # CU-04 Consulta Histórica Multianual y Repositorio
    path('certificados/', CertificadosListView.as_view(), name='api-certificados-list'),
    path('certificados/limpiar-pruebas/', LimpiarCertificadosPruebaView.as_view(), name='api-certificados-limpiar-pruebas'),
    path('certificados/<str:folio>/', CertificadoDetailDeleteView.as_view(), name='api-certificado-delete'),

    # CU-05 Aprobación y Cierre de Lote Fiscal (Auditor nuam)
    path('certificados/<str:folio>/cerrar/', CerrarLoteFiscalView.as_view(), name='api-certificados-cerrar'),

    # CU-06 Bitácora Inmutable y Verificación Criptográfica SHA-256
    path('auditoria/', AuditoriaListView.as_view(), name='api-auditoria-list'),

    # Métricas y KPIs de Dashboard en tiempo real
    path('dashboard/stats/', DashboardStatsView.as_view(), name='api-dashboard-stats'),

    # CU-07 Gestión y Gobernanza de Usuarios RBAC
    path('usuarios/', UsuariosListCreateView.as_view(), name='api-usuarios-list-create'),
    path('usuarios/<int:pk>/', UsuarioDetailView.as_view(), name='api-usuario-detail'),
    path('roles/', RolesListView.as_view(), name='api-roles-list'),
]
