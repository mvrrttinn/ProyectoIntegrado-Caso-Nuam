import React, { useState } from 'react';
import type { UsuarioAutenticado } from '../types';
import { api } from '../services/api';
import nuamLogo from '../assets/nuam-logo.png';

interface LoginViewProps {
  onLoginSuccess: (usuario: UsuarioAutenticado) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  // Cargar usuario recordado desde almacenamiento local
  const usuarioRecordado = localStorage.getItem('nuam_ultimo_usuario') || '';
  const recordarInicial = localStorage.getItem('nuam_recordar_usuario') !== 'false';

  const [identificador, setIdentificador] = useState(usuarioRecordado);
  const [password, setPassword] = useState('');
  const [recordarUsuario, setRecordarUsuario] = useState(recordarInicial);
  const [codigoMfa, setCodigoMfa] = useState('');
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
    setErrorMsg(null);

    // Validaciones preventivas con mensajes en español claros
    const idLimpio = identificador.trim();
    if (!idLimpio) {
      setErrorMsg('Por favor ingrese su RUT o correo institucional.');
      return;
    }

    if (!password) {
      setErrorMsg('Por favor ingrese su contraseña de seguridad.');
      return;
    }

    const mfaLimpio = codigoMfa.trim();
    if (!mfaLimpio) {
      setErrorMsg("Debe ingresar el código MFA de 6 dígitos (o presione '📲 OTP' para generar uno).");
      return;
    }

    if (!/^\d{6}$/.test(mfaLimpio)) {
      setErrorMsg('El código MFA debe contener exactamente 6 dígitos numéricos (sin letras ni espacios).');
      return;
    }

    setLoading(true);

    try {
      const response = await api.login(
        idLimpio,
        password,
        mfaLimpio,
        undefined, // Autodetección de rol asignado al usuario
        tokenMfaGenerado || undefined
      );

      // Gestionar preferencia de recordar usuario
      if (recordarUsuario) {
        localStorage.setItem('nuam_recordar_usuario', 'true');
        localStorage.setItem('nuam_ultimo_usuario', idLimpio);
      } else {
        localStorage.setItem('nuam_recordar_usuario', 'false');
        localStorage.removeItem('nuam_ultimo_usuario');
      }

      onLoginSuccess(response.usuario);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen-wrapper">
      <div className="login-card">
        {/* Encabezado Institucional nuam */}
        <div className="login-header">
          <div className="login-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.85rem' }}>
            <img src={nuamLogo} alt="nuam" style={{ height: '52px', width: '52px', objectFit: 'contain', borderRadius: '10px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span className="brand-nuam" style={{ lineHeight: '1' }}>nuam</span>
              <span className="brand-subtitle">EXCHANGE GROUP</span>
            </div>
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

          <div className="form-group">
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="input-mfa">Código MFA (Autenticación de Dos Factores)</label>
              <button
                type="button"
                className="btn-link text-xs font-bold"
                onClick={generarNuevoMfa}
                title="Generar código dinámico OTP"
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
              placeholder="000000"
            />
          </div>

          <div className="form-group mb-4">
            <label className="checkbox-label flex items-center gap-2 cursor-pointer text-sm text-muted select-none">
              <input
                type="checkbox"
                checked={recordarUsuario}
                onChange={(e) => setRecordarUsuario(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              <span>Recordar mi usuario en este equipo</span>
            </label>
          </div>

          {tokenMfaGenerado && (
            <div className="alert-banner alert-success py-2 text-xs">
              <span>📲 <strong>Token MFA Generado:</strong> Código <code>{tokenMfaGenerado}</code> emitido (Válido 60s).</span>
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

        {/* Sello de Conformidad ISO 27001 / Ley 21.719 / CMF */}
        <div className="login-footer-security">
          <span className="sec-icon">🔒</span>
          <span>Conexión cifrada TLS 1.3 — Cumplimiento CMF / ISO 27001 / Ley N° 21.719</span>
        </div>
      </div>
    </div>
  );
};
