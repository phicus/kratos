import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import { Button } from '../ui/Button';
import {
  IconDownload,
  IconList,
  IconLock,
  IconMerge,
  IconPlay,
  IconPlus,
  IconRefresh,
  IconSparkles,
  IconTrophy,
  IconUpload,
  IconUsers,
} from './iconMap';
import type { PeriodState } from '../../api/types';

export type ActionId =
  | 'import'
  | 'create'
  | 'merge'
  | 'open'
  | 'part'
  | 'close'
  | 'audit'
  | 'csv'
  | 'ranking'
  | 'reset';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface Cta {
  id: ActionId;
  label: string;
  icon: ComponentType<LucideProps>;
  variant: Variant;
}

const CTA_MATRIX: Record<PeriodState, Cta[]> = {
  preparacion: [
    { id: 'import', label: 'Importar CSV', icon: IconUpload, variant: 'primary' },
    { id: 'create', label: 'Crear propuesta', icon: IconPlus, variant: 'secondary' },
    { id: 'merge', label: 'Fusionar duplicadas', icon: IconMerge, variant: 'secondary' },
    { id: 'open', label: 'Abrir votación', icon: IconPlay, variant: 'secondary' },
  ],
  abierto: [
    { id: 'part', label: 'Ver participación', icon: IconUsers, variant: 'primary' },
    { id: 'close', label: 'Cerrar votación', icon: IconLock, variant: 'secondary' },
    { id: 'audit', label: 'Ver auditoría', icon: IconList, variant: 'ghost' },
  ],
  cerrado: [
    { id: 'csv', label: 'Descargar resultados', icon: IconDownload, variant: 'primary' },
    { id: 'ranking', label: 'Ver ranking', icon: IconTrophy, variant: 'secondary' },
    { id: 'reset', label: 'Reiniciar votación', icon: IconRefresh, variant: 'danger' },
    { id: 'audit', label: 'Ver auditoría', icon: IconList, variant: 'ghost' },
  ],
};

interface Props {
  state: PeriodState;
  onAction: (id: ActionId) => void;
}

export function ActionCardContextual({ state, onAction }: Props) {
  const items = CTA_MATRIX[state];
  return (
    <div className="adm-actions" aria-labelledby="adm-actions-h">
      <div className="adm-actions-head" id="adm-actions-h">
        <IconSparkles size={12} />
        <span>Próximos pasos</span>
      </div>
      <div className="adm-actions-row">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Button
              key={it.id}
              variant={it.variant}
              size="md"
              onClick={() => onAction(it.id)}
            >
              <Icon size={16} />
              {it.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
