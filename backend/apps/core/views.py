"""
Controladores y Vistas REST - nuam Exchange Group
Implementación estricta de compuertas BPMN 2.0 y Códigos de Respuesta HTTP:
- HTTP 200: Consulta o Cierre exitoso
- HTTP 201: Ingesta masiva y persistencia ACID con SHA-256 exitosa
- HTTP 400: Error Sintáctico CSV / Columnas faltantes (Compuerta 1)
- HTTP 403: Acceso no autorizado RBAC (ISO/IEC 27001)
- HTTP 422: Error de consistencia tributaria o suma != 1.000000 (Compuerta 2)
"""

from decimal import Decimal
from django.db.models import Sum, Count, Q
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from apps.core.models import (
    Usuario, Rol, Emisor, CertificadoDividendo, FactorTributario, LogAuditoria
)
from apps.core.serializers import (
    UsuarioSerializer, CertificadoDividendoSerializer,
    LoginInputSerializer, CalculoFactoresInputSerializer
)
from apps.core.services.security_rbac_service import (
    SecurityRBACService, NuamJWTAuthentication, rol_requerido
)
from apps.core.services.tax_engine_service import TaxEngineService
from apps.core.services.csv_ingestion_service import (
    CsvIngestionService, CsvSyntaxException, FiscalConsistencyException
)
from apps.core.services.audit_alerts_service import AuditAlertsService


