import { useCallback, useEffect, useState } from 'react';
import { GitMerge } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Label, Textarea } from '../../components/ui/Input';
import { useToast } from '../../components/ui/useToast';
import { admin, getProposals } from '../../api/endpoints';
import type { Proposal } from '../../api/types';

export function AdminMerge() {
  const { push } = useToast();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [form, setForm] = useState({ name: '', description: '', how: '', time_estimate: '' });
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    try {
      const list = await getProposals();
      setProposals(list.filter((p) => p.status === 'votable'));
    } catch (err) {
      push('error', err instanceof Error ? err.message : String(err));
    }
  }, [push]);
  useEffect(() => {
    void reload();
  }, [reload]);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canMerge = selected.size >= 2 && form.name.trim() !== '' && form.description.trim() !== '';

  const onMerge = async () => {
    setSaving(true);
    try {
      await admin.mergeProposals({
        parent_ids: Array.from(selected),
        name: form.name,
        description: form.description,
        how: form.how || undefined,
        time_estimate: form.time_estimate || undefined,
      });
      push('success', 'Propuestas fusionadas');
      setSelected(new Set());
      setForm({ name: '', description: '', how: '', time_estimate: '' });
      await reload();
    } catch (err) {
      push('error', err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
          <GitMerge className="w-6 h-6" /> Fusionar propuestas
        </h1>
        <p className="text-sm text-fg-secondary mt-1">
          Selecciona dos o más propuestas votables y describe la propuesta resultante.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-5">
        <Card className="p-4 max-h-[60vh] overflow-y-auto">
          <h2 className="font-semibold mb-3">Propuestas votables ({proposals.length})</h2>
          <div className="space-y-2">
            {proposals.map((p) => (
              <label
                key={p.id}
                className="flex items-start gap-3 p-2 rounded-control hover:bg-surface-sunken cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="form-checkbox mt-0.5 text-primary rounded"
                  checked={selected.has(p.id)}
                  onChange={() => toggle(p.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-fg">{p.name}</div>
                  <div className="text-xs text-fg-muted line-clamp-2">{p.description}</div>
                </div>
              </label>
            ))}
          </div>
        </Card>

        <Card className="p-4 space-y-3 sticky top-20 self-start">
          <h2 className="font-semibold">Propuesta resultante ({selected.size} seleccionadas)</h2>
          <div>
            <Label htmlFor="merge-name" required>
              Nombre
            </Label>
            <Input
              id="merge-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="merge-desc" required>
              Descripción
            </Label>
            <Textarea
              id="merge-desc"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="merge-how">Cómo lo haríamos (opcional)</Label>
            <Textarea
              id="merge-how"
              rows={2}
              value={form.how}
              onChange={(e) => setForm({ ...form, how: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="merge-est">Estimación (opcional)</Label>
            <Input
              id="merge-est"
              value={form.time_estimate}
              onChange={(e) => setForm({ ...form, time_estimate: e.target.value })}
            />
          </div>
          <Button onClick={onMerge} disabled={!canMerge || saving} className="w-full">
            {saving ? 'Fusionando…' : `Fusionar ${selected.size} propuestas`}
          </Button>
        </Card>
      </div>
    </div>
  );
}
