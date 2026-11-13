import React from 'react';
import nuamLogo from '../assets/nuam-logo.png';

interface FloatingLoaderProps {
  mensaje?: string;
}

export const FloatingLoader: React.FC<FloatingLoaderProps> = ({ mensaje }) => {
  return (
    <div className="nuam-floating-loader" role="status" aria-live="polite">
      <div className="loader-icon-container">
        <div className="loader-spinner-ring" />
        <img src={nuamLogo} alt="nuam" className="loader-nuam-img" />
      </div>
      <div className="loader-content">
        <span className="loader-brand-tag">nuam EXCHANGE</span>
        <span className="loader-text">{mensaje || 'Procesando operación en la nube...'}</span>
      </div>
    </div>
  );
};
