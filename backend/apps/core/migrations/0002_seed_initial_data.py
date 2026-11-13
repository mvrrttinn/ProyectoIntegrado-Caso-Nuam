"""
Migración de datos iniciales para nuam Exchange Group.
Garantiza que en cualquier entorno donde se ejecute 'migrate' (Render, Supabase, local)
los roles, usuarios institucionales y certificados oficiales existan de inmediato.
"""

from decimal import Decimal
from django.db import migrations
from django.contrib.auth.hashers import make_password


def seed_data(apps, schema_editor):
    Rol = apps.get_model('core', 'Rol')
    Usuario = apps.get_model('core', 'Usuario')
    Emisor = apps.get_model('core', 'Emisor')
    CertificadoDividendo = apps.get_model('core', 'CertificadoDividendo')
    FactorTributario = apps.get_model('core', 'FactorTributario')
    LogAuditoria = apps.get_model('core', 'LogAuditoria')

    # 1. ROLES
    rol_op, _ = Rol.objects.get_or_create(
        nombre_rol='Operador Corredora',
        defaults={'descripcion': 'Carga masiva, cálculo y validación de dividendos (LarrainVial)', 'nivel_acceso': 1}
    )
    rol_aud, _ = Rol.objects.get_or_create(
        nombre_rol='Auditor nuam',
        defaults={'descripcion': 'Revisión técnica, verificación de hashes SHA-256 y cierre de lotes fiscales', 'nivel_acceso': 2}
    )
    rol_adm, _ = Rol.objects.get_or_create(
        nombre_rol='Administrador Plataforma',
        defaults={'descripcion': 'Gobernanza global, control de accesos RBAC y auditoría general', 'nivel_acceso': 3}
    )

    # 2. USUARIOS OFICIALES (Contraseña Nuam2026!)
    pass_hash = make_password('Nuam2026!')

    Usuario.objects.get_or_create(
        rut='12.345.678-9',
        defaults={
            'email': 'operador@larrainvial.cl',
            'nombre': 'Angelo Corredor',
            'password_hash': pass_hash,
            'id_corredora': 'LarrainVial S.A. Corredora',
            'id_rol': rol_op,
            'estado': 'ACTIVO'
        }
    )
    Usuario.objects.get_or_create(
        rut='9.876.543-2',
        defaults={
            'email': 'auditor@nuam.com',
            'nombre': 'Martín Auditor',
            'password_hash': pass_hash,
            'id_corredora': 'nuam Holding Regional',
            'id_rol': rol_aud,
            'estado': 'ACTIVO'
        }
    )
    Usuario.objects.get_or_create(
        rut='11.222.333-4',
        defaults={
            'email': 'admin@nuam.com',
            'nombre': 'Vicente Administrador',
            'password_hash': pass_hash,
            'id_corredora': 'nuam Holding Regional',
            'id_rol': rol_adm,
            'estado': 'ACTIVO'
        }
    )

    # 3. EMISORES
    emisor_chile, _ = Emisor.objects.get_or_create(
        rut_emisor='97.004.000-5',
        defaults={'razon_social': 'Banco de Chile', 'pais_origen': 'Chile', 'sector_economico': 'Banca y Servicios Financieros'}
    )
    emisor_falabella, _ = Emisor.objects.get_or_create(
        rut_emisor='91.564.000-8',
        defaults={'razon_social': 'Falabella S.A.', 'pais_origen': 'Chile', 'sector_economico': 'Retail y Comercio Minorista'}
    )
    emisor_cmpc, _ = Emisor.objects.get_or_create(
        rut_emisor='90.222.000-2',
        defaults={'razon_social': 'Empresas CMPC S.A.', 'pais_origen': 'Chile', 'sector_economico': 'Forestal y Celulosa'}
    )
    emisor_entel, _ = Emisor.objects.get_or_create(
        rut_emisor='89.862.200-2',
        defaults={'razon_social': 'Empresa Nacional de Telecomunicaciones S.A. (Entel)', 'pais_origen': 'Chile', 'sector_economico': 'Telecomunicaciones'}
    )
    emisor_colbun, _ = Emisor.objects.get_or_create(
        rut_emisor='96.505.760-4',
        defaults={'razon_social': 'Colbún S.A.', 'pais_origen': 'Chile', 'sector_economico': 'Energía y Electricidad'}
    )
    emisor_santander, _ = Emisor.objects.get_or_create(
        rut_emisor='97.036.000-K',
        defaults={'razon_social': 'Banco Santander Chile', 'pais_origen': 'Chile', 'sector_economico': 'Banca y Servicios Financieros'}
    )

    # 4. CERTIFICADOS Y FACTORES
    cert1, _ = CertificadoDividendo.objects.get_or_create(
        folio_certificado='LT-2026-0041',
        defaults={'rut_emisor': emisor_chile, 'anio_tributario': 2026, 'fecha_pago': '2026-03-15', 'monto_total_bruto': Decimal('3240500000.00'), 'estado_proceso': 'Aprobado'}
    )
    FactorTributario.objects.get_or_create(
        folio_certificado=cert1,
        defaults={'factor_afecto': Decimal('0.700000'), 'factor_exento': Decimal('0.300000'), 'factor_credito': Decimal('0.100000'), 'estado_validacion': 'VALIDADO'}
    )

    cert2, _ = CertificadoDividendo.objects.get_or_create(
        folio_certificado='LT-2026-0040',
        defaults={'rut_emisor': emisor_falabella, 'anio_tributario': 2026, 'fecha_pago': '2026-03-20', 'monto_total_bruto': Decimal('987320000.00'), 'estado_proceso': 'Observado'}
    )
    FactorTributario.objects.get_or_create(
        folio_certificado=cert2,
        defaults={'factor_afecto': Decimal('0.650000'), 'factor_exento': Decimal('0.350000'), 'factor_credito': Decimal('0.050000'), 'estado_validacion': 'VALIDADO'}
    )

    cert3, _ = CertificadoDividendo.objects.get_or_create(
        folio_certificado='LT-2026-0039',
        defaults={'rut_emisor': emisor_cmpc, 'anio_tributario': 2026, 'fecha_pago': '2026-04-05', 'monto_total_bruto': Decimal('2115000000.00'), 'estado_proceso': 'Cerrado'}
    )
    FactorTributario.objects.get_or_create(
        folio_certificado=cert3,
        defaults={'factor_afecto': Decimal('0.800000'), 'factor_exento': Decimal('0.200000'), 'factor_credito': Decimal('0.080000'), 'estado_validacion': 'VALIDADO'}
    )


def reverse_func(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_data, reverse_func),
    ]
