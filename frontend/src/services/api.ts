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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://proyectointegrado-caso-nuam.onrender.com/api/v1';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('nuam_jwt_token');
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
    const res = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identificador,
        password,
        codigo_mfa: codigoMfa,
        rol: rol || '',
        token_otp_generado: tokenOtpGenerado || ''
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.mensaje || data.error || 'Fallo de autenticación.');
    }
    this.setToken(data.token);
    return data;
  }

  logout() {
    this.setToken(null);
  }

  // --- Dashboard ---
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE_URL}/dashboard/stats/`, {
      headers: this.getHeaders()
    });
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
    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) {
      throw new Error('Error al consultar el repositorio de certificados.');
    }
    return res.json();
  }

  // --- Cierre de Lote Fiscal (CU-05) ---
  async cerrarLoteFiscal(folio: string): Promise<{ status: string; mensaje: string; nuevo_estado: string }> {
    const res = await fetch(`${API_BASE_URL}/certificados/${encodeURIComponent(folio)}/cerrar/`, {
      method: 'POST',
      headers: this.getHeaders()
    });

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

  // --- Ingesta Masiva CSV (CU-01) ---
  async uploadCsv(archivo: File | string): Promise<{ status: number; data: UploadResponseSuccess | UploadResponseError }> {
    let res: Response;

    if (typeof archivo === 'string') {
      res = await fetch(`${API_BASE_URL}/dividendos/upload/`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ contenido_csv: archivo })
      });
    } else {
      const formData = new FormData();
      formData.append('archivo_csv', archivo);
      res = await fetch(`${API_BASE_URL}/dividendos/upload/`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: formData
      });
    }

    const data = await res.json();
    return {
      status: res.status,
      data: data
    };
  }

  // --- Auditoría con SHA-256 (CU-06) ---
  async getAuditoria(): Promise<LogAuditoriaItem[]> {
    const res = await fetch(`${API_BASE_URL}/auditoria/`, {
      headers: this.getHeaders()
    });
    if (!res.ok) {
      throw new Error('Error al consultar la bitácora de auditoría.');
    }
    return res.json();
  }

  // --- Gestión de Usuarios y Roles (CU-07) ---
  async getUsuarios(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/usuarios/`, {
      headers: this.getHeaders()
    });
    if (!res.ok) {
      throw new Error('Error al consultar usuarios (se requiere perfil Administrador).');
    }
    return res.json();
  }

  async getRoles(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/roles/`, {
      headers: this.getHeaders()
    });
    if (!res.ok) {
      throw new Error('Error al consultar roles.');
    }
    return res.json();
  }

  async updateUsuarioRol(idUsuario: number, idRol: number): Promise<any> {
    return this.updateUsuario(idUsuario, { id_rol: idRol });
  }

  async updateUsuario(idUsuario: number, data: { id_rol?: number; password?: string; estado?: string }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/usuarios/${idUsuario}/`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al actualizar usuario.');
    }
    return res.json();
  }

  async crearUsuario(usuarioData: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/usuarios/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(usuarioData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.mensaje || JSON.stringify(err) || 'Error al crear usuario.');
    }
    return res.json();
  }
}

export const api = new ApiClient();
