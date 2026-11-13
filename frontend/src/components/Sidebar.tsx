import React from 'react';
import type { UsuarioAutenticado } from '../types';

export type NavView = 'dashboard' | 'upload' | 'repository' | 'audit' | 'rbac';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  usuario: UsuarioAutenticado | null;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  usuario,
  isMobileOpen,
  onCloseMobile
}) => {
  const rol = usuario?.rol;

  const handleSelect = (view: NavView) => {
    onSelectView(view);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {isMobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside className={`nuam-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-section-title">MÓDULOS DE GESTIÓN</span>
          {isMobileOpen && (
            <button
              type="button"
              className="btn-close-sidebar"
              onClick={onCloseMobile}
              aria-label="Cerrar menú"
            >
              ✕
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          <button
            type="button"
            className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleSelect('dashboard')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Dashboard Cierre Fiscal</span>
          </button>

          <button
            type="button"
            className={`nav-item ${currentView === 'upload' ? 'active' : ''}`}
            onClick={() => handleSelect('upload')}
          >
            <span className="nav-icon">📁</span>
            <span className="nav-label">Carga Masiva CSV</span>
            {rol === 'Auditor nuam' && <span className="item-tag-readonly">Solo Lectura</span>}
          </button>

          <button
            type="button"
            className={`nav-item ${currentView === 'repository' ? 'active' : ''}`}
            onClick={() => handleSelect('repository')}
          >
            <span className="nav-icon">🗄️</span>
            <span className="nav-label">Repositorio Multianual</span>
          </button>

          <button
            type="button"
            className={`nav-item ${currentView === 'audit' ? 'active' : ''}`}
            onClick={() => handleSelect('audit')}
          >
            <span className="nav-icon">🛡️</span>
            <span className="nav-label">Bitácora SHA-256</span>
          </button>

          {rol === 'Administrador Plataforma' && (
            <button
              type="button"
              className={`nav-item ${currentView === 'rbac' ? 'active' : ''}`}
              onClick={() => handleSelect('rbac')}
            >
              <span className="nav-icon">⚙️</span>
              <span className="nav-label">Gobernanza RBAC</span>
            </button>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="compliance-stamp">
            <span className="stamp-icon">🔒</span>
            <span className="stamp-text">ISO 27001 · Ley 21.719</span>
          </div>
          <div className="compliance-sub">Protección de Datos & CMF</div>
        </div>
      </aside>
    </>
  );
};
