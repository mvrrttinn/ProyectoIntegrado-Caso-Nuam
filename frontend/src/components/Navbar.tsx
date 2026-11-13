import React from 'react';
import type { UsuarioAutenticado } from '../types';
import nuamLogo from '../assets/nuam-logo.png';

interface NavbarProps {
  usuario: UsuarioAutenticado | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ usuario, onLogout }) => {
  return (
    <header className="nuam-topbar">
      <div className="topbar-left">
        <div className="logo-badge" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem' }}>
          <img src={nuamLogo} alt="nuam" style={{ height: '36px', width: '36px', objectFit: 'contain', borderRadius: '6px' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="logo-text" style={{ lineHeight: '1.1' }}>nuam</span>
            <span className="logo-subtext">EXCHANGE GROUP</span>
          </div>
        </div>
        <div className="system-pill">
          <span className="system-title">Mantenedor de Dividendos y Factores Tributarios</span>
          <span className="env-badge">Año Tributario 2026</span>
        </div>
      </div>

      <div className="topbar-right">
        {usuario && (
          <div className="user-profile-widget">
            <div className="institution-tag">
              <span className="inst-icon">🏦</span>
              <span className="inst-name">{usuario.corredora}</span>
            </div>
            <div className="user-identity">
              <span className="user-name">{usuario.nombre || usuario.email}</span>
              <span className={`role-badge role-${usuario.rol.toLowerCase().replace(/\s+/g, '-')}`}>
                {usuario.rol}
              </span>
            </div>
            <button
              type="button"
              className="btn-logout"
              onClick={onLogout}
              title="Cerrar sesión segura (ISO 27001)"
            >
              Salir
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
