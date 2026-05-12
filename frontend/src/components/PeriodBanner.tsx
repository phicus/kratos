import { Clock, PlayCircle, Lock } from 'lucide-react';
import { Banner } from './ui/Banner';
import type { PeriodState } from '../api/types';

interface Props {
  state: PeriodState;
  className?: string;
}

const ICON_SIZE = 'w-5 h-5';

export function PeriodBanner({ state, className }: Props) {
  if (state === 'preparacion') {
    return (
      <Banner
        tone="warning"
        icon={<Clock className={ICON_SIZE} />}
        title="Periodo en preparación"
        className={className}
      >
        Aún se están revisando las propuestas. La votación abrirá próximamente.
      </Banner>
    );
  }
  if (state === 'abierto') {
    return (
      <Banner
        tone="info"
        icon={<PlayCircle className={ICON_SIZE} />}
        title="Periodo abierto"
        className={className}
      >
        Puedes puntuar todas las propuestas y enviar tu papeleta.
      </Banner>
    );
  }
  return (
    <Banner
      tone="neutral"
      icon={<Lock className={ICON_SIZE} />}
      title="Periodo cerrado"
      className={className}
    >
      La votación ha terminado. Los resultados ya están disponibles.
    </Banner>
  );
}
