import { Input } from '../ui/Input';
import { IconSearch, IconXCircle } from './iconMap';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function ProposalsSearch({ value, onChange }: Props) {
  return (
    <div className="prop-search">
      <span className="prop-search-icon">
        <IconSearch size={16} />
      </span>
      <Input
        type="search"
        placeholder="Buscar por nombre o descripción…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Buscar propuesta"
      />
      {value && (
        <button
          type="button"
          className="prop-search-clear"
          aria-label="Limpiar búsqueda"
          onClick={() => onChange('')}
        >
          <IconXCircle size={16} />
        </button>
      )}
    </div>
  );
}
