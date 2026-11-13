import React from 'react';

export type DataViewMode = 'list' | 'grid';

interface ViewToggleProps {
  value: DataViewMode;
  onChange: (value: DataViewMode) => void;
  label: string;
}

const ListIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const GridIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

export const ViewToggle: React.FC<ViewToggleProps> = ({
  value,
  onChange,
  label
}) => (
  <div className="view-toggle" role="group" aria-label={label}>
    <button
      type="button"
      className={`view-toggle-button ${value === 'list' ? 'is-active' : ''}`}
      onClick={() => onChange('list')}
      aria-pressed={value === 'list'}
      aria-label="Mostrar vista de lista"
      title="Vista de lista"
    >
      <ListIcon />
    </button>
    <button
      type="button"
      className={`view-toggle-button ${value === 'grid' ? 'is-active' : ''}`}
      onClick={() => onChange('grid')}
      aria-pressed={value === 'grid'}
      aria-label="Mostrar vista de cuadros"
      title="Vista de cuadros"
    >
      <GridIcon />
    </button>
  </div>
);
