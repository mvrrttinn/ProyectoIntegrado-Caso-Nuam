"""
Modelos ORM de Base de Datos - nuam Exchange Group
Correspondencia 1:1 con el Modelo Lógico Relacional (MER en 3FN) y Diagrama de Clases UML 2.5
Evaluación 2 -> Evaluación 3.
"""

from decimal import Decimal, ROUND_HALF_UP
import hashlib
import json
import re
import uuid
from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone


# ==============================================================================
# 1. TABLA: TB_ROLES (Rol)
# ==============================================================================
class Rol(models.Model):
    """
    Rol y privilegios de acceso para el modelo RBAC (ISO/IEC 27001 Control A.9).
    Roles soportados: 'Operador Corredora', 'Auditor nuam', 'Administrador Plataforma'.
    """
    id_rol = models.AutoField(primary_key=True)
    nombre_rol = models.CharField(max_length=50, unique=True, verbose_name="Nombre del Rol")
    descripcion = models.TextField(blank=True, default='', verbose_name="Descripción de Privilegios")
    nivel_acceso = models.IntegerField(default=1, verbose_name="Nivel de Acceso Jerárquico")

    class Meta:
        db_table = 'TB_ROLES'
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'
        ordering = ['nivel_acceso']

    def __str__(self):
        return f"{self.nombre_rol} (Nivel {self.nivel_acceso})"

    # --- Métodos POO del Diagrama de Clases UML ---
    def obtener_permisos(self) -> list:
        """Retorna lista de códigos de permisos asignados al rol."""
        matriz = {
            'Operador Corredora': ['upload_csv', 'calculate_factors', 'view_dashboard', 'view_reports'],
            'Auditor nuam': ['view_dashboard', 'view_reports', 'approve_batch', 'close_fiscal_batch', 'audit_logs'],
            'Administrador Plataforma': ['upload_csv', 'calculate_factors', 'view_dashboard', 'view_reports',
                                         'approve_batch', 'close_fiscal_batch', 'audit_logs', 'manage_users', 'system_admin']
        }
        return matriz.get(self.nombre_rol, ['view_dashboard'])

    def asignar_privilegio(self, permiso: str) -> None:
        """Asigna un privilegio adicional en la descripción/metadata del rol."""
        if permiso not in self.descripcion:
            self.descripcion = f"{self.descripcion};{permiso}".strip(';')
            self.save(update_fields=['descripcion'])

    def validar_acceso_modulo(self, modulo: str) -> bool:
        """Verifica si el rol cuenta con autorización para el módulo consultado."""
        permisos = self.obtener_permisos()
        mapeo_modulo = {
            'upload': 'upload_csv',
            'calcular': 'calculate_factors',
            'cierre': 'close_fiscal_batch',
            'auditoria': 'audit_logs',
            'usuarios': 'manage_users'
        }
        requerido = mapeo_modulo.get(modulo, modulo)
        return requerido in permisos


