import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

export const RbacAdminView: React.FC = () => {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [modalNuevo, setModalNuevo] = useState(false);

  // Modal para cambiar contraseña
  const [usuarioParaPass, setUsuarioParaPass] = useState<any | null>(null);
  const [nuevaPasswordCustom, setNuevaPasswordCustom] = useState('');

  // Formulario nuevo usuario
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoRut, setNuevoRut] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('Nuam2026!');
  const [nuevaCorredora, setNuevaCorredora] = useState('LarrainVial S.A. Corredora');
  const [nuevoRolId, setNuevoRolId] = useState<number>(1);
  const [guardando, setGuardando] = useState(false);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([
        api.getUsuarios(),
        api.getRoles().catch(() => [
          { id_rol: 1, nombre_rol: 'Operador Corredora' },
          { id_rol: 2, nombre_rol: 'Auditor nuam' },
          { id_rol: 3, nombre_rol: 'Administrador Plataforma' },
        ])
      ]);
      setUsuarios(usersData);
      setRoles(rolesData);
    } catch (err: any) {
      console.error('Error cargando datos RBAC:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleCambiarRol = async (idUsuario: number, nuevoIdRol: number, nombreUser: string) => {
    try {
      await api.updateUsuarioRol(idUsuario, nuevoIdRol);
      setMensaje({
        tipo: 'success',
        texto: `✅ Rol actualizado con éxito para ${nombreUser}. Evento registrado en la bitácora criptográfica con firma SHA-256.`
      });
      cargarDatos();
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: err.message || 'Error al actualizar el rol.'
      });
    }
  };

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);
    try {
      await api.crearUsuario({
        rut: nuevoRut.trim(),
        nombre: nuevoNombre.trim(),
        email: nuevoEmail.trim(),
        id_corredora: nuevaCorredora.trim(),
        id_rol: nuevoRolId,
        password: nuevaPassword.trim() || 'Nuam2026!'
      });
      setMensaje({
        tipo: 'success',
        texto: `✅ Usuario '${nuevoNombre}' creado exitosamente con su contraseña personalizada configurada y código MFA activo.`
      });
      setModalNuevo(false);
      setNuevoNombre('');
      setNuevoRut('');
      setNuevoEmail('');
      setNuevaPassword('Nuam2026!');
      cargarDatos();
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: err.message || 'Error al crear el nuevo usuario.'
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarNuevaPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioParaPass || !nuevaPasswordCustom) return;

    setGuardando(true);
    try {
      await api.updateUsuario(usuarioParaPass.id_usuario, { password: nuevaPasswordCustom });
      setMensaje({
        tipo: 'success',
        texto: `✅ Contraseña personalizada actualizada con éxito para '${usuarioParaPass.nombre || usuarioParaPass.email}'. Hasheada con PBKDF2 en la base de datos.`
      });
      setUsuarioParaPass(null);
      setNuevaPasswordCustom('');
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: err.message || 'Error al actualizar la contraseña.'
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="rbac-view-container">
      <div className="view-header">
        <div>
          <h2 className="view-title">Gobernanza de Accesos y Seguridad RBAC (CU-07)</h2>
          <p className="view-subtitle">
            Administración de privilegios, asignación dinámica de roles y contraseñas personalizadas (ISO/IEC 27001).
          </p>
        </div>
        <div className="view-actions">
          <button type="button" className="btn-primary" onClick={() => setModalNuevo(true)}>
            ➕ Registrar Nuevo Usuario
          </button>
          <button type="button" className="btn-secondary" onClick={cargarDatos}>
            🔄 Actualizar Directorio
          </button>
        </div>
      </div>

      {mensaje && (
        <div className={`alert-banner ${mensaje.tipo === 'success' ? 'alert-success' : 'alert-error'} mb-6`}>
          <span className="alert-icon">{mensaje.tipo === 'success' ? '✅' : '⚠️'}</span>
          <span className="alert-text">{mensaje.texto}</span>
        </div>
      )}

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

      {/* Tabla de Usuarios Registrados y Asignación de Roles */}
      <div className="content-card">
        <div className="card-header-flex">
          <div>
            <h3 className="card-title">Directorio de Usuarios y Asignación de Roles</h3>
            <p className="card-subtitle">
              Cambia el rol de un usuario directamente desde el desplegable o personaliza su contraseña de acceso.
            </p>
          </div>
          <span className="badge-audit-count">{usuarios.length} Usuarios Registrados</span>
        </div>

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
                  <th>Rol Actual / Asignar Nuevo Rol</th>
                  <th>Seguridad</th>
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
                      <select
                        className="form-select text-sm py-1 font-semibold"
                        value={u.id_rol}
                        onChange={(e) => handleCambiarRol(u.id_usuario, Number(e.target.value), u.nombre || u.email)}
                      >
                        {roles.map((r) => (
                          <option key={r.id_rol} value={r.id_rol}>
                            {r.nombre_rol}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-action-sm"
                        onClick={() => {
                          setUsuarioParaPass(u);
                          setNuevaPasswordCustom('');
                        }}
                      >
                        🔑 Cambiar Clave
                      </button>
                    </td>
                    <td>
                      <span className={`status-pill ${u.estado === 'ACTIVO' ? 'status-aprobado' : 'status-observado'}`}>
                        {u.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear Nuevo Usuario */}
      {modalNuevo && (
        <div className="modal-backdrop" onClick={() => setModalNuevo(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Nuevo Usuario Institucional</h3>
              <button type="button" className="btn-close" onClick={() => setModalNuevo(false)}>✕</button>
            </div>
            <form onSubmit={handleCrearUsuario}>
              <div className="modal-body">
                <div className="form-group mb-4">
                  <label htmlFor="modal-nombre">Nombre Completo:</label>
                  <input
                    id="modal-nombre"
                    type="text"
                    className="form-input"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    placeholder="Ej: Carolina Santander"
                    required
                  />
                </div>

                <div className="form-row mb-4">
                  <div className="form-group flex-1">
                    <label htmlFor="modal-rut">RUT:</label>
                    <input
                      id="modal-rut"
                      type="text"
                      className="form-input"
                      value={nuevoRut}
                      onChange={(e) => setNuevoRut(e.target.value)}
                      placeholder="15.678.901-2"
                      required
                    />
                  </div>
                  <div className="form-group flex-2">
                    <label htmlFor="modal-email">Correo Institucional:</label>
                    <input
                      id="modal-email"
                      type="email"
                      className="form-input"
                      value={nuevoEmail}
                      onChange={(e) => setNuevoEmail(e.target.value)}
                      placeholder="usuario@larrainvial.cl"
                      required
                    />
                  </div>
                </div>

                <div className="form-row mb-4">
                  <div className="form-group flex-1">
                    <label htmlFor="modal-corredora">Institución / Corredora:</label>
                    <input
                      id="modal-corredora"
                      type="text"
                      className="form-input"
                      value={nuevaCorredora}
                      onChange={(e) => setNuevaCorredora(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label htmlFor="modal-rol">Rol a Asignar:</label>
                    <select
                      id="modal-rol"
                      className="form-select"
                      value={nuevoRolId}
                      onChange={(e) => setNuevoRolId(Number(e.target.value))}
                    >
                      {roles.map((r) => (
                        <option key={r.id_rol} value={r.id_rol}>
                          {r.nombre_rol}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group mb-4">
                  <label htmlFor="modal-pass">Contraseña Personalizada:</label>
                  <input
                    id="modal-pass"
                    type="text"
                    className="form-input font-mono"
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    placeholder="Escribe la clave que desees (ej: MiClaveSegura2026!)"
                    required
                  />
                </div>

                <div className="alert-box-notice">
                  ℹ️ La contraseña se cifrará de forma irreversible mediante el algoritmo <code>PBKDF2 SHA-256</code> en cumplimiento de la norma ISO/IEC 27001. El código MFA asignado será cualquier código numérico de 6 dígitos.
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary mr-2" onClick={() => setModalNuevo(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cambiar Contraseña de Usuario */}
      {usuarioParaPass && (
        <div className="modal-backdrop" onClick={() => setUsuarioParaPass(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Cambiar Contraseña — {usuarioParaPass.nombre || usuarioParaPass.email}</h3>
              <button type="button" className="btn-close" onClick={() => setUsuarioParaPass(null)}>✕</button>
            </div>
            <form onSubmit={handleGuardarNuevaPassword}>
              <div className="modal-body">
                <p className="text-sm text-muted mb-4">
                  Ingresa una nueva contraseña personalizada para el usuario con RUT <strong>{usuarioParaPass.rut}</strong>:
                </p>

                <div className="form-group mb-4">
                  <label htmlFor="input-new-pass">Nueva Contraseña:</label>
                  <input
                    id="input-new-pass"
                    type="text"
                    className="form-input font-mono"
                    value={nuevaPasswordCustom}
                    onChange={(e) => setNuevaPasswordCustom(e.target.value)}
                    placeholder="Escribe la nueva contraseña personalizada"
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary mr-2" onClick={() => setUsuarioParaPass(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={guardando}>
                  {guardando ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
