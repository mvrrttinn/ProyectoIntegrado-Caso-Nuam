import React, { useState, useRef } from 'react';
import type { UsuarioAutenticado, UploadResponseSuccess, UploadResponseError } from '../types';
import { api } from '../services/api';

interface UploadCsvViewProps {
  usuario: UsuarioAutenticado;
  onSuccess: () => void;
}

export const UploadCsvView: React.FC<UploadCsvViewProps> = ({ usuario, onSuccess }) => {
  const [dragOver, setDragOver] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [progreso, setProgreso] = useState<number | null>(null);
  const [faseBpmn, setFaseBpmn] = useState<string>('');
  const [resultadoExitoso, setResultadoExitoso] = useState<UploadResponseSuccess | null>(null);
  const [resultadoError, setResultadoError] = useState<UploadResponseError | null>(null);
  const [cargando, setCargando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const esAuditor = usuario.rol === 'Auditor nuam';

  // Plantillas CSV de prueba integradas
  const CSV_VALIDO = `folio_certificado,rut_emisor,razon_social,anio_tributario,fecha_pago,monto_total_bruto,monto_afecto,monto_exento,monto_credito
LT-2026-0045,96.505.760-4,Colbun S.A.,2026,2026-04-20,1000000000.00,700000000.00,300000000.00,100000000.00
LT-2026-0046,90.222.000-2,Empresas CMPC S.A.,2026,2026-04-22,500000000.00,400000000.00,100000000.00,50000000.00`;

  const CSV_DESCUADRE = `folio_certificado,rut_emisor,razon_social,anio_tributario,fecha_pago,monto_total_bruto,monto_afecto,monto_exento,monto_credito
LT-2026-0047,91.564.000-8,Falabella S.A.,2026,2026-04-25,1000000000.00,699999000.00,300000000.00,50000000.00`;

  const CSV_SINTACTICO = `folio_certificado,rut_emisor,anio_tributario,monto_total_bruto
LT-2026-0048,97.004.000-5,2026,2000000000.00`;

  const descargarPlantilla = (contenido: string, nombreArchivo: string) => {
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', nombreArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProcesar = async (archivoAProcesar: File | string) => {
    if (esAuditor) {
      alert("Acceso denegado: El rol 'Auditor nuam' solo tiene facultades de revisión y no puede ingresar nóminas masivas.");
      return;
    }

    setCargando(true);
    setResultadoExitoso(null);
    setResultadoError(null);
    setProgreso(15);
    setFaseBpmn('Lectura de archivo y sanitización OWASP A03...');

    await new Promise((r) => setTimeout(r, 300));
    setProgreso(40);
    setFaseBpmn('Compuerta 1 BPMN: Verificación de estructura y sintaxis CSV...');

    await new Promise((r) => setTimeout(r, 400));
    setProgreso(75);
    setFaseBpmn('Compuerta 2 BPMN: Validación algorítmica preventiva de consistencia fiscal (DJ 1949)...');

    try {
      const resp = await api.uploadCsv(archivoAProcesar);
      setProgreso(100);
      setFaseBpmn('Completado');

      if (resp.status === 201) {
        setResultadoExitoso(resp.data as UploadResponseSuccess);
      } else {
        setResultadoError(resp.data as UploadResponseError);
      }
    } catch (err: any) {
      setProgreso(100);
      setResultadoError({
        error: 'ERROR_CONEXION',
        mensaje: err.message || 'Error de comunicación con el backend.'
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="upload-view-container">
      <div className="view-header">
        <div>
          <h2 className="view-title">Carga Masiva de Nóminas y Dividendos</h2>
          <p className="view-subtitle">
            Ingesta automatizada de nóminas tributarias con compuertas de decisión BPMN 2.0 y firma criptográfica SHA-256.
          </p>
        </div>
      </div>

      {esAuditor && (
        <div className="alert-banner alert-warning mb-6">
          <span className="alert-icon">🔒</span>
          <div>
            <strong>Modo Solo Lectura (Auditor nuam):</strong> Su rol normativo no tiene autorización para realizar cargas de archivos. Puede probar las descargas de plantillas para auditoría técnica.
          </div>
        </div>
      )}

      {/* Zona de Descarga de Plantillas de Prueba */}
      <div className="templates-bar">
        <span className="templates-label">Plantillas oficiales de prueba:</span>
        <button
          type="button"
          className="btn-template template-valid"
          onClick={() => descargarPlantilla(CSV_VALIDO, 'nomina_valida_2026.csv')}
        >
          📥 Descargar CSV Válido (HTTP 201)
        </button>
        <button
          type="button"
          className="btn-template template-invalid"
          onClick={() => descargarPlantilla(CSV_DESCUADRE, 'nomina_descuadre_0.999999.csv')}
        >
          📥 Descargar CSV con Descuadre (HTTP 422)
        </button>
        <button
          type="button"
          className="btn-template template-syntax"
          onClick={() => descargarPlantilla(CSV_SINTACTICO, 'nomina_error_sintactico.csv')}
        >
          📥 Descargar CSV Error Columnas (HTTP 400)
        </button>
      </div>

      {/* Zona Drag & Drop */}
      <div
        className={`dropzone-box ${dragOver ? 'dropzone-active' : ''} ${esAuditor ? 'dropzone-disabled' : ''}`}
        onDragOver={(e) => { e.preventDefault(); if (!esAuditor) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (esAuditor) return;
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            setArchivoSeleccionado(file);
            handleProcesar(file);
          }
        }}
        onClick={() => {
          if (!esAuditor && fileInputRef.current) fileInputRef.current.click();
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden-file-input"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              const file = e.target.files[0];
              setArchivoSeleccionado(file);
              handleProcesar(file);
            }
          }}
        />
        <div className="dropzone-content">
          <span className="dropzone-icon">📁</span>
          <h3 className="dropzone-title">
            {archivoSeleccionado ? archivoSeleccionado.name : 'Arrastra aquí el archivo CSV de nómina o haz clic para explorar'}
          </h3>
          <p className="dropzone-hint">
            Formato UTF-8 delimitado por comas o punto y coma (Máximo 50 MB)
          </p>
        </div>
      </div>

      {/* Acciones directas de prueba rápida en 1 clic */}
      {!esAuditor && (
        <div className="quick-test-actions mt-4">
          <span className="text-sm font-semibold text-muted">Ejecución directa en 1 clic:</span>
          <button
            type="button"
            className="btn-pill pill-success"
            disabled={cargando}
            onClick={() => handleProcesar(CSV_VALIDO)}
          >
            ▶ Simular Carga Válida (Probar HTTP 201)
          </button>
          <button
            type="button"
            className="btn-pill pill-danger"
            disabled={cargando}
            onClick={() => handleProcesar(CSV_DESCUADRE)}
          >
            ▶ Simular Descuadre (Probar HTTP 422)
          </button>
          <button
            type="button"
            className="btn-pill pill-warning"
            disabled={cargando}
            onClick={() => handleProcesar(CSV_SINTACTICO)}
          >
            ▶ Simular Error Sintáctico (Probar HTTP 400)
          </button>
        </div>
      )}

      {/* Barra de Progreso BPMN */}
      {progreso !== null && (
        <div className="bpmn-progress-container mt-6">
          <div className="progress-info">
            <span className="progress-phase font-semibold">{faseBpmn}</span>
            <span className="progress-pct font-mono font-bold">{progreso}%</span>
          </div>
          <div className="progress-bar-track">
            <div
              className={`progress-bar-fill ${resultadoError ? 'fill-danger' : 'fill-primary'}`}
              style={{ width: `${progreso}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Resultado Exitoso (HTTP 201) */}
      {resultadoExitoso && (
        <div className="result-card result-success mt-6">
          <div className="result-header">
            <span className="result-icon">✅</span>
            <div>
              <h3 className="result-title">Lote Procesado e Integrado Exitosamente (HTTP 201 Created)</h3>
              <p className="result-desc">{resultadoExitoso.mensaje}</p>
            </div>
          </div>
          <div className="result-meta-grid">
            <div><strong>Total Registros:</strong> {resultadoExitoso.total_registros}</div>
            <div><strong>Cuadre Aritmético:</strong> {resultadoExitoso.cuadre_proporciones}</div>
            <div><strong>Certificados:</strong> {resultadoExitoso.certificados.join(', ')}</div>
            <div><strong>Firma Digital:</strong> SHA-256 persistido en TB_AUDIT_LOGS</div>
          </div>
          <div className="mt-4">
            <button type="button" className="btn-primary" onClick={onSuccess}>
              Ver en Dashboard / Repositorio
            </button>
          </div>
        </div>
      )}

      {/* Resultado Error de Consistencia Fiscal (HTTP 422) */}
      {resultadoError && (
        <div className="result-card result-danger mt-6">
          <div className="result-header">
            <span className="result-icon">🛑</span>
            <div>
              <h3 className="result-title">
                {resultadoError.compuerta_bpmn === 'COMPUERTA_2_ALGORITMO_DJ'
                  ? 'Rechazo por Descuadre Fiscal (HTTP 422 Unprocessable Entity)'
                  : 'Error en Ingesta de Lote'}
              </h3>
              <p className="result-desc">{resultadoError.mensaje}</p>
            </div>
          </div>

          {resultadoError.discrepancias && resultadoError.discrepancias.length > 0 && (
            <div className="discrepancies-table-wrapper mt-4">
              <h4 className="table-caption text-danger">Bandeja de Discrepancias Detectadas (Compuerta 2 BPMN):</h4>
              <table className="nuam-table table-bordered">
                <thead>
                  <tr>
                    <th>Fila</th>
                    <th>Folio</th>
                    <th>Tipo Error</th>
                    <th>Suma Obtenida</th>
                    <th>Esperada</th>
                    <th>Diferencia</th>
                    <th>Descripción Detallada</th>
                  </tr>
                </thead>
                <tbody>
                  {resultadoError.discrepancias.map((disc, i) => (
                    <tr key={i} className="row-discrepancy">
                      <td className="font-mono">{disc.fila}</td>
                      <td className="font-mono font-bold">{disc.folio}</td>
                      <td><span className="badge-error">{disc.tipo_error}</span></td>
                      <td className="font-mono font-bold text-danger">{disc.suma_obtenida || 'N/A'}</td>
                      <td className="font-mono">1.000000</td>
                      <td className="font-mono text-danger">{disc.diferencia || 'N/A'}</td>
                      <td className="text-sm">{disc.descripcion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="alert-box-notice mt-3">
                ℹ️ <strong>Acción del Sistema:</strong> El lote completo fue rechazado transaccionalmente bajo <code>transaction.atomic()</code> para garantizar que ninguna cifra inconsistente ingrese al repositorio fiscal.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
