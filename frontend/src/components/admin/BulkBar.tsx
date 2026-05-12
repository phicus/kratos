import { Button } from '../ui/Button';
import { IconCheck, IconEyeOff, IconRefresh, IconXCircle } from './iconMap';

interface Props {
  count: number;
  onExclude: () => void;
  onRestore: () => void;
  onCancel: () => void;
  busy?: boolean;
}

export function BulkBar({ count, onExclude, onRestore, onCancel, busy }: Props) {
  return (
    <div className="bulk-bar" role="region" aria-label="Acciones masivas">
      <span>
        <IconCheck size={14} className="inline mr-1" />
        <strong>{count}</strong> seleccionada{count > 1 ? 's' : ''}
      </span>
      <Button variant="secondary" size="sm" onClick={onExclude} disabled={busy}>
        <IconEyeOff size={14} />
        Excluir
      </Button>
      <Button variant="secondary" size="sm" onClick={onRestore} disabled={busy}>
        <IconRefresh size={14} />
        Restaurar
      </Button>
      <Button variant="ghost" size="sm" onClick={onCancel} aria-label="Cancelar selección">
        <IconXCircle size={14} />
        Cancelar
      </Button>
    </div>
  );
}
