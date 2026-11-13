import React from 'react';
import type { UsuarioAutenticado } from '../types';

export type NavView = 'dashboard' | 'upload' | 'repository' | 'audit' | 'rbac';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  usuario: UsuarioAutenticado | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onSelectView, usuario }) => {
  const rol = usuario?.rol;

  return (
    <aside className="nuam-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-section-title">MÓDULOS DE GESTIÓN</span>
      </div>

      <nav className="sidebar-nav">
        <button
          type="button"
          className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => onSelectView('dashboard')}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">Dashboard Cierre Fiscal</span>
        </button>

        <button
          type="button"
          className={`nav-item ${currentView === 'upload' ? 'active' : ''}`}
          onClick={() => onSelectView('upload')}
        >
          <span className="nav-icon">📁</span>
          <span className="nav-label">Carga Masiva CSV</span>
          {rol === 'Auditor nuam' && <span className="item-tag-readonly">Solo Lectura</span>}
        </button>

        <button
          type="button"
          className={`nav-item ${currentView === 'repository' ? 'active' : ''}`}
          onClick={() => onSelectView('repository')}
        >
          <span className="nav-icon">🗄️</span>
          <span className="nav-label">Repositorio Multianual</span>
        </button>

        <button
          type="button"
          className={`nav-item ${currentView === 'audit' ? 'active' : ''}`}
          onClick={() => onSelectView('audit')}
        >
          <span className="nav-icon">🛡️</span>
          <span className="nav-label">Bitácora SHA-256</span>
        </button>

        {rol === 'Administrador Plataforma' && (
          <button
            type="button"
            className={`nav-item ${currentView === 'rbac' ? 'active' : ''}`}
            onClick={() => onSelectView('rbac')}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">Gobernanza RBAC</span>
          </button>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="compliance-stamp">
          <span className="stamp-icon">🔒</span>
          <span className="stamp-text">ISO/IEC 27001 & CMF</span>
        </div>
        <div className="compliance-sub">Precisión Decimal (6 dec.)</div>
      </div>
    </aside>
  );
};
