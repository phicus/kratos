import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ActionCardContextual } from '@/components/admin/ActionCardContextual';

const MATRIX = {
  preparacion: ['Importar CSV', 'Crear propuesta', 'Fusionar duplicadas', 'Abrir votación'],
  abierto: ['Ver participación', 'Cerrar votación', 'Ver auditoría'],
  cerrado: ['Descargar resultados', 'Ver ranking', 'Reiniciar votación', 'Ver auditoría'],
};

describe('ActionCardContextual', () => {
  for (const [state, expected] of Object.entries(MATRIX) as [keyof typeof MATRIX, string[]][]) {
    it(`renderiza exactamente los CTAs del estado "${state}"`, () => {
      render(<ActionCardContextual state={state} onAction={() => {}} />);
      // Los CTAs del estado actual están presentes
      for (const label of expected) {
        expect(screen.getByRole('button', { name: new RegExp(label, 'i') })).toBeInTheDocument();
      }
      // Y los de OTROS estados NO están (no basta con disabled — el spec exige no estar en DOM)
      const otherLabels = Object.entries(MATRIX)
        .filter(([s]) => s !== state)
        .flatMap(([, labels]) => labels)
        .filter((l) => !expected.includes(l));
      for (const label of otherLabels) {
        expect(screen.queryByRole('button', { name: new RegExp(`^${label}$`, 'i') })).toBeNull();
      }
    });
  }

  it('invoca onAction con el id correcto al pulsar un CTA', () => {
    const onAction = vi.fn();
    render(<ActionCardContextual state="abierto" onAction={onAction} />);
    fireEvent.click(screen.getByRole('button', { name: /ver participación/i }));
    expect(onAction).toHaveBeenCalledWith('part');
    fireEvent.click(screen.getByRole('button', { name: /cerrar votación/i }));
    expect(onAction).toHaveBeenCalledWith('close');
  });
});
