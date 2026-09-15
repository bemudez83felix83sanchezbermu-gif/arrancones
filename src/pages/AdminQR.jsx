import { useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import QRCodeStyling from 'qr-code-styling';
import { ArrowLeft, Download, FileImage, Loader2, Printer, QrCode, Sparkles } from 'lucide-react';
import { EVENT } from '../data/event';
import { useAuth } from '../lib/useAuth';
import { Link, navigate } from '../router';
import { BUTTON, Panel } from '../components/admin/ui';

const DEFAULT_URL =
  typeof window !== 'undefined'
    ? `${window.location.origin}/album/subir`
    : 'https://carfestrp2026.vercel.app/album/subir';

const SIZE_PRESETS = [
  { id: 'half', label: 'Media hoja', poster: 'w-[520px]', qr: 380 },
  { id: 'full', label: 'Hoja completa', poster: 'w-[720px]', qr: 520 },
  { id: 'a5', label: 'A5', poster: 'w-[420px]', qr: 300 },
];

export default function AdminQR() {
  const { status } = useAuth();
  const [url, setUrl] = useState(DEFAULT_URL);
  const [sizeId, setSizeId] = useState('full');
  const [withLogo, setWithLogo] = useState(true);
  const preset = useMemo(
    () => SIZE_PRESETS.find((s) => s.id === sizeId) ?? SIZE_PRESETS[1],
    [sizeId],
  );

  useEffect(() => {
    if (status === 'anon') navigate('/login');
  }, [status]);

  if (status !== 'authed') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
        <Loader2 size={32} className="animate-spin text-racing-red" />
      </div>
    );
  }

  const downloadSVG = () => {
    const svg = document.getElementById('qr-poster-svg');
    if (!svg) return;
    const serialized = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${serialized}`], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = 'qr-album-carfest2k26.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <PrintStyles />

      <header className="no-print sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0A]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/admin" className={`${BUTTON.ghost} shrink-0`}>
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Panel</span>
            </Link>
            <div className="min-w-0">
              <span className="display block text-lg uppercase leading-tight tracking-wide text-white sm:text-2xl">
                QR del <span className="text-racing-red">álbum</span>
              </span>
              <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.2em] text-white/35 sm:text-xs">
                Imprímelo y pégalo en la pista
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={downloadSVG} className={BUTTON.ghost}>
              <Download size={14} />
              <span className="hidden sm:inline">Descargar SVG</span>
            </button>
            <button type="button" onClick={() => window.print()} className={BUTTON.primary}>
              <Printer size={16} /> Imprimir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1400px] gap-6 px-4 py-8 md:px-8 lg:grid-cols-[340px_1fr]">
        <aside className="no-print space-y-4">
          <Panel title="Opciones" subtitle="Ajusta el QR antes de imprimir">
            <label className="block text-xs uppercase tracking-[0.18em] text-white/50">
              URL a codificar
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="mt-1.5 w-full border border-white/15 bg-[#0F0F0F] px-3 py-2.5 text-sm text-white outline-none transition focus:border-racing-red"
                placeholder="https://…/album/subir"
              />
              <span className="mt-1.5 block text-[10px] normal-case tracking-normal text-white/40">
                Por defecto apunta a la página de subida del álbum.
              </span>
            </label>

            <div className="mt-5">
              <span className="block text-xs uppercase tracking-[0.18em] text-white/50">
                Tamaño del cartel
              </span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {SIZE_PRESETS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSizeId(s.id)}
                    className={`border px-3 py-1.5 text-xs uppercase tracking-[0.15em] transition ${
                      sizeId === s.id
                        ? 'border-racing-red bg-racing-red/15 text-white'
                        : 'border-white/15 text-white/60 hover:border-white/40 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="mt-5 flex items-start gap-2.5 text-xs text-white/70">
              <input
                type="checkbox"
                checked={withLogo}
                onChange={(e) => setWithLogo(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-racing-red"
              />
              <span>
                <span className="block font-medium text-white">Logo Car Fest al centro</span>
                <span className="block text-[10px] uppercase tracking-[0.15em] text-white/40">
                  Se sigue leyendo — corrección de error alta.
                </span>
              </span>
            </label>
          </Panel>

          <Panel title="Cómo se usa">
            <ol className="space-y-2.5 text-sm text-white/70">
              <li className="flex gap-2">
                <span className="display shrink-0 text-racing-red">01.</span>
                Imprime el cartel y lamínalo si va a estar al sol.
              </li>
              <li className="flex gap-2">
                <span className="display shrink-0 text-racing-red">02.</span>
                Pégalo en un lugar visible: pits, entrada, escenario.
              </li>
              <li className="flex gap-2">
                <span className="display shrink-0 text-racing-red">03.</span>
                La gente lo escanea → elige sección → sube su foto. Queda pendiente, no se
                publica sola.
              </li>
              <li className="flex gap-2">
                <span className="display shrink-0 text-racing-red">04.</span>
                Aprueba desde la pestaña <span className="text-white">Álbum</span> del panel y
                aparece en <span className="text-white">/album</span>.
              </li>
            </ol>
          </Panel>
        </aside>

        <section className="flex items-start justify-center">
          <div className="print-poster mx-auto flex flex-col items-center border border-white/10 bg-white p-8 text-[#0A0A0A] shadow-2xl">
            <Poster url={url} withLogo={withLogo} sizeClass={preset.poster} qrSize={preset.qr} />
          </div>
        </section>
      </main>

      <section className="no-print mx-auto max-w-[1400px] px-4 pb-16 md:px-8">
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center border border-racing-red/40 bg-racing-red/10 text-racing-red">
            <Sparkles size={16} />
          </span>
          <div>
            <h2 className="display text-xl uppercase leading-tight tracking-wide text-white sm:text-2xl">
              QR <span className="text-racing-red">personalizado</span>
            </h2>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 sm:text-xs">
              Segunda opción con qr-code-styling — dale identidad del evento
            </p>
          </div>
        </div>
        <StyledQRSection url={url} />
      </section>
    </div>
  );
}

function Poster({ url, withLogo, sizeClass, qrSize }) {
  const shortUrl = url.replace(/^https?:\/\//, '');
  return (
    <div className={`flex ${sizeClass} max-w-full flex-col items-center gap-6 px-2`}>
      <div className="w-full border-b-2 border-[#0A0A0A]/10 pb-4 text-center">
        <span className="text-[11px] font-bold uppercase tracking-[0.32em] text-racing-red">
          {EVENT.organizer} presenta
        </span>
        <h1
          className="display mt-3 text-5xl leading-[0.9] tracking-tight text-[#0A0A0A]"
          style={{ letterSpacing: '0.01em' }}
        >
          Álbum <span className="text-racing-red">Car Fest 2K26</span>
        </h1>
        <p className="mt-3 text-sm font-medium uppercase tracking-[0.22em] text-[#0A0A0A]/60">
          Escanea y sube tus fotos del evento
        </p>
      </div>

      <div className="relative flex items-center justify-center rounded-sm border-8 border-[#0A0A0A] bg-white p-4">
        <QRCodeSVG
          id="qr-poster-svg"
          value={url || 'https://carfestrp2026.vercel.app/album/subir'}
          size={qrSize}
          level="H"
          bgColor="#FFFFFF"
          fgColor="#0A0A0A"
          marginSize={0}
          imageSettings={
            withLogo
              ? {
                  src: '/favicon.svg',
                  height: Math.round(qrSize * 0.18),
                  width: Math.round(qrSize * 0.18),
                  excavate: true,
                }
              : undefined
          }
        />
      </div>

      <div className="w-full text-center">
        <p className="font-mono text-[13px] tracking-tight text-[#0A0A0A]/70">
          {shortUrl || 'carfestrp2026.vercel.app/album/subir'}
        </p>
      </div>

      <div className="grid w-full grid-cols-3 gap-2 border-t-2 border-[#0A0A0A]/10 pt-4 text-center">
        {[
          { n: '01', t: 'Escanea con la cámara' },
          { n: '02', t: 'Elige o toma tus fotos' },
          { n: '03', t: 'Se revisan y publican' },
        ].map((step) => (
          <div key={step.n} className="flex flex-col items-center">
            <span className="display text-2xl text-racing-red">{step.n}</span>
            <span className="mt-1 text-[10px] font-semibold uppercase leading-tight tracking-[0.15em] text-[#0A0A0A]/70">
              {step.t}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-2 flex w-full items-center justify-between border-t border-[#0A0A0A]/10 pt-3 text-[10px] uppercase tracking-[0.22em] text-[#0A0A0A]/45">
        <span>{EVENT.displayDate}</span>
        <span className="flex items-center gap-1.5 font-semibold text-racing-red">
          <QrCode size={11} /> Comparte lo que viviste
        </span>
      </div>
    </div>
  );
}

const DOT_TYPES = [
  { id: 'square', label: 'Cuadros' },
  { id: 'rounded', label: 'Redondeados' },
  { id: 'dots', label: 'Puntos' },
  { id: 'classy', label: 'Classy' },
  { id: 'classy-rounded', label: 'Classy R.' },
  { id: 'extra-rounded', label: 'Extra R.' },
];

const CORNER_SQUARE_TYPES = [
  { id: 'square', label: 'Cuadro' },
  { id: 'extra-rounded', label: 'Redondo' },
  { id: 'dot', label: 'Círculo' },
];

const CORNER_DOT_TYPES = [
  { id: 'square', label: 'Cuadro' },
  { id: 'dot', label: 'Punto' },
];

const COLOR_PRESETS = [
  { id: 'racing', label: 'Racing red', dot: '#0A0A0A', corner: '#E10600', cornerDot: '#0A0A0A', bg: '#FFFFFF' },
  { id: 'inverse', label: 'Inverso', dot: '#FFFFFF', corner: '#E10600', cornerDot: '#FFFFFF', bg: '#0A0A0A' },
  { id: 'flame', label: 'Flama', dot: '#0A0A0A', corner: '#E10600', cornerDot: '#7A0300', bg: '#FFFFFF', gradient: true },
  { id: 'mono', label: 'Mono', dot: '#0A0A0A', corner: '#0A0A0A', cornerDot: '#0A0A0A', bg: '#FFFFFF' },
];

function StyledQRSection({ url }) {
  const holderRef = useRef(null);
  const qrRef = useRef(null);
  const logoInputRef = useRef(null);

  const [dotType, setDotType] = useState('extra-rounded');
  const [cornerSquareType, setCornerSquareType] = useState('extra-rounded');
  const [cornerDotType, setCornerDotType] = useState('dot');
  const [presetId, setPresetId] = useState('racing');
  const [withLogo, setWithLogo] = useState(true);
  const [logoSrc, setLogoSrc] = useState('/favicon.svg');
  const [logoSize, setLogoSize] = useState(0.32);
  const [size, setSize] = useState(560);

  const preset = useMemo(
    () => COLOR_PRESETS.find((p) => p.id === presetId) ?? COLOR_PRESETS[0],
    [presetId],
  );

  useEffect(() => {
    if (!holderRef.current) return;
    const dotsOptions = preset.gradient
      ? {
          type: dotType,
          gradient: {
            type: 'linear',
            rotation: Math.PI / 4,
            colorStops: [
              { offset: 0, color: preset.dot },
              { offset: 1, color: preset.corner },
            ],
          },
        }
      : { type: dotType, color: preset.dot };

    const options = {
      width: size,
      height: size,
      type: 'svg',
      data: url || 'https://carfestrp2026.vercel.app/album/subir',
      margin: 8,
      qrOptions: { errorCorrectionLevel: 'H' },
      backgroundOptions: { color: preset.bg },
      dotsOptions,
      cornersSquareOptions: { type: cornerSquareType, color: preset.corner },
      cornersDotOptions: { type: cornerDotType, color: preset.cornerDot },
      image: withLogo ? logoSrc : undefined,
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: logoSize,
        margin: 6,
        crossOrigin: 'anonymous',
      },
    };

    if (!qrRef.current) {
      qrRef.current = new QRCodeStyling(options);
      holderRef.current.innerHTML = '';
      qrRef.current.append(holderRef.current);
    } else {
      qrRef.current.update(options);
    }
  }, [url, dotType, cornerSquareType, cornerDotType, preset, withLogo, logoSrc, logoSize, size]);

  const download = (ext) => {
    qrRef.current?.download({ name: `qr-carfest2k26-${presetId}`, extension: ext });
  };

  const onLogoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoSrc(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <aside className="space-y-4">
        <Panel title="Estilo" subtitle="Combina puntos, esquinas y colores">
          <div>
            <span className="block text-xs uppercase tracking-[0.18em] text-white/50">Paleta</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPresetId(p.id)}
                  className={`border px-3 py-1.5 text-xs uppercase tracking-[0.15em] transition ${
                    presetId === p.id
                      ? 'border-racing-red bg-racing-red/15 text-white'
                      : 'border-white/15 text-white/60 hover:border-white/40 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <span className="block text-xs uppercase tracking-[0.18em] text-white/50">Puntos</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {DOT_TYPES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDotType(d.id)}
                  className={`border px-2.5 py-1.5 text-[11px] uppercase tracking-[0.15em] transition ${
                    dotType === d.id
                      ? 'border-racing-red bg-racing-red/15 text-white'
                      : 'border-white/15 text-white/60 hover:border-white/40 hover:text-white'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <span className="block text-xs uppercase tracking-[0.18em] text-white/50">
              Marco esquinas
            </span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {CORNER_SQUARE_TYPES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCornerSquareType(c.id)}
                  className={`border px-2.5 py-1.5 text-[11px] uppercase tracking-[0.15em] transition ${
                    cornerSquareType === c.id
                      ? 'border-racing-red bg-racing-red/15 text-white'
                      : 'border-white/15 text-white/60 hover:border-white/40 hover:text-white'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <span className="block text-xs uppercase tracking-[0.18em] text-white/50">
              Punto interior
            </span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {CORNER_DOT_TYPES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCornerDotType(c.id)}
                  className={`border px-2.5 py-1.5 text-[11px] uppercase tracking-[0.15em] transition ${
                    cornerDotType === c.id
                      ? 'border-racing-red bg-racing-red/15 text-white'
                      : 'border-white/15 text-white/60 hover:border-white/40 hover:text-white'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <label className="block text-xs uppercase tracking-[0.18em] text-white/50">
              Tamaño ({size}px)
              <input
                type="range"
                min={320}
                max={1024}
                step={16}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="mt-2 w-full accent-racing-red"
              />
            </label>
          </div>
        </Panel>

        <Panel title="Logo al centro">
          <label className="flex items-start gap-2.5 text-xs text-white/70">
            <input
              type="checkbox"
              checked={withLogo}
              onChange={(e) => setWithLogo(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-racing-red"
            />
            <span>
              <span className="block font-medium text-white">Incluir logo</span>
              <span className="block text-[10px] uppercase tracking-[0.15em] text-white/40">
                Corrección alta (H) — se sigue leyendo con logo.
              </span>
            </span>
          </label>

          {withLogo && (
            <>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className={`${BUTTON.ghost} w-full justify-center`}
                >
                  <FileImage size={14} />
                  Subir logo del evento
                </button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={onLogoFile}
                  className="hidden"
                />
                <p className="mt-2 text-[10px] uppercase tracking-[0.15em] text-white/40">
                  PNG, WebP o SVG. Se incrusta local sin subir a ningún lado.
                </p>
              </div>

              <div className="mt-4">
                <label className="block text-xs uppercase tracking-[0.18em] text-white/50">
                  Tamaño del logo ({Math.round(logoSize * 100)}%)
                  <input
                    type="range"
                    min={0.15}
                    max={0.45}
                    step={0.01}
                    value={logoSize}
                    onChange={(e) => setLogoSize(Number(e.target.value))}
                    className="mt-2 w-full accent-racing-red"
                  />
                </label>
              </div>
            </>
          )}
        </Panel>

        <Panel title="Descargar">
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={() => download('png')} className={BUTTON.primary}>
              <Download size={14} /> PNG
            </button>
            <button type="button" onClick={() => download('svg')} className={BUTTON.ghost}>
              <Download size={14} /> SVG
            </button>
            <button type="button" onClick={() => download('jpeg')} className={BUTTON.ghost}>
              <Download size={14} /> JPG
            </button>
          </div>
        </Panel>
      </aside>

      <div className="flex items-start justify-center">
        <div
          className="flex items-center justify-center border border-white/10 p-6 shadow-2xl"
          style={{ background: preset.bg }}
        >
          <div ref={holderRef} />
        </div>
      </div>
    </div>
  );
}

function PrintStyles() {
  return (
    <style>{`
      @media print {
        @page { margin: 12mm; }
        html, body { background: #ffffff !important; }
        body * { visibility: hidden !important; }
        .print-poster, .print-poster * { visibility: visible !important; }
        .print-poster {
          position: absolute !important;
          inset: 0 !important;
          margin: 0 auto !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          width: auto !important;
          max-width: 100% !important;
        }
        .no-print { display: none !important; }
      }
    `}</style>
  );
}
