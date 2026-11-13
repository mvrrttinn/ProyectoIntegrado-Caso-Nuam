import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

interface PasswordPolicyStatus {
  minLen: boolean;
  hasMayus: boolean;
  hasMinus: boolean;
  hasNum: boolean;
  hasSpecial: boolean;
  esValida: boolean;
}

const evaluarPassword = (pass: string): PasswordPolicyStatus => {
  const minLen = pass.length >= 8;
  const hasMayus = /[A-Z]/.test(pass);
  const hasMinus = /[a-z]/.test(pass);
  const hasNum = /[0-9]/.test(pass);
  const hasSpecial = /[^A-Za-z0-9]/.test(pass);
  return {
    minLen,
    hasMayus,
    hasMinus,
    hasNum,
    hasSpecial,
    esValida: minLen && hasMayus && hasMinus && hasNum && hasSpecial,
  };
};

const PasswordPolicyChecklist: React.FC<{ password: string; isOptional?: boolean }> = ({ password, isOptional }) => {
  if (isOptional && !password.trim()) return null;
  const status = evaluarPassword(password);
  return (
    <div className="password-policy-card">
      <span className="password-policy-title">
        {status.esValida ? '✅ Contraseña Reforzada Válida (ISO/IEC 27001)' : '🛡️ Requisitos de Contraseña Reforzada:'}
      </span>
      <div className="password-policy-grid">
        <div className={`policy-item ${status.minLen ? 'met' : 'unmet'}`}>
          <span>{status.minLen ? '✅' : '⚪'}</span>
          <span>Mínimo 8 caracteres</span>
        </div>
        <div className={`policy-item ${status.hasMayus ? 'met' : 'unmet'}`}>
          <span>{status.hasMayus ? '✅' : '⚪'}</span>
          <span>1 Letra Mayúscula (A-Z)</span>
        </div>
        <div className={`policy-item ${status.hasMinus ? 'met' : 'unmet'}`}>
          <span>{status.hasMinus ? '✅' : '⚪'}</span>
          <span>1 Letra Minúscula (a-z)</span>
        </div>
        <div className={`policy-item ${status.hasNum ? 'met' : 'unmet'}`}>
          <span>{status.hasNum ? '✅' : '⚪'}</span>
          <span>1 Número (0-9)</span>
        </div>
        <div className={`policy-item ${status.hasSpecial ? 'met' : 'unmet'}`}>
          <span>{status.hasSpecial ? '✅' : '⚪'}</span>
          <span>1 Símbolo especial (!, @, #, $, etc.)</span>
        </div>
      </div>
    </div>
  );
};

export const RbacAdminView: React.FC = () => {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  // Modal Nuevo Usuario
  const [modalNuevo, setModalNuevo] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoRut, setNuevoRut] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('Nuam2026!');
  const [nuevaCorredora, setNuevaCorredora] = useState('LarrainVial S.A. Corredora');
  const [nuevoRolId, setNuevoRolId] = useState<number>(1);

  // Modal Editar Usuario Completo
  const [usuarioEditando, setUsuarioEditando] = useState<any | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCorredora, setEditCorredora] = useState('');
  const [editRolId, setEditRolId] = useState<number>(1);
  const [editEstado, setEditEstado] = useState('ACTIVO');
  const [editPassword, setEditPassword] = useState('');

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

  const abrirModalEditar = (u: any) => {
    setUsuarioEditando(u);
    setEditNombre(u.nombre || '');
    setEditEmail(u.email || '');
    setEditCorredora(u.id_corredora || 'LarrainVial S.A. Corredora');
    setEditRolId(u.id_rol || 1);
    setEditEstado(u.estado || 'ACTIVO');
    setEditPassword('');
    setMensaje(null);
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioEditando) return;

    setGuardando(true);
    setMensaje(null);

    const payload: any = {
      nombre: editNombre.trim(),
      email: editEmail.trim(),
      id_corredora: editCorredora.trim(),
      id_rol: editRolId,
      estado: editEstado
    };

    if (editPassword.trim()) {
      const policy = evaluarPassword(editPassword.trim());
      if (!policy.esValida) {
        setMensaje({
          tipo: 'error',
          texto: '⚠️ La contraseña no cumple con la política de seguridad reforzada (mínimo 8 caracteres, al menos una mayúscula, una minúscula, un número y un carácter especial).'
        });
        setGuardando(false);
        return;
      }
      payload.password = editPassword.trim();
    }

    try {
      await api.updateUsuario(usuarioEditando.id_usuario, payload);
      setMensaje({
        tipo: 'success',
        texto: `✅ Usuario '${editNombre || editEmail}' actualizado correctamente en Supabase PostgreSQL. Evento registrado con firma criptográfica SHA-256.`
      });
      setUsuarioEditando(null);
      cargarDatos();
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: err.message || 'Error al guardar los cambios del usuario.'
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarRolRapido = async (idUsuario: number, nuevoIdRol: number, nombreUser: string) => {
    try {
      await api.updateUsuario(idUsuario, { id_rol: nuevoIdRol });
      setMensaje({
        tipo: 'success',
        texto: `✅ Rol actualizado con éxito para ${nombreUser}. Firma digital emitida.`
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

    const passLimpia = nuevaPassword.trim() || 'Nuam2026!';
    const policy = evaluarPassword(passLimpia);
    if (!policy.esValida) {
      setMensaje({
        tipo: 'error',
        texto: '⚠️ La contraseña personalizada no cumple con la política reforzada (mínimo 8 caracteres, al menos una mayúscula, una minúscula, un número y un carácter especial).'
      });
      setGuardando(false);
      return;
    }

    try {
      await api.crearUsuario({
        rut: nuevoRut.trim(),
        nombre: nuevoNombre.trim(),
        email: nuevoEmail.trim(),
        id_corredora: nuevaCorredora.trim(),
        id_rol: nuevoRolId,
        password: passLimpia
      });
      setMensaje({
        tipo: 'success',
        texto: `✅ Usuario '${nuevoNombre}' registrado exitosamente en la plataforma nuam.`
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

  return (
    <div className="rbac-view-container">
      <div className="view-header">
        <div>
          <h2 className="view-title">Gobernanza de Accesos y Seguridad RBAC (CU-07)</h2>
          <p className="view-subtitle">
            Administración completa de usuarios: edición de nombres, correos, roles institucionales y contraseñas (ISO/IEC 27001).
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

      {/* Tabla de Usuarios Registrados y Edición */}
      <div className="content-card">
        <div className="card-header-flex">
          <div>
            <h3 className="card-title">Directorio de Usuarios de la Plataforma</h3>
            <p className="card-subtitle">
              Puedes cambiar el rol rápidamente o hacer clic en "Editar" para modificar el nombre, correo, corredor o contraseña.
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
                  <th>Rol Asignado</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id_usuario}>
                    <td className="font-bold">{u.nombre || 'Sin nombre'}</td>
                    <td className="font-mono text-sm">{u.rut}</td>
                    <td className="text-sm">{u.email}</td>
                    <td>{u.id_corredora}</td>
                    <td>
                      <select
                        className="form-select text-sm py-1 font-semibold"
                        value={u.id_rol}
                        onChange={(e) => handleCambiarRolRapido(u.id_usuario, Number(e.target.value), u.nombre || u.email)}
                        title="Cambio rápido de rol"
                      >
                        {roles.map((r) => (
                          <option key={r.id_rol} value={r.id_rol}>
                            {r.nombre_rol}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={`status-pill ${u.estado === 'ACTIVO' ? 'status-aprobado' : 'status-observado'}`}>
                        {u.estado}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-action-sm"
                        onClick={() => abrirModalEditar(u)}
                        title="Editar nombre, correo, corredora y contraseña"
                      >
                        ✏️ Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Editar Usuario Completo */}
      {usuarioEditando && (
        <div className="modal-backdrop" onClick={() => setUsuarioEditando(null)}>
          <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Usuario — {usuarioEditando.nombre || usuarioEditando.email}</h3>
              <button type="button" className="btn-close" onClick={() => setUsuarioEditando(null)}>✕</button>
            </div>
            <form onSubmit={handleGuardarEdicion}>
              <div className="modal-body">
                <div className="form-row mb-4">
                  <div className="form-group flex-2">
                    <label htmlFor="edit-nombre">Nombre Completo:</label>
                    <input
                      id="edit-nombre"
                      type="text"
                      className="form-input"
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      placeholder="Nombre del usuario"
                      required
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label htmlFor="edit-rut">RUT Fiscal (Identificador):</label>
                    <input
                      id="edit-rut"
                      type="text"
                      className="form-input font-mono"
                      value={usuarioEditando.rut}
                      disabled
                      title="El RUT no se puede modificar por integridad de auditoría"
                    />
                  </div>
                </div>

                <div className="form-row mb-4">
                  <div className="form-group flex-2">
                    <label htmlFor="edit-email">Correo Electrónico Institucional:</label>
                    <input
                      id="edit-email"
                      type="email"
                      className="form-input"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label htmlFor="edit-estado">Estado de la Cuenta:</label>
                    <select
                      id="edit-estado"
                      className="form-select"
                      value={editEstado}
                      onChange={(e) => setEditEstado(e.target.value)}
                    >
                      <option value="ACTIVO">ACTIVO (Habilitado)</option>
                      <option value="INACTIVO">INACTIVO (Bloqueado)</option>
                    </select>
                  </div>
                </div>

                <div className="form-row mb-4">
                  <div className="form-group flex-1">
                    <label htmlFor="edit-corredora">Institución o Corredora:</label>
                    <input
                      id="edit-corredora"
                      type="text"
                      className="form-input"
                      value={editCorredora}
                      onChange={(e) => setEditCorredora(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label htmlFor="edit-rol">Rol Institucional (RBAC):</label>
                    <select
                      id="edit-rol"
                      className="form-select"
                      value={editRolId}
                      onChange={(e) => setEditRolId(Number(e.target.value))}
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
                  <label htmlFor="edit-pass">
                    Nueva Contraseña de Acceso <span className="text-xs text-muted">(Opcional: déjala en blanco para mantener la actual)</span>:
                  </label>
                  <input
                    id="edit-pass"
                    type="text"
                    className="form-input font-mono"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="•••••••••••• (Escribe una nueva clave solo si deseas cambiarla)"
                  />
                  <PasswordPolicyChecklist password={editPassword} isOptional={true} />
                </div>

                <div className="alert-box-notice">
                  ℹ️ Cualquier modificación quedará auditada de forma inmutable en <code>TB_AUDIT_LOGS</code> con el identificador del Administrador y firma criptográfica SHA-256.
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary mr-2" onClick={() => setUsuarioEditando(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={guardando}>
                  {guardando ? 'Guardando cambios...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Nuevo Usuario */}
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
                  <label htmlFor="modal-pass">Contraseña Personalizada (Seguridad Reforzada):</label>
                  <input
                    id="modal-pass"
                    type="text"
                    className="form-input font-mono"
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    placeholder="Escribe la clave que desees (ej: MiClaveSegura2026!)"
                    required
                  />
                  <PasswordPolicyChecklist password={nuevaPassword} isOptional={false} />
                </div>

                <div className="alert-box-notice">
                  ℹ️ La contraseña se cifrará de forma irreversible mediante el algoritmo <code>PBKDF2 SHA-256</code> en cumplimiento de la norma ISO/IEC 27001.
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
    </div>
  );
};