class LoginView(APIView):
    """
    POST /api/v1/auth/login/
    Valida credenciales, verificación MFA de 6 dígitos y pertenencia de rol.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'error': 'DATOS_INVALIDOS',
                'detalles': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        identificador = serializer.validated_data['identificador']
        password = serializer.validated_data['password']
        rol_esperado = serializer.validated_data.get('rol')
        codigo_mfa = serializer.validated_data['codigo_mfa']

        try:
            usuario, token = SecurityRBACService.autenticar_usuario(
                identificador=identificador,
                password=password,
                codigo_mfa=codigo_mfa
            )
        except Exception as exc:
            return Response({
                'error': 'AUTHENTICATION_FAILED',
                'mensaje': str(exc)
            }, status=status.HTTP_401_UNAUTHORIZED)

        # Si el usuario seleccionó un rol específico en la UI, validar congruencia
        if rol_esperado and usuario.id_rol.nombre_rol != rol_esperado:
            # Permitir si es Admin Plataforma simulando rol o rechazar según política
            if usuario.id_rol.nombre_rol != 'Administrador Plataforma':
                return Response({
                    'error': 'ROL_DISCREPANCY',
                    'mensaje': f"El usuario no tiene asignado el rol '{rol_esperado}'."
                }, status=status.HTTP_403_FORBIDDEN)

        # Registrar evento de inicio de sesión exitoso
        AuditAlertsService.registrar_evento(
            usuario=usuario,
            accion="INICIO_SESION_EXITOSO",
            detalles_extra={'origen': 'PORTAL_WEB_SSO', 'mfa_verificado': True}
        )

        return Response({
            'status': 'success',
            'token': token,
            'usuario': {
                'id_usuario': usuario.id_usuario,
                'rut': usuario.rut,
                'email': usuario.email,
                'nombre': usuario.nombre,
                'rol': usuario.id_rol.nombre_rol,
                'nivel_acceso': usuario.id_rol.nivel_acceso,
                'corredora': usuario.id_corredora
            }
        }, status=status.HTTP_200_OK)


class UploadDividendosView(APIView):
    """
    POST /api/v1/dividendos/upload/
    Ingesta de nómina de dividendos con compuertas BPMN 2.0.
    """
    authentication_classes = [NuamJWTAuthentication]
    permission_classes = [IsAuthenticated, rol_requerido('Operador Corredora', 'Administrador Plataforma')]

    def post(self, request):
        # 1. Validar presencia de archivo
        archivo = request.FILES.get('archivo_csv') or (list(request.FILES.values())[0] if request.FILES else None)
        if not archivo:
            # Permitir también recepción del contenido CSV como string en body
            raw_csv = request.data.get('contenido_csv')
            if raw_csv:
                archivo_bytes = raw_csv.encode('utf-8')
            else:
                return Response({
                    'error': 'ARCHIVO_FALTANTE',
                    'mensaje': 'Debe adjuntar un archivo CSV en el campo multipart "archivo_csv".'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            archivo_bytes = archivo.read()

        try:
            # Invocar componente de ingesta
            resultado = CsvIngestionService.procesar_archivo_csv(archivo_bytes, request.user)
            return Response(resultado, status=status.HTTP_201_CREATED)

        except CsvSyntaxException as err_sintaxis:
            # Compuerta 1 BPMN: Error Sintáctico -> HTTP 400
            return Response({
                'error': 'ERROR_SINTACTICO_CSV',
                'compuerta_bpmn': 'COMPUERTA_1_SINTAXIS',
                'mensaje': str(err_sintaxis)
            }, status=status.HTTP_400_BAD_REQUEST)

        except FiscalConsistencyException as err_fiscal:
            # Compuerta 2 BPMN: Error de Consistencia Fiscal (suma != 1.000000) -> HTTP 422
            return Response({
                'error': 'ERROR_CONSISTENCIA_FISCAL',
                'compuerta_bpmn': 'COMPUERTA_2_ALGORITMO_DJ',
                'mensaje': str(err_fiscal),
                'discrepancias': err_fiscal.discrepancies,
                'accion_sugerida': 'El lote ha sido derivado a la bandeja de observaciones para corrección del emisor.'
            }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        except Exception as e:
            return Response({
                'error': 'INTERNAL_ERROR',
                'mensaje': f"Error no controlado durante la ingesta: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CalcularFactoresView(APIView):
    """
    POST /api/v1/factores/calcular/
    Motor tributario aritmético DJ 1949 / DJ 1922.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CalculoFactoresInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'error': 'PARAMETROS_INVALIDOS',
                'detalles': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            res = TaxEngineService.calcular_factores(
                monto_total_bruto=data['monto_total_bruto'],
                monto_afecto=data['monto_afecto'],
                monto_exento=data['monto_exento'],
                monto_credito=data['monto_credito']
            )
            # Quitar objetos de Decimal antes de retornar JSON
            res.pop('decimal_objects', None)
            return Response(res, status=status.HTTP_200_OK)
        except Exception as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class CertificadosListView(APIView):
    """
    GET /api/v1/certificados/
    Consulta histórica multianual (CU-04) con filtros y búsqueda.
    """
    authentication_classes = [NuamJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = CertificadoDividendo.objects.select_related('rut_emisor').prefetch_related('factores').all()

        anio = request.query_params.get('anio_tributario')
        if anio and anio.isdigit():
            qs = qs.filter(anio_tributario=int(anio))

        estado = request.query_params.get('estado_proceso')
        if estado:
            qs = qs.filter(estado_proceso__iexact=estado)

        emisor = request.query_params.get('rut_emisor')
        if emisor:
            qs = qs.filter(rut_emisor_id__iexact=emisor)

        search = request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(folio_certificado__icontains=search) |
                Q(rut_emisor__razon_social__icontains=search) |
                Q(rut_emisor__rut_emisor__icontains=search)
            )

        serializer = CertificadoDividendoSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CerrarLoteFiscalView(APIView):
    """
    POST /api/v1/certificados/<str:folio>/cerrar/
    Aprobación y Cierre de Lote Fiscal (CU-05).
    Exclusivo para el rol 'Auditor nuam' (o Administrador).
    Si un 'Operador Corredora' lo intenta, retorna HTTP 403 Forbidden.
    """
    authentication_classes = [NuamJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, folio):
        usuario = request.user
        rol_usuario = usuario.id_rol.nombre_rol

        # Verificación estricta de RBAC (ISO 27001)
        if rol_usuario not in ['Auditor nuam', 'Administrador Plataforma']:
            return Response({
                'error': 'FORBIDDEN',
                'codigo': 'RBAC_ACCESS_DENIED',
                'mensaje': (
                    f"Acceso denegado: El rol '{rol_usuario}' no posee atribuciones normativas "
                    "para aprobar y cerrar lotes fiscales. Acción exclusiva de 'Auditor nuam'."
                )
            }, status=status.HTTP_403_FORBIDDEN)

        cert = CertificadoDividendo.objects.filter(folio_certificado=folio).first()
        if not cert:
            return Response({
                'error': 'NOT_FOUND',
                'mensaje': f"Certificado con folio '{folio}' no encontrado."
            }, status=status.HTTP_404_NOT_FOUND)

        if not cert.verificar_cuadre_proporciones():
            return Response({
                'error': 'ERROR_CUADRE_FISCAL',
                'mensaje': f"El lote '{folio}' posee inconsistencias aritméticas y no puede cerrarse."
            }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        # Ejecutar cierre
        cert.cerrar_lote_fiscal()

        # Auditoría con firma SHA-256
        AuditAlertsService.registrar_evento(
            usuario=usuario,
            accion="CIERRE_LOTE_FISCAL",
            folio_certificado=cert.folio_certificado,
            estado="LOTE_CERRADO_EXITOSO",
            detalles_extra={'periodo_tributario': cert.anio_tributario, 'monto_bruto': str(cert.monto_total_bruto)}
        )

        return Response({
            'status': 'success',
            'mensaje': f"Lote fiscal '{folio}' aprobado y cerrado satisfactoriamente con firma digital.",
            'folio': cert.folio_certificado,
            'nuevo_estado': cert.estado_proceso
        }, status=status.HTTP_200_OK)


class AuditoriaListView(APIView):
    """
    GET /api/v1/auditoria/
    Consulta de bitácora inmutable con verificación SHA-256 en tiempo real (CU-06).
    """
    authentication_classes = [NuamJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        logs = AuditAlertsService.listar_auditoria(limite=100)
        return Response(logs, status=status.HTTP_200_OK)


class DashboardStatsView(APIView):
    """
    GET /api/v1/dashboard/stats/
    Retorna métricas consolidadas en tiempo real:
    - Total dividendos ($ CLP)
    - Cantidad total de certificados
    - Lotes observados / con discrepancia
    - Porcentaje de cumplimiento normativo
    """
    authentication_classes = [NuamJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total_monto = CertificadoDividendo.objects.aggregate(total=Sum('monto_total_bruto'))['total'] or Decimal('0.00')
        total_certificados = CertificadoDividendo.objects.count()
        total_observados = CertificadoDividendo.objects.filter(estado_proceso='Observado').count()
        total_cerrados = CertificadoDividendo.objects.filter(estado_proceso='Cerrado').count()
        total_aprobados = CertificadoDividendo.objects.filter(estado_proceso='Aprobado').count()

        cumplimiento = 0.0
        if total_certificados > 0:
            validos = total_certificados - total_observados
            cumplimiento = round((validos / total_certificados) * 100, 1)

        return Response({
            'total_dividendos_monto': str(total_monto),
            'total_dividendos_formateado': f"${(total_monto / Decimal('1000000')):,.0f}M" if total_monto >= 1000000 else f"${total_monto:,.0f}",
            'certificados_procesados': total_certificados,
            'lotes_discrepancia': total_observados,
            'porcentaje_cumplimiento': f"{cumplimiento}%",
            'desglose_estados': {
                'aprobados': total_aprobados,
                'observados': total_observados,
                'cerrados': total_cerrados,
            }
        }, status=status.HTTP_200_OK)


class UsuariosListCreateView(APIView):
    """
    GET/POST /api/v1/usuarios/
    Gestión de usuarios y asignación RBAC (CU-07). Exclusivo 'Administrador Plataforma'.
    """
    authentication_classes = [NuamJWTAuthentication]
    permission_classes = [IsAuthenticated, rol_requerido('Administrador Plataforma')]

    def get(self, request):
        usuarios = Usuario.objects.select_related('id_rol').all()
        serializer = UsuarioSerializer(usuarios, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = UsuarioSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        usuario = serializer.save()
        password_raw = request.data.get('password', 'Nuam2026!')
        usuario.cambiar_contrasena(password_raw)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class UsuarioDetailView(APIView):
    """
    PATCH /api/v1/usuarios/<int:pk>/
    Actualización de rol y estado de usuario. Exclusivo 'Administrador Plataforma'.
    """
    authentication_classes = [NuamJWTAuthentication]
    permission_classes = [IsAuthenticated, rol_requerido('Administrador Plataforma')]

    def patch(self, request, pk):
        usuario = Usuario.objects.filter(pk=pk).first()
        if not usuario:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        id_rol = request.data.get('id_rol')
        if id_rol:
            rol = Rol.objects.filter(id_rol=id_rol).first()
            if not rol:
                return Response({'error': 'Rol inválido'}, status=status.HTTP_400_BAD_REQUEST)
            usuario.id_rol = rol

        estado = request.data.get('estado')
        if estado:
            usuario.estado = estado

        usuario.save()

        AuditAlertsService.registrar_evento(
            usuario=request.user,
            accion="ACTUALIZACION_ROL_RBAC",
            detalles_extra={'usuario_afectado': usuario.email, 'nuevo_rol': usuario.id_rol.nombre_rol}
        )

        serializer = UsuarioSerializer(usuario)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RolesListView(APIView):
    """
    GET /api/v1/roles/
    Lista de roles para selectores de asignación RBAC.
    """
    authentication_classes = [NuamJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.core.serializers import RolSerializer
        roles = Rol.objects.all().order_by('nivel_acceso')
        serializer = RolSerializer(roles, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
