import { useState, useEffect } from 'react';
import type { UsuarioAutenticado } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import type { NavView } from './components/Sidebar';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { UploadCsvView } from './components/UploadCsvView';
import { RepositoryView } from './components/RepositoryView';
import { AuditLogView } from './components/AuditLogView';
import { RbacAdminView } from './components/RbacAdminView';
import { FloatingLoader } from './components/FloatingLoader';
import './App.css';

export function App() {
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null);
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [loadingInfo, setLoadingInfo] = useState<{ loading: boolean; mensaje?: string }>({ loading: false });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Suscripción al monitor global de llamadas en vuelo
    const unsubscribe = api.onLoading((isLoading, mensaje) => {
      setLoadingInfo({ loading: isLoading, mensaje });
    });

    // Si existe token previo, restaurar sesión de demostración
    const savedToken = api.getToken();
    const savedUser = localStorage.getItem('nuam_user');
    if (savedToken && savedUser) {
      try {
        setUsuario(JSON.parse(savedUser));
      } catch {
        api.logout();
      }
    }

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (user: UsuarioAutenticado) => {
    setUsuario(user);
    localStorage.setItem('nuam_user', JSON.stringify(user));
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    api.logout();
    localStorage.removeItem('nuam_user');
    setUsuario(null);
    setCurrentView('dashboard');
  };

  return (
    <>
      {loadingInfo.loading && <FloatingLoader mensaje={loadingInfo.mensaje} />}

      {!usuario ? (
        <LoginView onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div className="nuam-app-layout">
          <Navbar
            usuario={usuario}
            onLogout={handleLogout}
            onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
            isMobileMenuOpen={mobileMenuOpen}
          />
          
          <div className="nuam-main-body">
            <Sidebar
              currentView={currentView}
              onSelectView={setCurrentView}
              usuario={usuario}
              isMobileOpen={mobileMenuOpen}
              onCloseMobile={() => setMobileMenuOpen(false)}
            />

            <main className="nuam-content-area">
              {currentView === 'dashboard' && (
                <DashboardView
                  usuario={usuario}
                  onNavigateToUpload={() => setCurrentView('upload')}
                  onNavigateToRepository={() => setCurrentView('repository')}
                />
              )}

              {currentView === 'upload' && (
                <UploadCsvView
                  usuario={usuario}
                  onSuccess={() => setCurrentView('dashboard')}
                />
              )}

              {currentView === 'repository' && (
                <RepositoryView usuario={usuario} />
              )}

              {currentView === 'audit' && (
                <AuditLogView />
              )}

              {currentView === 'rbac' && usuario.rol === 'Administrador Plataforma' && (
                <RbacAdminView />
              )}
            </main>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
