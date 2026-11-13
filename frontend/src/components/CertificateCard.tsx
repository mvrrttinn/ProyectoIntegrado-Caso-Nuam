import React from 'react';
import type { CertificadoDividendo } from '../types';
import { useIntersection } from '../hooks/useIntersection';

interface CertificateCardProps {
  certificado: CertificadoDividendo;
  montoFormateado: string;
  onInspect: () => void;
  children?: React.ReactNode;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  certificado,
  montoFormateado,
  onInspect,
  children
}) => {
  const [cardRef, isVisible] = useIntersection<HTMLElement>();
  const factor = certificado.primer_factor;
  const esCuadreExacto = factor ? factor.es_cuadre_exacto : true;

  return (
    <article
      ref={cardRef}
      className={`certificate-card ${isVisible ? 'is-visible' : ''}`}
    >
      <div className="certificate-card-header">
        <div>
          <span className="certificate-card-label">Folio certificado</span>
          <strong className="certificate-card-folio font-mono">
            {certificado.folio_certificado}
          </strong>
        </div>
        <span className={`status-pill status-${certificado.estado_proceso.toLowerCase()}`}>
          {certificado.estado_proceso}
        </span>
      </div>

      <dl className="certificate-card-data">
        <div>
          <dt>Emisor</dt>
          <dd>{certificado.razon_social_emisor}</dd>
        </div>
        <div>
          <dt>RUT emisor</dt>
          <dd className="font-mono">
            {certificado.rut_emisor_str || certificado.rut_emisor}
          </dd>
        </div>
        <div>
          <dt>Monto bruto</dt>
          <dd className="font-mono">{montoFormateado}</dd>
        </div>
        <div>
          <dt>Suma proporciones</dt>
          <dd>
            <span className={`badge-cuadre ${esCuadreExacto ? 'cuadre-ok' : 'cuadre-error'}`}>
              {factor ? factor.suma_proporciones : '1.000000'}
            </span>
          </dd>
        </div>
      </dl>

      <div className="certificate-card-footer">
        <button type="button" className="btn-action-sm" onClick={onInspect}>
          Inspeccionar
        </button>
        {children}
      </div>
    </article>
  );
};
