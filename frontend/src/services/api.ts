/**
 * Cliente API REST para nuam Exchange Group
 * Manejo de JWT en cabeceras Authorization, llamadas asíncronas y tipado estricto.
 */

import type {
  UsuarioAutenticado,
  DashboardStats,
  CertificadoDividendo,
  LogAuditoriaItem,
  UploadResponseSuccess,
  UploadResponseError
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://proyectointegrado-caso-Nuam.onrender.com/api/v1';

type LoadingCallback = (isLoading: boolean, mensaje?: string) => void;

class ApiClient {
  private token: string | null = null;
  private loadingListeners: Set<LoadingCallback> = new Set();
  private activeCount = 0;

  constructor() {
    this.token = localStorage.getItem('nuam_jwt_token');
  }

  public onLoading(callback: LoadingCallback) {
    this.loadingListeners.add(callback);
    return () => {
      this.loadingListeners.delete(callback);
    };
  }

  public notifyLoading(isLoading: boolean, mensaje?: string) {
    this.loadingListeners.forEach((fn) => fn(isLoading, mensaje));
  }

  private async fetchWithLoader(url: string, options?: RequestInit, mensaje?: string): Promise<Response> {
    this.activeCount++;
    this.notifyLoading(true, mensaje || 'Sincronizando con la nube nuam...');
    try {
      return await fetch(url, options);
    } finally {
      this.activeCount--;
      if (this.activeCount <= 0) {
        this.activeCount = 0;
        this.notifyLoading(false);
      }
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('nuam_jwt_token', token);
    } else {
      localStorage.removeItem('nuam_jwt_token');
    }
  }

  public getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('nuam_jwt_token');
    }
    return this.token;
  }

  private getHeaders(isMultipart = false): HeadersInit {
    const headers: Record<string, string> = {};
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // --- Auth ---
  async login(
    identificador: string,
    password: string,
    codigoMfa: string,
    rol?: string,
    tokenOtpGenerado?: string
  ): Promise<{ token: string; usuario: UsuarioAutenticado }> {
    let res: Response;
    try {
      res = await this.fetchWithLoader(
        `${API_BASE_URL}/auth/login/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identificador,
            password,
            codigo_mfa: codigoMfa,
            rol: rol || '',
            token_otp_generado: tokenOtpGenerado || ''
          })
        },
        'Verificando credenciales y firma digital...'
      );
    } catch {
      throw new Error('No se pudo establecer conexión con el servidor. Verifique su conexión a internet o intente en unos momentos.');
    }

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      if (data && data.mensaje) {
        throw new Error(data.mensaje);
      }
      if (res.status === 400) {
        throw new Error('Los datos ingresados están incompletos. Verifique que el código MFA tenga 6 dígitos.');
      }
      if (res.status === 401) {
        throw new Error('Credenciales incorrectas: Verifique su usuario, contraseña o código MFA.');
      }
      if (res.status === 403) {
        throw new Error('Acceso denegado: El rol seleccionado no corresponde a los permisos de esta cuenta.');
      }
      throw new Error('Ocurrió un error al procesar el inicio de sesión. Intente nuevamente.');
    }

    this.setToken(data.token);
    return data;
  }

  logout() {
    this.setToken(null);
  }

  // --- Dashboard ---
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await this.fetchWithLoader(
      `${API_BASE_URL}/dashboard/stats/`,
      { headers: this.getHeaders() },
      'Actualizando métricas operacionales del Dashboard...'
    );
    if (!res.ok) {
      throw new Error('Error al obtener estadísticas del dashboard.');
    }
    return res.json();
  }

  // --- Certificados ---
  async getCertificados(params?: { anio?: number; estado?: string; search?: string }): Promise<CertificadoDividendo[]> {
    const query = new URLSearchParams();
    if (params?.anio) query.append('anio_tributario', params.anio.toString());
    if (params?.estado) query.append('estado_proceso', params.estado);
    if (params?.search) query.append('search', params.search);

    const url = `${API_BASE_URL}/certificados/${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await this.fetchWithLoader(
      url,
      { headers: this.getHeaders() },
      'Consultando repositorio en Supabase PostgreSQL...'
    );
    if (!res.ok) {
      throw new Error('Error al consultar el repositorio de certificados.');
    }
    return res.json();
  }

  // --- Cierre de Lote Fiscal (CU-05) ---
  async cerrarLoteFiscal(folio: string): Promise<{ status: string; mensaje: string; nuevo_estado: string }> {
    const res = await this.fetchWithLoader(
      `${API_BASE_URL}/certificados/${encodeURIComponent(folio)}/cerrar/`,
      {
        method: 'POST',
        headers: this.getHeaders()
      },
      `Aprobando y cerrando lote fiscal ${folio}...`
    );

    const data = await res.json();
    if (!res.ok) {
      const errorMsg = data.mensaje || data.error || 'Error al ejecutar cierre de lote fiscal.';
      const err = new Error(errorMsg) as any;
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  // --- Eliminación y Limpieza de Certificados (Admin) ---
  async deleteCertificado(folio: string): Promise<{ status: string; mensaje: string }> {
    const res = await this.fetchWithLoader(
      `${API_BASE_URL}/certificados/${encodeURIComponent(folio)}/`,
      {
        method: 'DELETE',
        headers: this.getHeaders()
      },
      `Eliminando certificado ${folio} y sus factores...`
    );
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.mensaje || data.error || 'Error al eliminar el certificado.');
    }
    return data;
  }

  async limpiarLotesPrueba(): Promise<{ status: string; mensaje: string; registros_eliminados: number }> {
    const res = await this.fetchWithLoader(
      `${API_BASE_URL}/certificados/limpiar-pruebas/`,
      {
        method: 'POST',
        headers: this.getHeaders()
      },
      'Purgando lotes de prueba y restableciendo base...'
    );
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.mensaje || data.error || 'Error al limpiar los lotes de prueba.');
    }
    return data;
  }

  // --- Ingesta Masiva CSV (CU-01) ---
  async uploadCsv(archivo: File | string): Promise<{ status: number; data: UploadResponseSuccess | UploadResponseError }> {
    let res: Response;

    if (typeof archivo === 'string') {
      res = await this.fetchWithLoader(
        `${API_BASE_URL}/dividendos/upload/`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ contenido_csv: archivo })
        },
        'Ingestando nómina masiva y validando DJ 1949...'
      );
    } else {
      const formData = new FormData();
      formData.append('archivo_csv', archivo);
      res = await this.fetchWithLoader(
        `${API_BASE_URL}/dividendos/upload/`,
        {
          method: 'POST',
          headers: this.getHeaders(true),
          body: formData
        },
        'Cargando archivo CSV y validando compuertas BPMN...'
      );
    }

    const data = await res.json();
    return {
      status: res.status,
      data: data
    };
  }

  // --- Auditoría con SHA-256 (CU-06) ---
  async getAuditoria(): Promise<LogAuditoriaItem[]> {
    const res = await this.fetchWithLoader(
      `${API_BASE_URL}/auditoria/`,
      { headers: this.getHeaders() },
      'Verificando firmas de la bitácora inmutable...'
    );
    if (!res.ok) {
      throw new Error('Error al consultar la bitácora de auditoría.');
    }
    return res.json();
  }

  // --- Gestión de Usuarios y Roles (CU-07) ---
  async getUsuarios(): Promise<any[]> {
    const res = await this.fetchWithLoader(
      `${API_BASE_URL}/usuarios/`,
      { headers: this.getHeaders() },
      'Cargando directorio de usuarios RBAC...'
    );
    if (!res.ok) {
      throw new Error('Error al consultar usuarios (se requiere perfil Administrador).');
    }
    return res.json();
  }

  async getRoles(): Promise<any[]> {
    const res = await this.fetchWithLoader(
      `${API_BASE_URL}/roles/`,
      { headers: this.getHeaders() },
      'Consultando catálogo de roles...'
    );
    if (!res.ok) {
      throw new Error('Error al consultar roles.');
    }
    return res.json();
  }

  async updateUsuarioRol(idUsuario: number, idRol: number): Promise<any> {
    return this.updateUsuario(idUsuario, { id_rol: idRol });
  }

  async updateUsuario(idUsuario: number, data: any): Promise<any> {
    const res = await this.fetchWithLoader(
      `${API_BASE_URL}/usuarios/${idUsuario}/`,
      {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      },
      'Guardando cambios de perfil y emitiendo firma SHA-256...'
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || err.mensaje || 'Error al actualizar usuario.');
    }
    return res.json();
  }

  async crearUsuario(usuarioData: any): Promise<any> {
    const res = await this.fetchWithLoader(
      `${API_BASE_URL}/usuarios/`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(usuarioData)
      },
      'Registrando nuevo usuario en Supabase...'
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.mensaje || JSON.stringify(err) || 'Error al crear usuario.');
    }
    return res.json();
  }

  async deleteUsuario(idUsuario: number): Promise<{ status: string; mensaje: string }> {
    const res = await this.fetchWithLoader(
      `${API_BASE_URL}/usuarios/${idUsuario}/`,
      {
        method: 'DELETE',
        headers: this.getHeaders()
      },
      'Eliminando usuario de la base de datos...'
    );
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.mensaje || data.error || 'Error al eliminar usuario.');
    }
    return data;
  }
}

export const api = new ApiClient();