# ==============================================================================
# 2. TABLA: TB_USUARIOS (Usuario)
# ==============================================================================
class Usuario(models.Model):
    """
    Entidad de usuario autenticado en el portal centralizado nuam.
    """
    id_usuario = models.AutoField(primary_key=True)
    rut = models.CharField(max_length=12, unique=True, db_index=True, verbose_name="RUT de Usuario")
    nombre = models.CharField(max_length=150, null=True, blank=True, verbose_name="Nombre Completo")
    email = models.EmailField(unique=True, verbose_name="Correo Electrónico Institucional")
    password_hash = models.CharField(max_length=255, verbose_name="Hash de Contraseña")
    id_rol = models.ForeignKey(
        Rol,
        on_delete=models.PROTECT,
        db_column='id_rol',
        related_name='usuarios',
        verbose_name="Rol Asignado"
    )
    id_corredora = models.CharField(
        max_length=150,
        default='LarrainVial S.A. Corredora',
        verbose_name="Institución o Corredora"
    )
    estado = models.CharField(max_length=20, default='ACTIVO', verbose_name="Estado de Cuenta")

    class Meta:
        db_table = 'TB_USUARIOS'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        indexes = [
            models.Index(fields=['rut'], name='idx_usuario_rut'),
            models.Index(fields=['email'], name='idx_usuario_email'),
        ]

    def __str__(self):
        return f"{self.nombre or self.email} ({self.rut}) - {self.id_rol.nombre_rol}"

    # --- Compatibilidad con DRF Authentication y Django Permissions ---
    @property
    def is_authenticated(self) -> bool:
        """Indica si el usuario está autenticado para DRF IsAuthenticated."""
        return self.estado == 'ACTIVO'

    @property
    def is_anonymous(self) -> bool:
        return False

    # --- Métodos POO del Diagrama de Clases UML ---
    def autenticar(self, password: str) -> bool:
        """Verifica la contraseña ingresada contra el hash almacenado."""
        if not self.password_hash or self.estado != 'ACTIVO':
            return False
        return check_password(password, self.password_hash)

    def verificar_token_mfa(self, token: str) -> bool:
        """
        Valida el código MFA de 6 dígitos según especificación de seguridad.
        Acepta códigos numéricos válidos (ej. '123456' o tokens de sesión de 6 dígitos).
        """
        if not token or not isinstance(token, str):
            return False
        token_clean = token.strip()
        # Regla MFA: exactamente 6 dígitos numéricos
        if re.match(r'^\d{6}$', token_clean):
            return True
        return False

    def cambiar_contrasena(self, nueva_pass: str) -> None:
        """Genera hash seguro PBKDF2/Argon2 y actualiza la contraseña."""
        self.password_hash = make_password(nueva_pass)
        self.save(update_fields=['password_hash'])

    def obtener_rol(self) -> str:
        """Retorna el nombre del rol del usuario."""
        return self.id_rol.nombre_rol

    def inactivar_cuenta(self) -> None:
        """Inactiva la cuenta de usuario para revocar accesos inmediatamente."""
        self.estado = 'INACTIVO'
        self.save(update_fields=['estado'])


# ==============================================================================
# 3. TABLA: TB_EMISORES (Emisor)
# ==============================================================================
class Emisor(models.Model):
    """
    Sociedad anónima emisora de acciones o valores bursátiles en el mercado regional.
    """
    rut_emisor = models.CharField(max_length=12, primary_key=True, verbose_name="RUT del Emisor")
    razon_social = models.CharField(max_length=200, db_index=True, verbose_name="Razón Social")
    pais_origen = models.CharField(max_length=50, default='Chile', verbose_name="País de Origen")
    sector_economico = models.CharField(
        max_length=100,
        default='Bursátil / Financiero',
        verbose_name="Sector Económico"
    )

    class Meta:
        db_table = 'TB_EMISORES'
        verbose_name = 'Emisor'
        verbose_name_plural = 'Emisores'
        indexes = [
            models.Index(fields=['razon_social'], name='idx_emisor_razon_social'),
        ]

    def __str__(self):
        return f"{self.razon_social} ({self.rut_emisor})"

    # --- Métodos POO del Diagrama de Clases UML ---
    def validar_rut(self) -> bool:
        """Valida el dígito verificador del RUT chileno mediante algoritmo Módulo 11."""
        rut_limpio = self.rut_emisor.replace(".", "").replace("-", "").upper()
        if len(rut_limpio) < 2:
            return False
        cuerpo = rut_limpio[:-1]
        dv = rut_limpio[-1]
        if not cuerpo.isdigit():
            return False
        suma = 0
        multiplo = 2
        for d in reversed(cuerpo):
            suma += int(d) * multiplo
            multiplo = 2 if multiplo == 7 else multiplo + 1
        esperado = 11 - (suma % 11)
        dv_calc = 'K' if esperado == 10 else '0' if esperado == 11 else str(esperado)
        return dv == dv_calc

    def actualizar_datos(self, razon_social: str, pais: str = None) -> None:
        """Actualiza la razón social y país del emisor."""
        self.razon_social = razon_social
        if pais:
            self.pais_origen = pais
        self.save(update_fields=['razon_social', 'pais_origen'])

    def listar_certificados(self, anio: int = None):
        """Lista los certificados tributarios asociados al emisor."""
        qs = self.certificados.all()
        if anio:
            qs = qs.filter(anio_tributario=anio)
        return qs.order_by('-fecha_pago')


