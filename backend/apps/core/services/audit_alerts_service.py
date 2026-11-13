"""
Componente: audit_alerts_service.py
Interfaz: ILog_Inmutable (Diagrama de Componentes UML 2.5)
Persistencia de auditoría inmutable con hashes SHA-256 en TB_AUDIT_LOGS y MongoDB Atlas.
"""

from datetime import datetime, timezone as dt_timezone
import json
import logging
import os
import sys
import uuid
from typing import Dict, Any, Optional, List
from django.conf import settings
from apps.core.models import LogAuditoria, Usuario, CertificadoDividendo

logger = logging.getLogger(__name__)


class AuditAlertsService:
    """
    Servicio de trazabilidad inmutable y detección de anomalías.
    Garantiza no repudio y cadena de custodia criptográfica de eventos.
    """

    LOCAL_AUDIT_FALLBACK_FILE = os.path.join(settings.BASE_DIR, 'data', 'audit_ledger.json')

    @classmethod
    def _obtener_cliente_mongo(cls):
        """Intenta instanciar el cliente de MongoDB Atlas si la URI está configurada."""
        is_testing = getattr(settings, 'is_testing', False) or 'test' in sys.argv or 'run_qa_protocol' in sys.argv
        if is_testing:
            return None

        mongo_uri = getattr(settings, 'MONGO_URI', None)
        if not mongo_uri or 'mongodb' not in mongo_uri or 'nuam_admin:AuditSecure' in mongo_uri:
            return None
        try:
            import pymongo
            client = pymongo.MongoClient(mongo_uri, serverSelectionTimeoutMS=500)
            db_name = getattr(settings, 'MONGO_DB_NAME', 'nuam_audit')
            return client[db_name]
        except Exception as exc:
            logger.warning(f"No fue posible conectar a MongoDB Atlas: {exc}")
            return None

    @classmethod
    def registrar_evento(
        cls,
        usuario: Usuario,
        accion: str,
        folio_certificado: Optional[str] = None,
        factores_calculados: Optional[Dict[str, Any]] = None,
        estado: str = "VALIDADO_EXITOSO",
        detalles_extra: Optional[Dict[str, Any]] = None
    ) -> LogAuditoria:
        """
        Crea y persiste un registro inmutable con firma SHA-256 en PostgreSQL/Supabase
        y sincroniza con el repositorio documental NoSQL.
        """
        now_iso = datetime.now(dt_timezone.utc).isoformat()
        log_id = str(uuid.uuid4())

        # Payload con el esquema JSON exacto de la Evaluación 2
        payload = {
            "_id": log_id,
            "folio_certificado": folio_certificado,
            "usuario": {
                "rut": usuario.rut,
                "email": usuario.email,
                "rol": usuario.id_rol.nombre_rol
            },
            "accion": accion,
            "timestamp": now_iso,
            "factores_calculados": factores_calculados or {},
            "estado": estado
        }
        if detalles_extra:
            payload["detalles_adicionales"] = detalles_extra

        # Generar hash SHA-256 canónico
        hash_sha256 = LogAuditoria.generar_hash_sha256(payload)
        payload["hash_sha256"] = hash_sha256

        # 1. Persistencia ACID en TB_AUDIT_LOGS (PostgreSQL/Supabase)
        cert_instance = None
        if folio_certificado:
            cert_instance = CertificadoDividendo.objects.filter(folio_certificado=folio_certificado).first()

        log_obj = LogAuditoria.objects.create(
            id_log=log_id,
            folio_certificado=cert_instance,
            usuario_rut=usuario,
            accion=accion,
            payload_detalle=payload,
            hash_sha256=hash_sha256
        )

        # 2. Persistencia en NoSQL MongoDB Atlas / Bitácora JSON inmutable
        cls._persistir_nosql(payload)

        return log_obj

    @classmethod
    def _persistir_nosql(cls, payload: Dict[str, Any]) -> None:
        """Sincroniza el documento con MongoDB Atlas o archivo local de bitácora."""
        try:
            mongo_db = cls._obtener_cliente_mongo()
            if mongo_db is not None:
                collection_name = getattr(settings, 'MONGO_COLLECTION_AUDIT', 'audit_logs')
                mongo_db[collection_name].insert_one(payload.copy())
                return
        except Exception as exc:
            logger.warning(f"Error sincronizando con MongoDB: {exc}")

        # Respaldo en archivo local estructurado para desarrollo o tests
        try:
            os.makedirs(os.path.dirname(cls.LOCAL_AUDIT_FALLBACK_FILE), exist_ok=True)
            ledger_data = []
            if os.path.exists(cls.LOCAL_AUDIT_FALLBACK_FILE):
                try:
                    with open(cls.LOCAL_AUDIT_FALLBACK_FILE, 'r', encoding='utf-8') as f:
                        ledger_data = json.load(f)
                except Exception:
                    ledger_data = []

            ledger_data.append(payload)
            with open(cls.LOCAL_AUDIT_FALLBACK_FILE, 'w', encoding='utf-8') as f:
                json.dump(ledger_data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Fallo en persistencia local de auditoría: {e}")

    @classmethod
    def verificar_integridad_registro(cls, id_log: str) -> Dict[str, Any]:
        """
        Inspecciona el registro en la BD, recalcula su hash SHA-256 y verifica si fue alterado.
        """
        log_obj = LogAuditoria.objects.filter(id_log=id_log).first()
        if not log_obj:
            return {'valido': False, 'motivo': 'Registro no encontrado en TB_AUDIT_LOGS'}

        payload_copia = dict(log_obj.payload_detalle)
        # El hash original del payload antes de guardarlo
        hash_guardado = log_obj.hash_sha256

        # Recalcular hash canónico excluyendo el campo hash_sha256 si fue insertado dentro del payload
        payload_eval = {k: v for k, v in payload_copia.items() if k != 'hash_sha256'}
        hash_recalculado = LogAuditoria.generar_hash_sha256(payload_eval)

        # También verificamos si el payload original contenía o no la clave al momento de hashear
        hash_con_campo = LogAuditoria.generar_hash_sha256(payload_copia)

        es_integro = (hash_recalculado == hash_guardado) or (hash_con_campo == hash_guardado)

        return {
            'id_log': id_log,
            'es_integro': es_integro,
            'hash_almacenado': hash_guardado,
            'hash_recalculado': hash_recalculado if not es_integro else hash_guardado,
            'estado': 'VÁLIDO' if es_integro else 'ALTERADO_ANOMALÍA',
            'fecha_hora': log_obj.fecha_hora.isoformat()
        }

    @classmethod
    def listar_auditoria(cls, limite: int = 50) -> List[Dict[str, Any]]:
        """Obtiene la lista de los últimos logs con estado de integridad verificado."""
        logs = LogAuditoria.objects.select_related('usuario_rut', 'folio_certificado').order_by('-fecha_hora')[:limite]
        resultado = []
        for l in logs:
            verif = cls.verificar_integridad_registro(l.id_log)
            resultado.append({
                'id_log': l.id_log,
                'folio_certificado': l.folio_certificado.folio_certificado if l.folio_certificado else None,
                'usuario_rut': l.usuario_rut.rut,
                'usuario_nombre': l.usuario_rut.nombre,
                'usuario_email': l.usuario_rut.email,
                'accion': l.accion,
                'fecha_hora': l.fecha_hora.isoformat(),
                'hash_sha256': l.hash_sha256,
                'es_integro': verif['es_integro'],
                'payload': l.payload_detalle
            })
        return resultado
