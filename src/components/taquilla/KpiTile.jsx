/** Tile de indicador pensado para celular: el monto nunca se sale de media pantalla. */
export default function KpiTile({ label, value, hint, hero = false, accent }) {
  return (
    <div className="surface-card h-full min-w-0 border border-white/10 bg-[#141414] px-4 py-4 sm:px-5">
      <span className="block text-[11px] uppercase leading-snug tracking-[0.18em] text-white/45 sm:text-xs">
        {label}
      </span>
      <p
        className={`mt-1 break-words font-semibold leading-none tabular-nums text-white ${
          hero ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'
        }`}
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
      {hint && <p className="mt-2 text-xs text-white/40">{hint}</p>}
    </div>
  );
}