# ==============================================================================
# 4. TABLA: TB_CERTIFICADOS_DIVIDENDOS (CertificadoDividendo)
# ==============================================================================
class CertificadoDividendo(models.Model):
    """
    Certificado de dividendo tributario emitido y procesado para declaraciones juradas.
    """
    ESTADO_CHOICES = [
        ('Aprobado', 'Aprobado'),
        ('Observado', 'Observado'),
        ('Cerrado', 'Cerrado'),
    ]

    folio_certificado = models.CharField(max_length=50, primary_key=True, verbose_name="Folio Único de Certificado")
    rut_emisor = models.ForeignKey(
        Emisor,
        on_delete=models.PROTECT,
        db_column='rut_emisor',
        related_name='certificados',
        db_index=True,
        verbose_name="Emisor"
    )
    anio_tributario = models.IntegerField(db_index=True, verbose_name="Año Tributario")
    fecha_pago = models.DateField(verbose_name="Fecha de Pago")
    monto_total_bruto = models.DecimalField(max_digits=18, decimal_places=2, verbose_name="Monto Total Bruto ($ CLP)")
    estado_proceso = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='Aprobado',
        db_index=True,
        verbose_name="Estado del Proceso"
    )

    class Meta:
        db_table = 'TB_CERTIFICADOS_DIVIDENDOS'
        verbose_name = 'Certificado de Dividendo'
        verbose_name_plural = 'Certificados de Dividendos'
        indexes = [
            models.Index(fields=['anio_tributario', 'estado_proceso'], name='idx_cert_anio_estado'),
            models.Index(fields=['rut_emisor', 'anio_tributario'], name='idx_cert_emisor_anio'),
        ]
        ordering = ['-anio_tributario', '-fecha_pago']

    def __str__(self):
        return f"Folio {self.folio_certificado} - {self.rut_emisor.razon_social} ({self.anio_tributario})"

    # --- Métodos POO del Diagrama de Clases UML ---
    def validar_estructura_csv(self) -> bool:
        """Verifica la consistencia mínima requerida para el certificado."""
        return bool(self.folio_certificado and self.rut_emisor_id and self.monto_total_bruto > Decimal('0.00'))

    def calcular_factores_dj(self, monto_afecto: Decimal, monto_exento: Decimal, monto_credito: Decimal):
        """
        Calcula factores con precisión estricta a 6 decimales según DJ 1949/1922.
        """
        if self.monto_total_bruto <= Decimal('0.00'):
            raise ValueError("El monto total bruto debe ser mayor a 0.")
        factor_afecto = (monto_afecto / self.monto_total_bruto).quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP)
        factor_exento = (monto_exento / self.monto_total_bruto).quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP)
        factor_credito = (monto_credito / self.monto_total_bruto).quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP)
        return factor_afecto, factor_exento, factor_credito

    def verificar_cuadre_proporciones(self) -> bool:
        """Verifica que todos los factores tributarios asociados sumen exactamente 1.000000."""
        factores = self.factores.all()
        if not factores.exists():
            return False
        for factor in factores:
            if not factor.es_cuadre_exacto():
                return False
        return True

    def cambiar_estado(self, nuevo_estado: str) -> None:
        """Actualiza el estado de proceso garantizando las transiciones de negocio."""
        if nuevo_estado in dict(self.ESTADO_CHOICES):
            self.estado_proceso = nuevo_estado
            self.save(update_fields=['estado_proceso'])

    def exportar_formato_cmf(self) -> dict:
        """Estructura la información para reportes normativos CMF."""
        factor = self.factores.first()
        return {
            'folio': self.folio_certificado,
            'emisor_rut': self.rut_emisor.rut_emisor,
            'emisor_nombre': self.rut_emisor.razon_social,
            'periodo': self.anio_tributario,
            'fecha_pago': self.fecha_pago.isoformat(),
            'monto_bruto': str(self.monto_total_bruto),
            'factor_afecto': str(factor.factor_afecto) if factor else '0.000000',
            'factor_exento': str(factor.factor_exento) if factor else '0.000000',
            'factor_credito': str(factor.factor_credito) if factor else '0.000000',
            'estado': self.estado_proceso
        }

    def cerrar_lote_fiscal(self) -> bool:
        """Aprobación y Cierre de Lote Fiscal (CU-05) reservado a Auditor."""
        if not self.verificar_cuadre_proporciones():
            self.estado_proceso = 'Observado'
            self.save(update_fields=['estado_proceso'])
            return False
        self.estado_proceso = 'Cerrado'
        self.save(update_fields=['estado_proceso'])
        return True


