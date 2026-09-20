// Cobertura de video y foto de Peñasco FPV para pilotos del Car Fest 2K26.
// Precios públicos en MXN tomados del flyer de Peñasco FPV y de su explicación
// de extras (2026-09-15). Se aparta por el WhatsApp de reservaciones de la
// agencia (RESERVATIONS_WHATSAPP en lodging.js).
//
// Modelo: el piloto elige un paquete base y le suma los extras que quiera.

export const FPV_PROPOSAL_PDF = '/propuesta/CarFest2K26-Cobertura-PenascoFPV.pdf';

export const FPV = {
  name: 'Peñasco FPV',
  services: ['Video', 'Foto', 'Drones'],
  handle: '@penascofpv',
  socials: ['Instagram', 'TikTok', 'YouTube', 'Facebook'],
  deposit: 500,
  delivery: '3 a 7 días después del evento',
  teamMinPilots: 3,
};

export const fpvPackages = [
  {
    id: 'crudo',
    name: 'Video Crudo',
    tagline: 'Todas tus tomas',
    price: 1200,
    tone: 'steel',
    icon: 'film',
    includes: [
      'Todas las tomas buenas de tu vehículo',
      'Sin edición',
      'Formato de video original en alta calidad',
      'Tomas en pista y pits (según condiciones)',
      'Entrega digital (Drive o WeTransfer)',
    ],
  },
  {
    id: 'editado',
    name: 'Video Editado',
    tagline: 'Tu historia en movimiento',
    price: 2000,
    tone: 'navy',
    icon: 'video',
    includes: [
      'Video editado de 45–60 segundos',
      'Edición dinámica y profesional',
      'Música, color y efectos',
      'Nombre y/o número del piloto',
      'Formato vertical (ideal para redes)',
      'Entrega digital (Drive o WeTransfer)',
    ],
  },
  {
    id: 'crudo-editado',
    name: 'Crudo + Editado',
    tagline: 'Todo en un paquete',
    price: 2500,
    tone: 'red',
    icon: 'layers',
    featured: true,
    includes: [
      'Todas las tomas buenas de tu vehículo (crudo)',
      'Video editado de 45–60 segundos',
      'Edición dinámica, música y efectos',
      'Nombre y/o número del piloto',
      'Formatos vertical y horizontal',
      'Entrega digital (Drive o WeTransfer)',
    ],
  },
  {
    id: 'premium',
    name: 'Cobertura Premium',
    tagline: 'Más que un video, tu legado',
    price: 3000,
    tone: 'gold',
    icon: 'crown',
    includes: [
      'Seguimiento personalizado durante todo el evento',
      'Tomas en pista, pits y detalles del vehículo',
      'Tomas con dron/FPV (si las condiciones y reglas lo permiten)',
      'Video editado de 60–90 segundos (vertical + horizontal)',
      'Todas las tomas en crudo',
      'Edición premium',
      'Entrega digital (Drive o WeTransfer)',
    ],
  },
];

// Se suman a cualquier paquete base.
export const fpvExtras = [
  {
    id: 'dron',
    name: 'Tomas con dron o FPV',
    price: 500,
    icon: 'drone',
    summary: 'Tomas específicas de tu vehículo desde el aire.',
    details: ['Seguimiento y pasadas', 'Tomas aéreas y detalles', 'Esa toma especial que quieres tener'],
    note: 'Siempre que las condiciones del evento lo permitan.',
  },
  {
    id: 'fotos',
    name: 'Fotografías profesionales',
    price: 400,
    icon: 'camera',
    summary: 'Fotos de tu carro y de ti como piloto.',
    details: ['En pista', 'En pits', 'Tu auto y el piloto'],
  },
  {
    id: 'reel',
    name: 'Video / reel vertical adicional',
    price: 300,
    icon: 'phone',
    summary: 'Más contenido listo para tus redes.',
    details: ['Ideal para Instagram, Facebook o TikTok', 'Se suma al paquete que ya contrataste'],
  },
];

// Ejemplos de cómo armar la cobertura: solo suman precios públicos.
export const fpvCombos = [
  { id: 'redes', name: 'Listo para redes', base: 'editado', extras: ['reel'] },
  { id: 'aire', name: 'Desde el aire', base: 'editado', extras: ['dron', 'reel'] },
  { id: 'recuerdo', name: 'Recuerdo completo', base: 'premium', extras: ['fotos'] },
];

export function comboTotal(combo) {
  const base = fpvPackages.find((p) => p.id === combo.base);
  const extras = combo.extras.map((id) => fpvExtras.find((e) => e.id === id));
  if (!base || extras.some((e) => !e)) throw new Error(`Combo inválido: ${combo.id}`);
  return { base, extras, total: base.price + extras.reduce((sum, e) => sum + e.price, 0) };
}
