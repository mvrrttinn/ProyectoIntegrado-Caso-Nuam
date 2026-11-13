"""
Comando de inicialización de datos para la plataforma nuam.
python manage.py seed_nuam
Puebla tablas en Supabase PostgreSQL / SQLite local con roles, usuarios institucionales,
emisores bursátiles y dividendos históricos/oficiales del caso de uso.
"""

from decimal import Decimal
import uuid
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from django.db import transaction
from django.utils import timezone
from apps.core.models import (
    Rol, Usuario, Emisor, CertificadoDividendo, FactorTributario, LogAuditoria
)


class Command(BaseCommand):
    help = 'Puebla la base de datos con los registros oficiales de prueba para nuam Exchange Group'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("🚀 Iniciando sembrado de datos en la base de datos nuam..."))

        with transaction.atomic():
            # 1. ROLES
            roles_data = [
                {
                    'nombre_rol': 'Operador Corredora',
                    'descripcion': 'Carga masiva, cálculo y validación de dividendos (LarrainVial)',
                    'nivel_acceso': 1
                },
                {
                    'nombre_rol': 'Auditor nuam',
                    'descripcion': 'Revisión técnica, verificación de hashes SHA-256 y cierre de lotes fiscales',
                    'nivel_acceso': 2
                },
                {
                    'nombre_rol': 'Administrador Plataforma',
                    'descripcion': 'Gobernanza global, control de accesos RBAC y auditoría general',
                    'nivel_acceso': 3
                },
            ]

            roles_dict = {}
            for r_info in roles_data:
                rol, created = Rol.objects.update_or_create(
                    nombre_rol=r_info['nombre_rol'],
                    defaults={
                        'descripcion': r_info['descripcion'],
                        'nivel_acceso': r_info['nivel_acceso'],
                    }
                )
                roles_dict[rol.nombre_rol] = rol
                status_str = "Creado" if created else "Actualizado"
                self.stdout.write(f"  [Rol] {rol.nombre_rol}: {status_str}")

            # 2. USUARIOS OFICIALES
            usuarios_data = [
                {
                    'rut': '12.345.678-9',
                    'email': 'operador@larrainvial.cl',
                    'nombre': 'Angelo Corredor',
                    'password': 'Nuam2026!',
                    'id_corredora': 'LarrainVial S.A. Corredora',
                    'rol': roles_dict['Operador Corredora']
                },
                {
                    'rut': '9.876.543-2',
                    'email': 'auditor@nuam.com',
                    'nombre': 'Martín Auditor',
                    'password': 'Nuam2026!',
                    'id_corredora': 'nuam Holding Regional',
                    'rol': roles_dict['Auditor nuam']
                },
                {
                    'rut': '11.222.333-4',
                    'email': 'admin@nuam.com',
                    'nombre': 'Vicente Administrador',
                    'password': 'Nuam2026!',
                    'id_corredora': 'nuam Holding Regional',
                    'rol': roles_dict['Administrador Plataforma']
                }
            ]

            usuarios_dict = {}
            for u_info in usuarios_data:
                usuario, created = Usuario.objects.update_or_create(
                    rut=u_info['rut'],
                    defaults={
                        'email': u_info['email'],
                        'nombre': u_info['nombre'],
                        'password_hash': make_password(u_info['password']),
                        'id_corredora': u_info['id_corredora'],
                        'id_rol': u_info['rol'],
                        'estado': 'ACTIVO'
                    }
                )
                usuarios_dict[usuario.rut] = usuario
                status_str = "Creado" if created else "Actualizado"
                self.stdout.write(f"  [Usuario] {usuario.email} ({usuario.rut}): {status_str}")

            # 3. EMISORES BURSÁTILES
            emisores_data = [
                {'rut_emisor': '97.004.000-5', 'razon_social': 'Banco de Chile', 'sector': 'Banca y Servicios Financieros'},
                {'rut_emisor': '91.564.000-8', 'razon_social': 'Falabella S.A.', 'sector': 'Retail y Comercio Minorista'},
                {'rut_emisor': '90.222.000-2', 'razon_social': 'Empresas CMPC S.A.', 'sector': 'Forestal y Celulosa'},
                {'rut_emisor': '89.862.200-2', 'razon_social': 'Empresa Nacional de Telecomunicaciones S.A. (Entel)', 'sector': 'Telecomunicaciones'},
                {'rut_emisor': '96.505.760-4', 'razon_social': 'Colbún S.A.', 'sector': 'Energía y Electricidad'},
                {'rut_emisor': '97.036.000-K', 'razon_social': 'Banco Santander Chile', 'sector': 'Banca y Servicios Financieros'},
            ]

            emisores_dict = {}
            for e_info in emisores_data:
                emisor, created = Emisor.objects.update_or_create(
                    rut_emisor=e_info['rut_emisor'],
                    defaults={
                        'razon_social': e_info['razon_social'],
                        'pais_origen': 'Chile',
                        'sector_economico': e_info['sector']
                    }
                )
                emisores_dict[emisor.rut_emisor] = emisor
                status_str = "Creado" if created else "Actualizado"
                self.stdout.write(f"  [Emisor] {emisor.razon_social}: {status_str}")

            # 4. CERTIFICADOS Y FACTORES
            certificados_data = [
                {
                    'folio': 'LT-2026-0041',
                    'emisor': emisores_dict['97.004.000-5'],
                    'anio': 2026,
                    'fecha_pago': '2026-03-15',
                    'monto_bruto': Decimal('3240500000.00'),
                    'estado': 'Aprobado',
                    'factor_afecto': Decimal('0.700000'),
                    'factor_exento': Decimal('0.300000'),
                    'factor_credito': Decimal('0.100000')
                },
                {
                    'folio': 'LT-2026-0040',
                    'emisor': emisores_dict['91.564.000-8'],
                    'anio': 2026,
                    'fecha_pago': '2026-03-20',
                    'monto_bruto': Decimal('987320000.00'),
                    'estado': 'Observado',
                    'factor_afecto': Decimal('0.650000'),
                    'factor_exento': Decimal('0.350000'),
                    'factor_credito': Decimal('0.050000')
                },
                {
                    'folio': 'LT-2026-0039',
                    'emisor': emisores_dict['90.222.000-2'],
                    'anio': 2026,
                    'fecha_pago': '2026-04-05',
                    'monto_bruto': Decimal('2115000000.00'),
                    'estado': 'Cerrado',
                    'factor_afecto': Decimal('0.800000'),
                    'factor_exento': Decimal('0.200000'),
                    'factor_credito': Decimal('0.080000')
                },
                {
                    'folio': 'LT-2026-0038',
                    'emisor': emisores_dict['89.862.200-2'],
                    'anio': 2026,
                    'fecha_pago': '2026-04-12',
                    'monto_bruto': Decimal('456800000.00'),
                    'estado': 'Aprobado',
                    'factor_afecto': Decimal('0.500000'),
                    'factor_exento': Decimal('0.500000'),
                    'factor_credito': Decimal('0.000000')
                },
                {
                    'folio': 'LT-2026-0037',
                    'emisor': emisores_dict['96.505.760-4'],
                    'anio': 2026,
                    'fecha_pago': '2026-04-18',
                    'monto_bruto': Decimal('1890200000.00'),
                    'estado': 'Aprobado',
                    'factor_afecto': Decimal('0.750000'),
                    'factor_exento': Decimal('0.250000'),
                    'factor_credito': Decimal('0.120000')
                },
                {
                    'folio': 'LT-2025-0102',
                    'emisor': emisores_dict['97.004.000-5'],
                    'anio': 2025,
                    'fecha_pago': '2025-03-14',
                    'monto_bruto': Decimal('2980000000.00'),
                    'estado': 'Cerrado',
                    'factor_afecto': Decimal('0.680000'),
                    'factor_exento': Decimal('0.320000'),
                    'factor_credito': Decimal('0.095000')
                },
                {
                    'folio': 'LT-2024-0097',
                    'emisor': emisores_dict['97.036.000-K'],
                    'anio': 2024,
                    'fecha_pago': '2024-03-10',
                    'monto_bruto': Decimal('2450000000.00'),
                    'estado': 'Cerrado',
                    'factor_afecto': Decimal('0.600000'),
                    'factor_exento': Decimal('0.400000'),
                    'factor_credito': Decimal('0.100000')
                },
            ]

            operador_default = usuarios_dict['12.345.678-9']

            for c_info in certificados_data:
                cert, created = CertificadoDividendo.objects.update_or_create(
                    folio_certificado=c_info['folio'],
                    defaults={
                        'rut_emisor': c_info['emisor'],
                        'anio_tributario': c_info['anio'],
                        'fecha_pago': c_info['fecha_pago'],
                        'monto_total_bruto': c_info['monto_bruto'],
                        'estado_proceso': c_info['estado'],
                    }
                )
                # Crear/actualizar factor
                FactorTributario.objects.update_or_create(
                    folio_certificado=cert,
                    defaults={
                        'factor_afecto': c_info['factor_afecto'],
                        'factor_exento': c_info['factor_exento'],
                        'factor_credito': c_info['factor_credito'],
                        'estado_validacion': 'VALIDADO'
                    }
                )

                # Generar Log de Auditoría representativo con Hash SHA-256
                payload = {
                    'folio_certificado': cert.folio_certificado,
                    'usuario': {
                        'rut': operador_default.rut,
                        'email': operador_default.email,
                        'rol': operador_default.id_rol.nombre_rol
                    },
                    'accion': 'INGRESO_NOMINA_OFICIAL',
                    'timestamp': timezone.now().isoformat(),
                    'factores_calculados': {
                        'factor_afecto': float(c_info['factor_afecto']),
                        'factor_exento': float(c_info['factor_exento']),
                        'suma_proporciones': float(c_info['factor_afecto'] + c_info['factor_exento'])
                    },
                    'estado': 'VALIDADO_EXITOSO'
                }
                hash_calc = LogAuditoria.generar_hash_sha256(payload)
                LogAuditoria.objects.get_or_create(
                    folio_certificado=cert,
                    accion='INGRESO_NOMINA_OFICIAL',
                    defaults={
                        'id_log': str(uuid.uuid4()),
                        'usuario_rut': operador_default,
                        'payload_detalle': payload,
                        'hash_sha256': hash_calc,
                    }
                )
                self.stdout.write(f"  [Certificado] {cert.folio_certificado} ({cert.rut_emisor.razon_social}): Listo con factores y log SHA-256")

        self.stdout.write(self.style.SUCCESS("✅ Base de datos sembrada con éxito para nuam Exchange Group."))
