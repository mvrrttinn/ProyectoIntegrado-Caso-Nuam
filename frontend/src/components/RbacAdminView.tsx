import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

export const RbacAdminView: React.FC = () => {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getUsuarios()
      .then(setUsuarios)
      .catch((err) => console.error('Error cargando usuarios:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rbac-view-container">
      <div className="view-header">
        <div>
          <h2 className="view-title">Gobernanza de Accesos y Seguridad RBAC (CU-07)</h2>
          <p className="view-subtitle">
            Administración de privilegios, segregación de funciones y cumplimiento ISO/IEC 27001 Control A.9.
          </p>
        </div>
      </div>

      {/* Matriz de Segregación de Funciones (SoD) */}
      <div className="content-card mb-6">
        <h3 className="card-title">Matriz de Privilegios por Rol Institucional</h3>
        <p className="card-subtitle mb-4">
          Control de acceso estricto a nivel de endpoints REST y componentes frontend.
        </p>

        <div className="table-responsive">
          <table className="nuam-table table-bordered">
            <thead>
              <tr>
                <th>Módulo / Funcionalidad del Sistema</th>
                <th className="text-center">Operador Corredora</th>
                <th className="text-center">Auditor nuam</th>
                <th className="text-center">Administrador Plataforma</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>CU-01: Ingesta Masiva CSV</strong></td>
                <td className="text-center text-success">✅ Autorizado</td>
                <td className="text-center text-danger">🔒 Bloqueado (HTTP 403)</td>
                <td className="text-center text-success">✅ Autorizado</td>
              </tr>
              <tr>
                <td><strong>CU-02 & CU-03: Motor DJ 1949 (6 decimales)</strong></td>
                <td className="text-center text-success">✅ Ejecución</td>
                <td className="text-center text-muted">👁️ Consulta</td>
                <td className="text-center text-success">✅ Ejecución</td>
              </tr>
              <tr>
                <td><strong>CU-04: Repositorio Multianual</strong></td>
                <td className="text-center text-success">✅ Consulta Institucional</td>
                <td className="text-center text-success">✅ Consulta Regional Total</td>
                <td className="text-center text-success">✅ Consulta Total</td>
              </tr>
              <tr>
                <td><strong>CU-05: Aprobación y Cierre de Lote Fiscal</strong></td>
                <td className="text-center text-danger font-bold">❌ Bloqueado (HTTP 403)</td>
                <td className="text-center text-success font-bold">✅ Exclusivo con Firma</td>
                <td className="text-center text-success">✅ Autorizado</td>
              </tr>
              <tr>
                <td><strong>CU-06: Bitácora Inmutable SHA-256</strong></td>
                <td className="text-center text-muted">👁️ Lectura Limitada</td>
                <td className="text-center text-success">✅ Auditoría Criptográfica</td>
                <td className="text-center text-success">✅ Control Total</td>
              </tr>
              <tr>
                <td><strong>CU-07: Gestión de Usuarios y Roles</strong></td>
                <td className="text-center text-danger">❌ Bloqueado</td>
                <td className="text-center text-danger">❌ Bloqueado</td>
                <td className="text-center text-success font-bold">👑 Exclusivo Admin</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabla de Usuarios Registrados */}
      <div className="content-card">
        <h3 className="card-title">Usuarios Activos en Plataforma nuam</h3>
        <p className="card-subtitle mb-4">
          Cuentas institucionales con autenticación federada Supabase Auth / JWT.
        </p>

        {loading ? (
          <div className="table-loading">Cargando directorio de usuarios...</div>
        ) : (
          <div className="table-responsive">
            <table className="nuam-table">
              <thead>
                <tr>
                  <th>Nombre Completo</th>
                  <th>RUT</th>
                  <th>Correo Institucional</th>
                  <th>Institución / Corredora</th>
                  <th>Rol Asignado</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id_usuario}>
                    <td className="font-bold">{u.nombre || 'Sin nombre'}</td>
                    <td className="font-mono">{u.rut}</td>
                    <td>{u.email}</td>
                    <td>{u.id_corredora}</td>
                    <td>
                      <span className={`role-badge role-${(u.rol_nombre || '').toLowerCase().replace(/\s+/g, '-')}`}>
                        {u.rol_nombre}
                      </span>
                    </td>
                    <td>
                      <span className="status-pill status-aprobado">{u.estado}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