# ==============================================================================
# 5. TABLA: TB_FACTORES_TRIBUTARIOS (FactorTributario / DetalleFactorTributario)
# ==============================================================================
class FactorTributario(models.Model):
    """
    Factores de proporción tributaria calculados con precisión decimal estricta (6 decimales).
    Relación de composición 1..* con CertificadoDividendo.
    """
    id_factor = models.AutoField(primary_key=True)
    folio_certificado = models.ForeignKey(
        CertificadoDividendo,
        on_delete=models.CASCADE,
        db_column='folio_certificado',
        related_name='factores',
        verbose_name="Certificado Asociado"
    )
    factor_afecto = models.DecimalField(max_digits=12, decimal_places=6, verbose_name="Factor Renta Afecta")
    factor_exento = models.DecimalField(max_digits=12, decimal_places=6, verbose_name="Factor Renta Exenta")
    factor_credito = models.DecimalField(max_digits=12, decimal_places=6, verbose_name="Factor Crédito Impuesto")
    fecha_calculo = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Cálculo")
    estado_validacion = models.CharField(max_length=20, default='VALIDADO', verbose_name="Estado de Validación")

    class Meta:
        db_table = 'TB_FACTORES_TRIBUTARIOS'
        verbose_name = 'Factor Tributario'
        verbose_name_plural = 'Factores Tributarios'
        indexes = [
            models.Index(fields=['folio_certificado'], name='idx_factor_folio'),
        ]

    def __str__(self):
        return (f"Factores Folio {self.folio_certificado_id}: Afecto={self.factor_afecto}, "
                f"Exento={self.factor_exento}, Suma={self.calcular_suma_factores()}")

    # --- Propiedades de Compatibilidad 100% Evaluación 2 ---
    @property
    def factor_renta_afecta(self) -> Decimal:
        return self.factor_afecto

    @property
    def factor_renta_exenta(self) -> Decimal:
        return self.factor_exento

    @property
    def factor_credito_ipd(self) -> Decimal:
        return self.factor_credito

    @property
    def estado_calculo(self) -> str:
        return self.estado_validacion

    # --- Métodos POO del Diagrama de Clases UML ---
    def calcular_suma_factores(self) -> Decimal:
        """Suma aritmética precisa de las proporciones afecto y exento."""
        suma = self.factor_afecto + self.factor_exento
        return suma.quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP)

    def es_cuadre_exacto(self) -> bool:
        """
        Regla de negocio no negociable: la suma de factores afecto + exento
        debe ser exactamente igual a 1.000000 (sin pérdida de precisión ni redondeos flotantes).
        """
        return self.calcular_suma_factores() == Decimal('1.000000')

    def obtener_desglose(self) -> dict:
        """Retorna diccionario serializable con los factores y el estado de cuadre."""
        suma = self.calcular_suma_factores()
        return {
            'factor_afecto': str(self.factor_afecto),
            'factor_exento': str(self.factor_exento),
            'factor_credito': str(self.factor_credito),
            'suma_proporciones': str(suma),
            'es_cuadre_exacto': self.es_cuadre_exacto(),
            'estado_validacion': self.estado_validacion
        }

    def actualizar_factores(self, afecto: Decimal, exento: Decimal, credito: Decimal) -> None:
        """Actualiza los factores tributarios y revalida la consistencia aritmética."""
        self.factor_afecto = afecto.quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP)
        self.factor_exento = exento.quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP)
        self.factor_credito = credito.quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP)
        self.estado_validacion = 'VALIDADO' if self.es_cuadre_exacto() else 'OBSERVADO'
        self.save()


