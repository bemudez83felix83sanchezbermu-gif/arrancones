import { useState } from 'react';
import { Eye, EyeOff, Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { BUTTON, EmptyState, INPUT, Modal, Panel } from '../admin/ui';
import { formatPesos, validateTicketType } from '../../../shared/taquilla';

const PRESETS = [
  { name: 'General', price: '' },
  { name: 'Niños', price: '' },
  { name: 'Cortesía', price: '0' },
];

const LABEL = 'block text-xs uppercase tracking-[0.18em] text-white/45';

export default function PricesView({ types, offline, onAdd, onEdit, onRemove }) {
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [removing, setRemoving] = useState(null);

  const open = (draft) => {
    setErrors({});
    setMessage('');
    setForm(draft);
  };

  const openType = (type) =>
    open({
      id: type.id,
      name: type.name,
      price: String(type.price),
      sort_order: String(type.sort_order),
      active: type.active,
    });

  const save = async (event) => {
    event.preventDefault();
    const check = validateTicketType(form);
    if (!check.ok) {
      setErrors(check.errors);
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      if (form.id) await onEdit(form.id, check.value);
      else await onAdd(check.value);
      setForm(null);
    } catch (err) {
      setErrors(err.fields ?? {});
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (type) => {
    setMessage('');
    try {
      await onEdit(type.id, { active: !type.active });
    } catch (err) {
      setMessage(err.message);
    }
  };

  const remove = async () => {
    setBusy(true);
    setMessage('');
    try {
      await onRemove(removing.id);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-4">
      <Panel
        title="Precios de entrada"
        subtitle="Lo que aparece en la pantalla de venta. Cambiar un precio no altera las ventas ya registradas."
        action={
          <button
            type="button"
            className={BUTTON.primary}
            disabled={offline}
            onClick={() => open({ name: '', price: '', sort_order: '', active: true })}
          >
            <Plus size={15} /> Nueva entrada
          </button>
        }
      >
        {offline && (
          <p className="mb-4 text-sm text-amber-300">Sin señal: los precios se pueden editar al volver la conexión.</p>
        )}
        {message && !form && (
          <p className="mb-4 border border-racing-red/40 bg-racing-red/10 px-3 py-2 text-sm text-white">{message}</p>
        )}

        {types.length ? (
          <ul className="divide-y divide-white/5">
            {types.map((type) => (
              <li key={type.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <div className="min-w-0 flex-1">
                  <p className={`font-medium ${type.active ? 'text-white' : 'text-white/40 line-through'}`}>
                    {type.name}
                  </p>
                  <p className="text-xs text-white/45">
                    {type.active ? 'Visible en la taquilla' : 'Oculta en la taquilla'}
                  </p>
                </div>
                <span className="text-xl font-semibold tabular-nums text-white">
                  {type.price ? formatPesos(type.price) : 'Cortesía'}
                </span>
                <div className="flex w-full justify-end gap-1 sm:w-auto">
                  <button type="button" className={BUTTON.subtle} onClick={() => openType(type)} disabled={offline}>
                    <Pencil size={13} /> Editar
                  </button>
                  <button type="button" className={BUTTON.subtle} onClick={() => toggle(type)} disabled={offline}>
                    {type.active ? <EyeOff size={13} /> : <Eye size={13} />}
                    {type.active ? 'Ocultar' : 'Mostrar'}
                  </button>
                  <button
                    type="button"
                    className={BUTTON.subtle}
                    onClick={() => setRemoving(type)}
                    disabled={offline}
                    aria-label={`Eliminar ${type.name}`}
                    title="Eliminar"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Tags}
            title="Sin tipos de entrada"
            message="Crea al menos uno para empezar a vender. Puedes partir de estos:"
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    className={BUTTON.ghost}
                    disabled={offline}
                    onClick={() => open({ ...preset, sort_order: '', active: true })}
                  >
                    <Plus size={14} /> {preset.name}
                  </button>
                ))}
              </div>
            }
          />
        )}
      </Panel>

      <Modal
        open={Boolean(form)}
        onClose={() => setForm(null)}
        title={form?.id ? 'Editar entrada' : 'Nueva entrada'}
        subtitle="Precio por persona, en pesos"
      >
        {form && (
          <form onSubmit={save} className="space-y-4" noValidate>
            <label className={LABEL}>
              Nombre
              <input
                className={`${INPUT} mt-1.5 normal-case tracking-normal`}
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Ej. General, Niños, Cortesía"
                maxLength={40}
                autoFocus
              />
              {errors.name && <span className="mt-1 block normal-case tracking-normal text-racing-red">{errors.name}</span>}
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className={LABEL}>
                Precio
                <input
                  className={`${INPUT} mt-1.5 tabular-nums`}
                  inputMode="decimal"
                  value={form.price}
                  onChange={(event) => setForm({ ...form, price: event.target.value })}
                  placeholder="0 = cortesía"
                />
                {errors.price && (
                  <span className="mt-1 block normal-case tracking-normal text-racing-red">{errors.price}</span>
                )}
              </label>
              <label className={LABEL}>
                Orden
                <input
                  className={`${INPUT} mt-1.5 tabular-nums`}
                  inputMode="numeric"
                  value={form.sort_order}
                  onChange={(event) => setForm({ ...form, sort_order: event.target.value })}
                  placeholder="Automático"
                />
                {errors.sort_order && (
                  <span className="mt-1 block normal-case tracking-normal text-racing-red">{errors.sort_order}</span>
                )}
              </label>
            </div>

            <label className="flex items-center gap-2.5 text-sm text-white/75">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) => setForm({ ...form, active: event.target.checked })}
                className="h-4 w-4 accent-racing-red"
              />
              Visible en la pantalla de venta
            </label>

            {message && <p className="text-sm text-racing-red">{message}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className={BUTTON.ghost} onClick={() => setForm(null)}>
                Cancelar
              </button>
              <button type="submit" className={BUTTON.primary} disabled={busy}>
                {busy ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={Boolean(removing)} onClose={() => setRemoving(null)} title="Eliminar entrada">
        <p className="text-sm text-white/70">
          ¿Eliminar <span className="text-white">{removing?.name}</span>? Si ya tiene ventas no se
          puede borrar; en ese caso ocúltala para que deje de aparecer.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className={BUTTON.ghost} onClick={() => setRemoving(null)}>
            Cancelar
          </button>
          <button type="button" className={BUTTON.danger} onClick={remove} disabled={busy}>
            {busy ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
