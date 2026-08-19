import { useCallback, useState } from 'react';

/* Los separadores entre marcas son huecos de 2px que dejan ver la superficie
   del panel: nunca un borde alrededor de la marca. */
const GRID = 'rgba(255,255,255,0.07)';

function useTooltip() {
  const [tip, setTip] = useState(null);

  const show = useCallback((event, content) => {
    setTip({ content, x: event.clientX, y: event.clientY });
  }, []);
  const move = useCallback((event) => {
    setTip((prev) => (prev ? { ...prev, x: event.clientX, y: event.clientY } : prev));
  }, []);
  const hide = useCallback(() => setTip(null), []);

  const node = tip ? (
    <div
      className="pointer-events-none fixed z-50 whitespace-nowrap border border-white/15 bg-[#0A0A0A] px-3 py-2 text-xs text-white shadow-xl"
      style={{ left: Math.min(tip.x + 14, window.innerWidth - 200), top: tip.y - 10 }}
    >
      {tip.content}
    </div>
  ) : null;

  return { show, move, hide, node };
}

export function Legend({ items }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2 text-xs text-white/60">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: item.color }}
            aria-hidden="true"
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/**
 * Barras horizontales. Cada fila puede ser una sola marca o varios segmentos
 * apilados separados por 2px del color de la superficie.
 */
export function Bars({ rows, max, unit = '', emptyLabel = 'Sin datos' }) {
  const { show, move, hide, node } = useTooltip();
  const top = max ?? Math.max(1, ...rows.map((row) => row.total));

  if (!rows.length) return <p className="py-8 text-center text-sm text-white/35">{emptyLabel}</p>;

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[minmax(90px,26%)_1fr_auto] items-center gap-3">
          <span className="truncate text-sm text-white/70" title={row.label}>
            {row.label}
          </span>
          <div className="flex h-[18px] items-stretch" style={{ background: GRID }}>
            {row.total === 0 ? null : (
              <div className="flex h-full" style={{ width: `${(row.total / top) * 100}%` }}>
                {(row.segments ?? [{ value: row.total, color: row.color, label: row.label }]).map(
                  (segment, index, list) =>
                    segment.value > 0 && (
                      <div
                        key={segment.label}
                        onMouseEnter={(event) =>
                          show(
                            event,
                            `${row.label} · ${segment.label}: ${segment.value}${unit ? ` ${unit}` : ''}`,
                          )
                        }
                        onMouseMove={move}
                        onMouseLeave={hide}
                        style={{
                          width: `${(segment.value / row.total) * 100}%`,
                          background: segment.color,
                          marginRight: index < list.length - 1 ? 2 : 0,
                          borderTopRightRadius: index === list.length - 1 ? 4 : 0,
                          borderBottomRightRadius: index === list.length - 1 ? 4 : 0,
                        }}
                      />
                    ),
                )}
              </div>
            )}
          </div>
          <span className="w-10 text-right text-sm font-semibold tabular-nums text-white">
            {row.total}
          </span>
        </div>
      ))}
      {node}
    </div>
  );
}

/** Columnas por día. Etiqueta directa solo en el máximo y en el último día. */
export function Columns({ points, color, unit = 'registros' }) {
  const { show, move, hide, node } = useTooltip();
  if (!points.length) {
    return <p className="py-8 text-center text-sm text-white/35">Todavía no hay registros</p>;
  }

  const max = Math.max(1, ...points.map((point) => point.count));
  const width = points.length > 24 ? undefined : 24;

  return (
    <div>
      <div className="relative h-44">
        {[0, 0.5, 1].map((ratio) => (
          <div
            key={ratio}
            className="absolute inset-x-0 flex items-center"
            style={{ bottom: `${ratio * 100}%` }}
          >
            <span className="w-8 shrink-0 text-right text-[10px] tabular-nums text-white/35">
              {Math.round(max * ratio)}
            </span>
            <span className="ml-2 h-px flex-1" style={{ background: GRID }} />
          </div>
        ))}

        <div className="absolute inset-y-0 left-10 right-0 flex items-end gap-[2px]">
          {points.map((point) => (
            <div
              key={point.key}
              className="group flex h-full flex-1 items-end justify-center"
              style={{ maxWidth: width }}
              onMouseEnter={(event) =>
                show(event, `${formatDayLabel(point.key, true)}: ${point.count} ${unit}`)
              }
              onMouseMove={move}
              onMouseLeave={hide}
            >
              <div
                className="w-full transition-opacity group-hover:opacity-80"
                style={{
                  height: `${Math.max(point.count === 0 ? 0 : 3, (point.count / max) * 100)}%`,
                  background: color,
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                  minWidth: 6,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="ml-10 mt-2 flex justify-between text-[10px] uppercase tracking-wider text-white/35">
        <span>{formatDayLabel(points[0].key)}</span>
        {points.length > 2 && <span>{formatDayLabel(points[points.length - 1].key)}</span>}
      </div>
      {node}
    </div>
  );
}

/** Barra segmentada única: reparto de estados sobre el total. */
export function SegmentedBar({ segments, total }) {
  const { show, move, hide, node } = useTooltip();
  if (!total) return <p className="py-6 text-center text-sm text-white/35">Sin registros</p>;

  return (
    <div>
      <div className="flex h-6 w-full" style={{ background: GRID }}>
        {segments.map(
          (segment, index) =>
            segment.count > 0 && (
              <div
                key={segment.id}
                onMouseEnter={(event) =>
                  show(
                    event,
                    `${segment.label}: ${segment.count} (${Math.round((segment.count / total) * 100)}%)`,
                  )
                }
                onMouseMove={move}
                onMouseLeave={hide}
                style={{
                  width: `${(segment.count / total) * 100}%`,
                  background: segment.color,
                  marginRight: index < segments.length - 1 ? 2 : 0,
                }}
              />
            ),
        )}
      </div>
      <ul className="mt-4 space-y-2">
        {segments.map((segment) => (
          <li key={segment.id} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-white/70">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: segment.color }}
                aria-hidden="true"
              />
              {segment.label}
            </span>
            <span className="tabular-nums text-white">
              {segment.count}
              <span className="ml-2 text-white/40">
                {total ? Math.round((segment.count / total) * 100) : 0}%
              </span>
            </span>
          </li>
        ))}
      </ul>
      {node}
    </div>
  );
}

export function formatDayLabel(key, long = false) {
  const date = new Date(`${key}T12:00:00`);
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: long ? 'long' : 'short',
  });
}
