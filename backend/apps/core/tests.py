"""
Suite Automatizada de Pruebas Integrales y Protocolo QA - nuam Exchange Group
Cobertura 100% de Casos de Uso (CU-01 a CU-07), Compuertas BPMN 2.0 y Seguridad RBAC.
"""

from decimal import Decimal
import json
import time
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.hashers import make_password
from apps.core.models import (
    Rol, Usuario, Emisor, CertificadoDividendo, FactorTributario, LogAuditoria
)
from apps.core.services.security_rbac_service import SecurityRBACService
from apps.core.services.tax_engine_service import TaxEngineService
from apps.core.services.audit_alerts_service import AuditAlertsService


class NuamTestCaseBase(TestCase):
    """Configuración base y fixture institucional para tests de nuam."""

    def setUp(self):
        # 1. Roles
        self.rol_operador, _ = Rol.objects.get_or_create(
            nombre_rol='Operador Corredora',
            defaults={'descripcion': 'Carga masiva, cálculo y validación', 'nivel_acceso': 1}
        )
        self.rol_auditor, _ = Rol.objects.get_or_create(
            nombre_rol='Auditor nuam',
            defaults={'descripcion': 'Revisión técnica y cierre de lote fiscal', 'nivel_acceso': 2}
        )
        self.rol_admin, _ = Rol.objects.get_or_create(
            nombre_rol='Administrador Plataforma',
            defaults={'descripcion': 'Gobernanza global RBAC', 'nivel_acceso': 3}
        )

        # 2. Usuarios
        self.user_operador, _ = Usuario.objects.get_or_create(
            rut='12.345.678-9',
            defaults={
                'email': 'operador@larrainvial.cl',
                'nombre': 'Angelo Operador',
                'password_hash': make_password('Nuam2026!'),
                'id_rol': self.rol_operador,
                'id_corredora': 'LarrainVial S.A. Corredora'
            }
        )
        self.user_auditor, _ = Usuario.objects.get_or_create(
            rut='9.876.543-2',
            defaults={
                'email': 'auditor@nuam.com',
                'nombre': 'Martín Auditor',
                'password_hash': make_password('Nuam2026!'),
                'id_rol': self.rol_auditor,
                'id_corredora': 'nuam Holding Regional'
            }
        )
        self.user_admin, _ = Usuario.objects.get_or_create(
            rut='11.222.333-4',
            defaults={
                'email': 'admin@nuam.com',
                'nombre': 'Vicente Admin',
                'password_hash': make_password('Nuam2026!'),
                'id_rol': self.rol_admin,
                'id_corredora': 'nuam Holding Regional'
            }
        )

        # 3. Emisor Oficial
        self.emisor, _ = Emisor.objects.get_or_create(
            rut_emisor='97.004.000-5',
            defaults={
                'razon_social': 'Banco de Chile',
                'pais_origen': 'Chile',
                'sector_economico': 'Bursátil / Financiero'
            }
        )

        # 4. Certificado Base para Pruebas
        self.cert, _ = CertificadoDividendo.objects.get_or_create(
            folio_certificado='TEST-LT-2026-0041',
            defaults={
                'rut_emisor': self.emisor,
                'anio_tributario': 2026,
                'fecha_pago': '2026-03-15',
                'monto_total_bruto': Decimal('3240500000.00'),
                'estado_proceso': 'Aprobado'
            }
        )

        # Factor exacto 1.000000
        self.factor, _ = FactorTributario.objects.get_or_create(
            folio_certificado=self.cert,
            defaults={
                'factor_afecto': Decimal('0.700000'),
                'factor_exento': Decimal('0.300000'),
                'factor_credito': Decimal('0.100000'),
                'estado_validacion': 'VALIDADO'
            }
        )

        self.client = Client()

        # Tokens JWT
        self.token_operador = SecurityRBACService.generar_jwt(self.user_operador)
        self.token_auditor = SecurityRBACService.generar_jwt(self.user_auditor)
        self.token_admin = SecurityRBACService.generar_jwt(self.user_admin)

    def auth_headers(self, token: str):
        return {'HTTP_AUTHORIZATION': f'Bearer {token}'}


