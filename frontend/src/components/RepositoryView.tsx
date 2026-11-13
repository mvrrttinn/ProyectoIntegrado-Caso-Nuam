import React, { useEffect, useState } from 'react';
import type { CertificadoDividendo, UsuarioAutenticado } from '../types';
import { api } from '../services/api';

interface RepositoryViewProps {
  usuario: UsuarioAutenticado;
}

export const RepositoryView: React.FC<RepositoryViewProps> = ({ usuario }) => {
  const [certificados, setCertificados] = useState<CertificadoDividendo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroAnio, setFiltroAnio] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [mensajeAccion, setMensajeAccion] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  const esAuditor = usuario.rol === 'Auditor nuam' || usuario.rol === 'Administrador Plataforma';

  const cargarCertificados = async () => {
    setLoading(true);
    setMensajeAccion(null);
    try {
      const data = await api.getCertificados({
        anio: filtroAnio !== 'todos' ? Number(filtroAnio) : undefined,
        estado: filtroEstado !== 'todos' ? filtroEstado : undefined,
        search: search.trim() || undefined
      });
      setCertificados(data);
    } catch (err: any) {
      console.error('Error cargando certificados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCertificados();
  }, [filtroAnio, filtroEstado]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    cargarCertificados();
  };

  const handleCerrarLote = async (folio: string) => {
    if (!esAuditor) {
      setMensajeAccion({
        tipo: 'error',
        texto: `Acceso Denegado (HTTP 403 Forbidden): El rol '${usuario.rol}' no tiene atribuciones normativas para aprobar y cerrar lotes fiscales según ISO/IEC 27001.`
      });
      return;
    }

    try {
      const resp = await api.cerrarLoteFiscal(folio);
      setMensajeAccion({
        tipo: 'success',
        texto: `✅ ${resp.mensaje || `Lote ${folio} cerrado exitosamente.`}`
      });
      cargarCertificados();
    } catch (err: any) {
      setMensajeAccion({
        tipo: 'error',
        texto: err.message || 'Error al ejecutar cierre de lote fiscal.'
      });
    }
  };

  const exportarCsvCmf = () => {
    if (certificados.length === 0) {
      alert("No hay registros disponibles para exportar.");
      return;
    }

    const headers = [
      'Folio_Certificado',
      'RUT_Emisor',
      'Razon_Social',
      'Anio_Tributario',
      'Fecha_Pago',
      'Monto_Bruto_CLP',
      'Factor_Renta_Afecta',
      'Factor_Renta_Exenta',
      'Factor_Credito_Impuesto',
      'Suma_Proporciones',
      'Estado_Proceso'
    ];

    const rows = certificados.map((c) => {
      const f = c.primer_factor;
      return [
        `"${c.folio_certificado}"`,
        `"${c.rut_emisor_str || c.rut_emisor}"`,
        `"${c.razon_social_emisor}"`,
        c.anio_tributario,
        c.fecha_pago,
        c.monto_total_bruto,
        f ? f.factor_afecto : '0.000000',
        f ? f.factor_exento : '0.000000',
        f ? f.factor_credito : '0.000000',
        f ? f.suma_proporciones : '1.000000',
        `"${c.estado_proceso}"`
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte_normativo_cmf_${filtroAnio}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="repository-view-container">
      <div className="view-header">
        <div>
          <h2 className="view-title">Repositorio Histórico Multianual (CU-04)</h2>
          <p className="view-subtitle">
            Consulta y auditoría de certificados tributarios con trazabilidad a 6 decimales para DJ 1949 / DJ 1922.
          </p>
        </div>
        <div className="view-actions">
          <button type="button" className="btn-secondary" onClick={exportarCsvCmf}>
            📥 Exportar Formato CMF / CSV
          </button>
        </div>
      </div>

      {mensajeAccion && (
        <div className={`alert-banner ${mensajeAccion.tipo === 'success' ? 'alert-success' : 'alert-error'} mb-6`}>
          <span className="alert-icon">{mensajeAccion.tipo === 'success' ? '✅' : '🛑'}</span>
          <span className="alert-text">{mensajeAccion.texto}</span>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="filters-card mb-6">
        <form onSubmit={handleBuscar} className="filters-form">
          <div className="filter-item flex-2">
            <label htmlFor="repo-search">Búsqueda Rápida (RUT / Razón Social / Folio):</label>
            <input
              id="repo-search"
              type="text"
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ej: Banco de Chile, 97.004.000-5, LT-2026..."
            />
          </div>

          <div className="filter-item">
            <label htmlFor="filter-anio">Año Tributario:</label>
            <select
              id="filter-anio"
              className="form-select"
              value={filtroAnio}
              onChange={(e) => setFiltroAnio(e.target.value)}
            >
              <option value="todos">Todos los Años</option>
              <option value="2026">2026 (Vigente)</option>
              <option value="2025">2025 (Histórico)</option>
              <option value="2024">2024 (Histórico)</option>
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="filter-estado">Estado de Proceso:</label>
            <select
              id="filter-estado"
              className="form-select"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todos">Todos los Estados</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Observado">Observado</option>
              <option value="Cerrado">Cerrado</option>
            </select>
          </div>

          <div className="filter-item filter-submit">
            <button type="submit" className="btn-primary">
              🔍 Filtrar
            </button>
          </div>
        </form>
      </div>

      {/* Tabla del Repositorio */}
      <div className="content-card">
        {loading ? (
          <div className="table-loading">Consultando repositorio de Supabase PostgreSQL...</div>
        ) : certificados.length === 0 ? (
          <div className="table-empty">No se encontraron registros que coincidan con los filtros aplicados.</div>
        ) : (
          <div className="table-responsive">
            <table className="nuam-table">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Año</th>
                  <th>Emisor Bursátil</th>
                  <th>RUT Emisor</th>
                  <th>Fecha Pago</th>
                  <th>Monto Bruto ($)</th>
                  <th>Factor Afecto</th>
                  <th>Factor Exento</th>
                  <th>Suma Factores</th>
                  <th>Estado</th>
                  <th>Acción Fiscal</th>
                </tr>
              </thead>
              <tbody>
                {certificados.map((cert) => {
                  const factor = cert.primer_factor;
                  const esCerrado = cert.estado_proceso === 'Cerrado';
                  const esObservado = cert.estado_proceso === 'Observado';

                  return (
                    <tr key={cert.folio_certificado}>
                      <td className="font-mono font-bold text-accent">{cert.folio_certificado}</td>
                      <td className="font-bold">{cert.anio_tributario}</td>
                      <td>{cert.razon_social_emisor}</td>
                      <td className="font-mono text-sm">{cert.rut_emisor_str || cert.rut_emisor}</td>
                      <td>{cert.fecha_pago}</td>
                      <td className="font-mono font-semibold">${Number(cert.monto_total_bruto).toLocaleString('es-CL')}</td>
                      <td className="font-mono">{factor ? factor.factor_afecto : '0.700000'}</td>
                      <td className="font-mono">{factor ? factor.factor_exento : '0.300000'}</td>
                      <td className="font-mono">
                        <span className={`badge-cuadre ${factor?.es_cuadre_exacto !== false ? 'cuadre-ok' : 'cuadre-error'}`}>
                          {factor ? factor.suma_proporciones : '1.000000'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill status-${cert.estado_proceso.toLowerCase()}`}>
                          {cert.estado_proceso}
                        </span>
                      </td>
                      <td>
                        {esCerrado ? (
                          <span className="badge-closed">🔒 Lote Cerrado</span>
                        ) : esObservado ? (
                          <span className="badge-warning">⚠️ Discrepancia</span>
                        ) : (
                          <button
                            type="button"
                            className={`btn-action-close ${!esAuditor ? 'btn-restricted' : ''}`}
                            onClick={() => handleCerrarLote(cert.folio_certificado)}
                            title={esAuditor ? "Aprobar y Cerrar Lote Fiscal (CU-05)" : "Acción reservada exclusivamente para Auditor nuam"}
                          >
                            {esAuditor ? 'Aprobar y Cerrar' : '🔒 Requiere Auditor'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
