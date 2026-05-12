import { useEffect, useState } from 'react';
import { ScoreSelectorChips } from './ScoreSelectorChips';
import { ScoreSelectorSlider } from './ScoreSelectorSlider';

interface Props {
  value: number | null;
  onChange: (n: number) => void;
  ariaLabel: string;
  disabled?: boolean;
}

/** Wrapper responsive: chips ≥640px, slider <640px. */
export function ScoreSelector(props: Props) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 639px)').matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 639px)');
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return isMobile ? <ScoreSelectorSlider {...props} /> : <ScoreSelectorChips {...props} />;
}
