/**
 * Definiciones de tipos TypeScript para la plataforma nuam Exchange Group.
 * Alineado 1:1 con las entidades del backend y la Vista Lógica UML 2.5.
 */

export type RolNombre = 'Operador Corredora' | 'Auditor nuam' | 'Administrador Plataforma';

export interface UsuarioAutenticado {
  id_usuario: number;
  rut: string;
  email: string;
  nombre: string | null;
  rol: RolNombre;
  nivel_acceso: number;
  corredora: string;
}

export interface Emisor {
  rut_emisor: string;
  razon_social: string;
  pais_origen: string;
  sector_economico: string;
  rut_valido?: boolean;
}

export interface FactorTributario {
  id_factor?: number;
  folio_certificado?: string;
  factor_afecto: string;
  factor_exento: string;
  factor_credito: string;
  fecha_calculo?: string;
  estado_validacion: string;
  suma_proporciones: string;
  es_cuadre_exacto: boolean;
}

export interface CertificadoDividendo {
  folio_certificado: string;
  rut_emisor: string;
  rut_emisor_str?: string;
  razon_social_emisor: string;
  anio_tributario: number;
  fecha_pago: string;
  monto_total_bruto: string;
  estado_proceso: 'Aprobado' | 'Observado' | 'Cerrado';
  factores?: FactorTributario[];
  primer_factor?: FactorTributario | null;
}

export interface LogAuditoriaItem {
  id_log: string;
  folio_certificado: string | null;
  usuario_rut: string;
  usuario_nombre?: string;
  usuario_email?: string;
  accion: string;
  fecha_hora: string;
  timestamp?: string;
  hash_sha256: string;
  es_integro?: boolean;
  payload: Record<string, any>;
}

export interface DashboardStats {
  total_dividendos_monto: string;
  total_dividendos_formateado: string;
  certificados_procesados: number;
  lotes_discrepancia: number;
  porcentaje_cumplimiento: string;
  desglose_estados: {
    aprobados: number;
    observados: number;
    cerrados: number;
  };
}

export interface DiscrepanciaFiscal {
  fila: number;
  folio: string;
  tipo_error: string;
  suma_obtenida?: string;
  suma_esperada?: string;
  diferencia?: string;
  descripcion: string;
}

export interface UploadResponseSuccess {
  status: string;
  mensaje: string;
  total_registros: number;
  certificados: string[];
  cuadre_proporciones: string;
}

export interface UploadResponseError {
  error: string;
  compuerta_bpmn?: string;
  mensaje: string;
  discrepancias?: DiscrepanciaFiscal[];
  accion_sugerida?: string;
}
