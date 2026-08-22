import { useRef, useState } from 'react';
import { AlertCircle, Camera, Loader2, RotateCcw } from 'lucide-react';
import { optimizeImage } from '../lib/optimizeImage';

/**
 * Uploader que optimiza cualquier imagen en el navegador (WebP, o JPEG donde
 * el navegador no sabe codificar WebP) y expone un data URL. Se usa igual en
 * el formulario público y en el panel.
 *
 * Props: value (data URL o null), onChange(dataUrl|null), onFail(bool) para
 * avisar al formulario que la foto no se pudo preparar, error, disabled.
 */
export default function PhotoUploader({
  value,
  onChange,
  onFail,
  error,
  disabled,
  label = 'Foto del vehículo',
  hint = 'La foto aparece en la sección de competidores confirmados del sitio.',
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState('');
  const [meta, setMeta] = useState(null);

  const pick = () => inputRef.current?.click();

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setLocalError('');
    setBusy(true);
    try {
      const result = await optimizeImage(file);
      setMeta({ sizeKb: result.sizeKb, width: result.width, height: result.height });
      onChange(result.dataUrl);
      onFail?.(false);
    } catch (err) {
      setLocalError(err.message ?? 'No pudimos preparar esta foto. Intenta con otra.');
      onFail?.(true);
    } finally {
      setBusy(false);
    }
  };

  const clear = () => {
    setMeta(null);
    setLocalError('');
    onChange(null);
    onFail?.(false);
  };

  const combinedError = localError || error;

  return (
    <div>
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
          {label}
        </span>
        {value && !busy && (
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1 text-[11px] text-white/45 transition hover:text-racing-red"
          >
            <RotateCcw size={12} /> Quitar
          </button>
        )}
      </span>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        disabled={disabled || busy}
        className="hidden"
      />

      {value ? (
        <button
          type="button"
          onClick={pick}
          disabled={disabled || busy}
          className={`mt-2 group relative block w-full overflow-hidden border transition ${
            combinedError ? 'border-racing-red/70' : 'border-white/15 hover:border-white/40'
          }`}
        >
          <img
            src={value}
            alt="Foto del vehículo"
            className="h-56 w-full object-cover"
          />
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-black/60 px-3 py-2 text-xs text-white/80">
            <span className="inline-flex items-center gap-1.5">
              <Camera size={13} /> Cambiar foto
            </span>
            {meta && (
              <span className="text-white/50">
                {meta.width}×{meta.height} · {meta.sizeKb} KB
              </span>
            )}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={pick}
          disabled={disabled || busy}
          data-invalid={combinedError ? 'true' : undefined}
          className={`mt-2 flex h-56 w-full flex-col items-center justify-center gap-2 border border-dashed bg-racing-asphalt text-sm transition ${
            combinedError
              ? 'border-racing-red/70 text-white'
              : 'border-white/20 text-white/60 hover:border-white/40 hover:text-white'
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {busy ? (
            <>
              <Loader2 size={22} className="animate-spin text-racing-red" />
              <span>Optimizando foto…</span>
            </>
          ) : (
            <>
              <Camera size={26} />
              <span className="font-medium">Sube la foto de tu vehículo</span>
              <span className="text-[11px] text-white/40">Se ajusta sola para que pese poco</span>
            </>
          )}
        </button>
      )}

      {combinedError ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-racing-red">
          <AlertCircle size={13} /> {combinedError}
        </p>
      ) : (
        <p className="mt-1.5 text-xs text-white/40">{hint}</p>
      )}
    </div>
  );
}
