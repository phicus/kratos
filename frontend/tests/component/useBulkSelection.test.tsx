import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useBulkSelection } from '@/hooks/useBulkSelection';

interface Item {
  id: number;
}

const items: Item[] = [{ id: 1 }, { id: 2 }, { id: 3 }];

describe('useBulkSelection', () => {
  it('toggle añade y quita ids', () => {
    const { result } = renderHook(() => useBulkSelection<Item>());
    act(() => result.current.toggle(1));
    expect(result.current.size).toBe(1);
    expect(result.current.isSelected(1)).toBe(true);
    act(() => result.current.toggle(1));
    expect(result.current.size).toBe(0);
  });

  it('toggleAll selecciona todos si ninguno y los quita si todos', () => {
    const { result } = renderHook(() => useBulkSelection<Item>());
    act(() => result.current.toggleAll(items));
    expect(result.current.size).toBe(3);
    expect(result.current.allChecked(items)).toBe(true);
    act(() => result.current.toggleAll(items));
    expect(result.current.size).toBe(0);
    expect(result.current.allChecked(items)).toBe(false);
  });

  it('clear vacía el set', () => {
    const { result } = renderHook(() => useBulkSelection<Item>());
    act(() => {
      result.current.toggle(1);
      result.current.toggle(2);
    });
    expect(result.current.size).toBe(2);
    act(() => result.current.clear());
    expect(result.current.size).toBe(0);
  });

  it('someChecked y allChecked reflejan el estado parcial', () => {
    const { result } = renderHook(() => useBulkSelection<Item>());
    act(() => result.current.toggle(1));
    expect(result.current.someChecked(items)).toBe(true);
    expect(result.current.allChecked(items)).toBe(false);
  });

  it('ids() devuelve los seleccionados como array', () => {
    const { result } = renderHook(() => useBulkSelection<Item>());
    act(() => {
      result.current.toggle(3);
      result.current.toggle(1);
    });
    expect(new Set(result.current.ids())).toEqual(new Set([1, 3]));
  });
});
