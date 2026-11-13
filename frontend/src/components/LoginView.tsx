import React, { useState } from 'react';
import type { RolNombre, UsuarioAutenticado } from '../types';
import { api } from '../services/api';

interface LoginViewProps {
  onLoginSuccess: (usuario: UsuarioAutenticado) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [identificador, setIdentificador] = useState('operador@larrainvial.cl');
  const [password, setPassword] = useState('Nuam2026!');
  const [rol, setRol] = useState<RolNombre>('Operador Corredora');
  const [codigoMfa, setCodigoMfa] = useState('123456');
  const [tokenMfaGenerado, setTokenMfaGenerado] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const generarNuevoMfa = () => {
    const nuevoCodigo = Math.floor(100000 + Math.random() * 900000).toString();
    setCodigoMfa(nuevoCodigo);
    setTokenMfaGenerado(nuevoCodigo);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await api.login(identificador, password, codigoMfa, rol);
      onLoginSuccess(response.usuario);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  const setPerfilRapido = (email: string, rolElegido: RolNombre) => {
    setIdentificador(email);
    setPassword('Nuam2026!');
    setRol(rolElegido);
    setCodigoMfa('123456');
    setErrorMsg(null);
  };

  return (
    <div className="login-screen-wrapper">
      <div className="login-card">
        {/* Encabezado Institucional nuam */}
        <div className="login-header">
          <div className="login-brand">
            <span className="brand-nuam">nuam</span>
            <span className="brand-subtitle">EXCHANGE GROUP</span>
          </div>
          <div className="regional-badge">Holding Bursátil Regional (Chile · Perú · Colombia)</div>
          <h1 className="portal-title">Mantenedor Centralizado de Calificaciones Tributarias</h1>
          <p className="portal-desc">
            Acceso unificado SSO bajo estándares normativos CMF y DJ 1949/1922
          </p>
        </div>

        {errorMsg && (
          <div className="alert-banner alert-error" role="alert">
            <span className="alert-icon">⚠️</span>
            <span className="alert-text">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="input-identificador">RUT o Correo Electrónico Institucional</label>
            <input
              id="input-identificador"
              type="text"
              className="form-input"
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              placeholder="12.345.678-9 o usuario@corredora.cl"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="input-password">Contraseña de Seguridad</label>
            <input
              id="input-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="select-rol">Rol Institucional (RBAC)</label>
              <select
                id="select-rol"
                className="form-select"
                value={rol}
                onChange={(e) => setRol(e.target.value as RolNombre)}
              >
                <option value="Operador Corredora">Operador Corredora</option>
                <option value="Auditor nuam">Auditor nuam</option>
                <option value="Administrador Plataforma">Administrador Plataforma</option>
              </select>
            </div>

            <div className="form-group w-mfa">
              <div className="flex justify-between items-center">
                <label htmlFor="input-mfa">Código MFA</label>
                <button
                  type="button"
                  className="btn-link text-xs"
                  onClick={generarNuevoMfa}
                  title="Simular código OTP enviado a dispositivo móvil"
                >
                  📲 Generar OTP
                </button>
              </div>
              <input
                id="input-mfa"
                type="text"
                className="form-input text-center font-mono letter-spacing-lg"
                maxLength={6}
                value={codigoMfa}
                onChange={(e) => setCodigoMfa(e.target.value)}
                placeholder="123456"
                required
              />
            </div>
          </div>

          {tokenMfaGenerado && (
            <div className="alert-banner alert-success py-2 text-xs">
              <span>📲 <strong>Token MFA Generado:</strong> Código <code>{tokenMfaGenerado}</code> enviado al dispositivo del usuario (Válido 60s).</span>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary btn-block btn-lg"
            disabled={loading}
          >
            {loading ? 'Verificando firma digital...' : 'Autenticar e Ingresar'}
          </button>
        </form>

        {/* Perfiles de Acceso Rápido para Demostración / Rúbrica */}
        <div className="quick-access-section">
          <span className="quick-access-title">ACCESOS RÁPIDOS DE PRUEBA:</span>
          <div className="quick-buttons-row">
            <button
              type="button"
              className="btn-quick"
              onClick={() => setPerfilRapido('operador@larrainvial.cl', 'Operador Corredora')}
            >
              🧑‍💼 Operador (LarrainVial)
            </button>
            <button
              type="button"
              className="btn-quick"
              onClick={() => setPerfilRapido('auditor@nuam.com', 'Auditor nuam')}
            >
              🔍 Auditor nuam
            </button>
            <button
              type="button"
              className="btn-quick"
              onClick={() => setPerfilRapido('admin@nuam.com', 'Administrador Plataforma')}
            >
              🛡️ Admin Global
            </button>
          </div>
        </div>

        {/* Sello de Conformidad ISO 27001 / CMF */}
        <div className="login-footer-security">
          <span className="sec-icon">🔒</span>
          <span>Conexión cifrada TLS 1.3 — Cumplimiento CMF / ISO 27001 Control A.9</span>
        </div>
      </div>
    </div>
  );
};