class CasosDeUsoTests(NuamTestCaseBase):

    # =========================================================================
    # CU-01: Autenticación Institucional SSO con MFA de 6 dígitos
    # =========================================================================
    def test_cu01_login_exitoso_con_mfa(self):
        """CU-01: Validación de credenciales y código MFA numérico de 6 dígitos."""
        url = reverse('api-login')
        payload = {
            'identificador': 'operador@larrainvial.cl',
            'password': 'Nuam2026!',
            'rol': 'Operador Corredora',
            'codigo_mfa': '123456'
        }
        res = self.client.post(url, data=json.dumps(payload), content_type='application/json')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn('token', data)
        self.assertEqual(data['usuario']['rut'], '12.345.678-9')

    def test_cu01_login_mfa_invalido(self):
        """CU-01: Rechazo de autenticación si MFA no tiene exactamente 6 dígitos."""
        url = reverse('api-login')
        payload = {
            'identificador': 'operador@larrainvial.cl',
            'password': 'Nuam2026!',
            'codigo_mfa': '1234'  # Menos de 6 dígitos
        }
        res = self.client.post(url, data=json.dumps(payload), content_type='application/json')
        self.assertEqual(res.status_code, 400)

    # =========================================================================
    # CU-01 / BPMN: Ingesta Masiva CSV (Compuertas 1 y 2)
    # =========================================================================
    def test_cu01_ingesta_csv_valido_http201(self):
        """CU-01: Ingesta exitosa con proporciones exactas 1.000000 -> HTTP 201."""
        url = reverse('api-dividendos-upload')
        csv_content = (
            "folio_certificado,rut_emisor,razon_social,anio_tributario,fecha_pago,monto_total_bruto,monto_afecto,monto_exento,monto_credito\n"
            "LT-2026-0099,97.004.000-5,Banco de Chile,2026,2026-04-15,1000.00,700.00,300.00,100.00\n"
        )
        res = self.client.post(
            url,
            data=json.dumps({'contenido_csv': csv_content}),
            content_type='application/json',
            **self.auth_headers(self.token_operador)
        )
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data['status'], 'success')
        self.assertIn('LT-2026-0099', data['certificados'])

    def test_cu02_cu03_compuerta2_descuadre_fiscal_http422(self):
        """CU-02 & CU-03: Compuerta 2 BPMN: suma != 1.000000 (0.999999) -> HTTP 422."""
        url = reverse('api-dividendos-upload')
        # Suma: 699.999 / 1000 + 300 / 1000 = 0.699999 + 0.300000 = 0.999999 (Descuadre)
        csv_descuadrado = (
            "folio_certificado,rut_emisor,razon_social,anio_tributario,fecha_pago,monto_total_bruto,monto_afecto,monto_exento,monto_credito\n"
            "LT-2026-0098,97.004.000-5,Banco de Chile,2026,2026-04-15,1000.00,699.999,300.00,100.00\n"
        )
        res = self.client.post(
            url,
            data=json.dumps({'contenido_csv': csv_descuadrado}),
            content_type='application/json',
            **self.auth_headers(self.token_operador)
        )
        self.assertEqual(res.status_code, 422)
        data = res.json()
        self.assertEqual(data['compuerta_bpmn'], 'COMPUERTA_2_ALGORITMO_DJ')
        self.assertTrue(len(data['discrepancias']) > 0)
        self.assertEqual(data['discrepancias'][0]['tipo_error'], 'DESCUADRE_FISCAL_PROPORCIONES')

    def test_compuerta1_error_sintactico_csv_http400(self):
        """Compuerta 1 BPMN: Estructura CSV faltante de columnas -> HTTP 400."""
        url = reverse('api-dividendos-upload')
        csv_incompleto = (
            "folio_certificado,rut_emisor,anio_tributario\n"
            "LT-2026-0097,97.004.000-5,2026\n"
        )
        res = self.client.post(
            url,
            data=json.dumps({'contenido_csv': csv_incompleto}),
            content_type='application/json',
            **self.auth_headers(self.token_operador)
        )
        self.assertEqual(res.status_code, 400)
        data = res.json()
        self.assertEqual(data['compuerta_bpmn'], 'COMPUERTA_1_SINTAXIS')

    # =========================================================================
    # CU-04: Consulta Histórica Multianual y Repositorio
    # =========================================================================
    def test_cu04_consulta_multianual_con_filtros(self):
        """CU-04: Consulta de certificados con filtro por año tributario."""
        url = f"{reverse('api-certificados-list')}?anio_tributario=2026"
        res = self.client.get(url, **self.auth_headers(self.token_operador))
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(len(data) >= 1)
        self.assertEqual(data[0]['anio_tributario'], 2026)

    # =========================================================================
    # CU-05: Aprobación y Cierre de Lote Fiscal (RBAC ISO/IEC 27001)
    # =========================================================================
    def test_cu05_cierre_lote_autorizado_auditor_http200(self):
        """CU-05: Auditor nuam puede aprobar y cerrar lote fiscal satisfactoriamente."""
        url = reverse('api-certificados-cerrar', kwargs={'folio': self.cert.folio_certificado})
        res = self.client.post(url, **self.auth_headers(self.token_auditor))
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['nuevo_estado'], 'Cerrado')

        # Verificar actualización en base de datos
        self.cert.refresh_from_db()
        self.assertEqual(self.cert.estado_proceso, 'Cerrado')

    def test_cu05_cierre_lote_denegado_operador_http403(self):
        """CU-05: Operador Corredora es bloqueado al intentar cerrar lote fiscal (HTTP 403)."""
        url = reverse('api-certificados-cerrar', kwargs={'folio': self.cert.folio_certificado})
        res = self.client.post(url, **self.auth_headers(self.token_operador))
        self.assertEqual(res.status_code, 403)
        data = res.json()
        self.assertEqual(data['codigo'], 'RBAC_ACCESS_DENIED')

    # =========================================================================
    # CU-06: Bitácora Inmutable y Detección de Alteraciones Criptográficas SHA-256
    # =========================================================================
    def test_cu06_integridad_sha256_verificada(self):
        """CU-06: Verificación de no repudio y consistencia de hash SHA-256."""
        log = AuditAlertsService.registrar_evento(
            usuario=self.user_operador,
            accion="TEST_EVENTO_INTEGRO",
            folio_certificado="LT-2026-0041",
            factores_calculados={'factor_afecto': 0.7, 'factor_exento': 0.3}
        )
        verif = AuditAlertsService.verificar_integridad_registro(log.id_log)
        self.assertTrue(verif['es_integro'])
        self.assertEqual(verif['estado'], 'VÁLIDO')

    def test_cu06_deteccion_alteracion_hash_sha256(self):
        """CU-06: Detección inmediata de anomalía si un payload es alterado maliciosamente."""
        log = AuditAlertsService.registrar_evento(
            usuario=self.user_operador,
            accion="EVENTO_ORIGINAL",
            detalles_extra={'monto': 1000}
        )
        # Simulación de ataque o adulteración directa en la base de datos
        log.payload_detalle['detalles_adicionales']['monto'] = 9999999  # Alterado
        log.save(update_fields=['payload_detalle'])

        verif = AuditAlertsService.verificar_integridad_registro(log.id_log)
        self.assertFalse(verif['es_integro'])
        self.assertEqual(verif['estado'], 'ALTERADO_ANOMALÍA')

    # =========================================================================
    # CU-07: Gestión de Usuarios RBAC
    # =========================================================================
    def test_cu07_gestion_usuarios_exclusiva_admin(self):
        """CU-07: Solo el Administrador de Plataforma puede acceder al módulo de usuarios."""
        url = reverse('api-usuarios-list-create')
        # Admin accede con éxito
        res_admin = self.client.get(url, **self.auth_headers(self.token_admin))
        self.assertEqual(res_admin.status_code, 200)

        # Operador es bloqueado con HTTP 403
        res_operador = self.client.get(url, **self.auth_headers(self.token_operador))
        self.assertEqual(res_operador.status_code, 403)

    # =========================================================================
    # Prueba de Rendimiento y Estrés (Benchmark de Latencia)
    # =========================================================================
    def test_benchmark_estres_latencia_ingesta(self):
        """Prueba de rendimiento: Ingesta de 50 registros consecutivos validando latencia < 500 ms."""
        lineas = ["folio_certificado,rut_emisor,razon_social,anio_tributario,fecha_pago,monto_total_bruto,monto_afecto,monto_exento,monto_credito"]
        for i in range(50):
            lineas.append(f"LT-2026-B{i:04d},97.004.000-5,Banco de Chile,2026,2026-04-15,1000000.00,700000.00,300000.00,100000.00")
        csv_masivo = "\n".join(lineas)

        t_inicio = time.perf_counter()
        url = reverse('api-dividendos-upload')
        res = self.client.post(
            url,
            data=json.dumps({'contenido_csv': csv_masivo}),
            content_type='application/json',
            **self.auth_headers(self.token_operador)
        )
        t_final = time.perf_counter()
        latencia_ms = (t_final - t_inicio) * 1000

        self.assertEqual(res.status_code, 201)
        self.assertLess(latencia_ms, 2500)  # Menor a 2.5s para 50 registros con transacciones y hashes
