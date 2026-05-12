import { useCallback, useMemo, useState } from 'react';

export interface BulkSelection<T extends { id: number }> {
  selected: ReadonlySet<number>;
  size: number;
  isSelected: (id: number) => boolean;
  toggle: (id: number) => void;
  toggleAll: (items: T[]) => void;
  clear: () => void;
  allChecked: (items: T[]) => boolean;
  someChecked: (items: T[]) => boolean;
  ids: () => number[];
}

export function useBulkSelection<T extends { id: number }>(): BulkSelection<T> {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((items: T[]) => {
    setSelected((prev) => {
      const ids = items.map((i) => i.id);
      const all = ids.length > 0 && ids.every((id) => prev.has(id));
      const next = new Set(prev);
      if (all) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const helpers = useMemo(
    () => ({
      isSelected: (id: number) => selected.has(id),
      allChecked: (items: T[]) => items.length > 0 && items.every((i) => selected.has(i.id)),
      someChecked: (items: T[]) => items.some((i) => selected.has(i.id)),
      ids: () => Array.from(selected),
    }),
    [selected],
  );

  return {
    selected,
    size: selected.size,
    toggle,
    toggleAll,
    clear,
    ...helpers,
  };
}
