import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Edit2, EyeOff, Eye, Upload } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input, Label, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/useToast';
import { BulkBar } from '../../components/admin/BulkBar';
import { ProposalsSearch } from '../../components/admin/ProposalsSearch';
import { useBulkSelection } from '../../hooks/useBulkSelection';
import { usePeriod } from '../../hooks/usePeriod';
import { matches } from '../../lib/normalize';
import { admin, getProposals } from '../../api/endpoints';
import type { Proposal, ProposalStatus } from '../../api/types';

type Filter = 'all' | ProposalStatus;

const FILTER_LABEL: Record<Filter, string> = {
  all: 'Todas',
  votable: 'Votables',
  excluded: 'Excluidas',
  merged_parent: 'Padre fusión',
};

export function AdminProposals() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Proposal | null>(null);
  const [creating, setCreating] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const { push } = useToast();
  const { period } = usePeriod();
  const bulk = useBulkSelection<Proposal>();
  const liveRef = useRef<HTMLDivElement>(null);

  const isPreparacion = period?.state === 'preparacion';
  const checkboxesVisible = isPreparacion;

  const reload = useCallback(async () => {
    try {
      setProposals(await getProposals());
    } catch (err) {
      push('error', err instanceof Error ? err.message : String(err));
    }
  }, [push]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const visible = useMemo(
    () =>
      proposals.filter((p) => {
        if (filter !== 'all' && p.status !== filter) return false;
        if (query && !(matches(p.name, query) || matches(p.description, query))) return false;
        return true;
      }),
    [proposals, filter, query],
  );

  useEffect(() => {
    if (!liveRef.current) return;
    if (bulk.size === 0) liveRef.current.textContent = '';
    else
      liveRef.current.textContent = `${bulk.size} propuesta${bulk.size > 1 ? 's' : ''} seleccionada${bulk.size > 1 ? 's' : ''}`;
  }, [bulk.size]);

  const onToggleStatus = async (p: Proposal) => {
    try {
      if (p.status === 'votable') await admin.excludeProposal(p.id);
      else if (p.status === 'excluded') await admin.restoreProposal(p.id);
      else return;
      await reload();
    } catch (err) {
      push('error', err instanceof Error ? err.message : String(err));
    }
  };

  const onBulkExclude = async () => {
    if (bulk.size === 0) return;
    setBulkBusy(true);
    try {
      const result = await admin.bulkExclude(bulk.ids());
      if (result) {
        const msg = result.skipped.length
          ? `Excluidas ${result.affected} · omitidas ${result.skipped.length}`
          : `Excluidas ${result.affected}`;
        push('success', msg);
      }
      bulk.clear();
      await reload();
    } catch (err) {
      push('error', err instanceof Error ? err.message : String(err));
    } finally {
      setBulkBusy(false);
    }
  };

  const onBulkRestore = async () => {
    if (bulk.size === 0) return;
    setBulkBusy(true);
    try {
      const result = await admin.bulkRestore(bulk.ids());
      if (result) {
        const msg = result.skipped.length
          ? `Restauradas ${result.affected} · omitidas ${result.skipped.length}`
          : `Restauradas ${result.affected}`;
        push('success', msg);
      }
      bulk.clear();
      await reload();
    } catch (err) {
      push('error', err instanceof Error ? err.message : String(err));
    } finally {
      setBulkBusy(false);
    }
  };

  const allChecked = bulk.allChecked(visible);
  const someChecked = bulk.someChecked(visible);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="font-display text-2xl font-semibold">Propuestas</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" onClick={() => setImportOpen(true)} disabled={!isPreparacion}>
            <Upload className="w-4 h-4" /> Importar CSV
          </Button>
          <Button onClick={() => setCreating(true)} disabled={!isPreparacion}>
            <Plus className="w-4 h-4" /> Nueva propuesta
          </Button>
        </div>
      </header>

      <div className="flex items-center gap-3 flex-wrap">
        <ProposalsSearch value={query} onChange={setQuery} />
        <div className="flex gap-1 flex-wrap" role="tablist" aria-label="Filtrar por estado">
          {(Object.keys(FILTER_LABEL) as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-pill text-sm font-medium ${
                filter === f
                  ? 'bg-primary-soft text-primary-soft-text'
                  : 'bg-surface-sunken text-fg-secondary hover:bg-surface-sunken/70'
              }`}
            >
              {FILTER_LABEL[f]}
              {f === 'all' && <span className="text-fg-muted"> · {proposals.length}</span>}
            </button>
          ))}
        </div>
      </div>

      {checkboxesVisible && visible.length > 0 && (
        <label className="inline-flex items-center gap-2 text-sm text-fg-secondary px-2">
          <span className="prop-row-check">
            <input
              type="checkbox"
              checked={allChecked}
              ref={(el) => {
                if (el) el.indeterminate = !allChecked && someChecked;
              }}
              onChange={() => bulk.toggleAll(visible)}
              aria-label={
                allChecked ? 'Deseleccionar todas las visibles' : 'Seleccionar todas las visibles'
              }
            />
          </span>
          Seleccionar las {visible.length} visibles
        </label>
      )}

      <div className="space-y-2">
        {visible.length === 0 ? (
          <p className="text-fg-muted py-8 text-center">
            {query ? `Sin coincidencias para "${query}".` : 'Sin propuestas en este filtro.'}
          </p>
        ) : (
          visible.map((p) => {
            const isSelected = bulk.isSelected(p.id);
            return (
              <Card
                key={p.id}
                className={`p-4 flex items-start gap-3 ${isSelected ? 'bg-primary-soft border-primary/20' : ''}`}
              >
                {checkboxesVisible && (
                  <span className="prop-row-check mt-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => bulk.toggle(p.id)}
                      aria-label={`Seleccionar ${p.name}`}
                    />
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-medium text-fg">{p.name}</h2>
                    <StatusBadge status={p.status} />
                    {p.parent_ids.length > 0 && (
                      <Badge variant="primary">fusiona {p.parent_ids.join(', ')}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-fg-secondary mt-1 line-clamp-2">{p.description}</p>
                  {p.original_author_email && (
                    <p className="text-xs text-fg-muted mt-1 font-mono">
                      {p.original_author_email}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(p)}
                    disabled={!isPreparacion}
                  >
                    <Edit2 className="w-4 h-4" /> Editar
                  </Button>
                  {p.status === 'votable' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleStatus(p)}
                      disabled={!isPreparacion}
                    >
                      <EyeOff className="w-4 h-4" /> Excluir
                    </Button>
                  )}
                  {p.status === 'excluded' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleStatus(p)}
                      disabled={!isPreparacion}
                    >
                      <Eye className="w-4 h-4" /> Restaurar
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Live region para anuncios screen reader sobre selección */}
      <div ref={liveRef} role="status" aria-live="polite" aria-atomic="true" className="sr-only" />

      {/* Sticky bulk bar */}
      {checkboxesVisible && bulk.size > 0 && (
        <BulkBar
          count={bulk.size}
          onExclude={onBulkExclude}
          onRestore={onBulkRestore}
          onCancel={() => bulk.clear()}
          busy={bulkBusy}
        />
      )}

      {editing && (
        <EditModal
          proposal={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await reload();
          }}
        />
      )}
      {creating && (
        <CreateModal
          onClose={() => setCreating(false)}
          onCreated={async () => {
            setCreating(false);
            await reload();
          }}
        />
      )}
      {importOpen && (
        <ImportModal
          onClose={() => setImportOpen(false)}
          onImported={async () => {
            setImportOpen(false);
            await reload();
          }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ProposalStatus }) {
  if (status === 'votable') return <Badge variant="success">votable</Badge>;
  if (status === 'excluded') return <Badge variant="neutral">excluida</Badge>;
  return <Badge variant="primary">padre fusión</Badge>;
}

function EditModal({
  proposal,
  onClose,
  onSaved,
}: {
  proposal: Proposal;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { push } = useToast();
  const [form, setForm] = useState({
    name: proposal.name,
    description: proposal.description,
    how: proposal.how ?? '',
    time_estimate: proposal.time_estimate ?? '',
  });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await admin.editProposal(proposal.id, {
        name: form.name,
        description: form.description,
        how: form.how || undefined,
        time_estimate: form.time_estimate || undefined,
      });
      push('success', 'Propuesta actualizada');
      onSaved();
    } catch (err) {
      push('error', err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      open
      onClose={onClose}
      title={`Editar propuesta #${proposal.id}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </>
      }
    >
      <FormFields form={form} setForm={setForm} />
    </Modal>
  );
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { push } = useToast();
  const [form, setForm] = useState({ name: '', description: '', how: '', time_estimate: '' });
  const [saving, setSaving] = useState(false);
  const create = async () => {
    setSaving(true);
    try {
      await admin.createProposal({
        name: form.name,
        description: form.description,
        how: form.how || undefined,
        time_estimate: form.time_estimate || undefined,
      });
      push('success', 'Propuesta creada');
      onCreated();
    } catch (err) {
      push('error', err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      open
      onClose={onClose}
      title="Nueva propuesta"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={create} disabled={saving || !form.name || !form.description}>
            {saving ? 'Creando…' : 'Crear'}
          </Button>
        </>
      }
    >
      <FormFields form={form} setForm={setForm} />
    </Modal>
  );
}

interface FormState {
  name: string;
  description: string;
  how: string;
  time_estimate: string;
}

function FormFields({ form, setForm }: { form: FormState; setForm: (f: FormState) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="name" required>
          Nombre
        </Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="description" required>
          Descripción
        </Label>
        <Textarea
          id="description"
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="how">Cómo lo haríamos (opcional)</Label>
        <Textarea
          id="how"
          rows={2}
          value={form.how}
          onChange={(e) => setForm({ ...form, how: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="time_estimate">Estimación (opcional)</Label>
        <Input
          id="time_estimate"
          value={form.time_estimate}
          onChange={(e) => setForm({ ...form, time_estimate: e.target.value })}
          placeholder="ej: 5d, 2sem"
        />
      </div>
    </div>
  );
}

function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const { push } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const run = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await admin.importCsv(file);
      push('success', `Importadas ${res.imported}, omitidas ${res.skipped}`);
      onImported();
    } catch (err) {
      push('error', err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  };
  return (
    <Modal
      open
      onClose={onClose}
      title="Importar propuestas desde CSV"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={uploading}>
            Cancelar
          </Button>
          <Button onClick={run} disabled={!file || uploading}>
            {uploading ? 'Importando…' : 'Importar'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-fg-secondary">
          Sube el CSV exportado del formulario de Google. La importación es idempotente: re-importar
          no crea duplicados.
        </p>
        <Input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
    </Modal>
  );
}