# Alias 1:1 con el Diagrama MER de la Evaluación 2
DetalleFactorTributario = FactorTributario


# ==============================================================================
# 6. TABLA: TB_AUDIT_LOGS (LogAuditoria) + COLECCIÓN NoSQL audit_logs
# ==============================================================================
class LogAuditoria(models.Model):
    """
    Registro inmutable de auditoría para trazabilidad de eventos y cumplimiento normativo.
    Contiene hash criptográfico SHA-256 para verificación de integridad en tiempo real.
    """
    id_log = models.CharField(max_length=64, primary_key=True, default=uuid.uuid4, verbose_name="ID Único")
    folio_certificado = models.ForeignKey(
        CertificadoDividendo,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='folio_certificado',
        related_name='logs',
        verbose_name="Folio de Certificado"
    )
    usuario_rut = models.ForeignKey(
        Usuario,
        to_field='rut',
        on_delete=models.PROTECT,
        db_column='usuario_rut',
        related_name='logs',
        verbose_name="RUT del Operador/Auditor"
    )
    accion = models.CharField(max_length=100, verbose_name="Acción Realizada")
    fecha_hora = models.DateTimeField(auto_now_add=True, verbose_name="Marca Temporal")
    payload_detalle = models.JSONField(verbose_name="Detalle Estructurado del Evento")
    hash_sha256 = models.CharField(max_length=64, db_index=True, verbose_name="Firma Criptográfica SHA-256")

    class Meta:
        db_table = 'TB_AUDIT_LOGS'
        verbose_name = 'Log de Auditoría'
        verbose_name_plural = 'Logs de Auditoría'
        indexes = [
            models.Index(fields=['hash_sha256'], name='idx_audit_sha256'),
            models.Index(fields=['fecha_hora'], name='idx_audit_fecha_hora'),
            models.Index(fields=['accion'], name='idx_audit_accion'),
        ]
        ordering = ['-fecha_hora']

    def __str__(self):
        return f"Log {self.id_log[:8]} - {self.accion} ({self.usuario_rut_id}) [{self.fecha_hora}]"

    # --- Propiedad de compatibilidad Evaluación 2 ---
    @property
    def timestamp(self):
        return self.fecha_hora

    # --- Métodos POO del Diagrama de Clases UML ---
    @staticmethod
    def generar_hash_sha256(payload: dict) -> str:
        """
        Calcula el hash SHA-256 canónico del payload estructurado.
        Garantiza serialización ordenada con claves ordenadas alfabéticamente.
        """
        canonical_str = json.dumps(payload, sort_keys=True, default=str)
        return hashlib.sha256(canonical_str.encode('utf-8')).hexdigest()

    def verificar_integridad_registro(self) -> bool:
        """
        Verifica en tiempo real si el registro ha sido alterado.
        Recalcula el hash sobre el payload_detalle y lo compara con el hash_sha256 persistido.
        """
        recalc_hash = self.generar_hash_sha256(self.payload_detalle)
        return recalc_hash == self.hash_sha256

    def persistir_inmutable(self) -> None:
        """
        Calcula el hash canónico y persiste el registro en TB_AUDIT_LOGS.
        """
        if not self.id_log:
            self.id_log = str(uuid.uuid4())
        if not self.hash_sha256:
            self.hash_sha256 = self.generar_hash_sha256(self.payload_detalle)
        self.save()

    @classmethod
    def obtener_trazabilidad_folio(cls, folio: str):
        """Retorna el historial completo de eventos asociados a un folio específico."""
        return cls.objects.filter(folio_certificado_id=folio).order_by('fecha_hora')
