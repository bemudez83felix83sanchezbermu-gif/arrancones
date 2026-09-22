// Datos de hospedaje, gastronomía y actividades ofrecidos por la agencia.
// Cada item apunta a una carpeta en /public/hospedaje/.../<slug>/ con:
//   - cover.webp        (portada; si no existe se muestra placeholder)
//   - gallery/1.webp..6.webp (opcionales; el componente omite las que no existan)
//
// Precios en MXN. Lo que el visitante paga es `price` (tarifa normal del hotel).
// La tarifa de agencia queda fuera de la UI (es nuestro costo interno).
// Opcionalmente `priceStrike` muestra un precio tachado más alto como gancho
// visual de descuento. Si el hotel cobra en dólares, la habitación lleva
// `currency: 'USD'` y los montos van en USD.
//
// Los hoteles se listan de mayor a menor margen para la agencia.

// Número dedicado de la agencia para reservaciones de hospedaje,
// gastronomía y actividades. Diferente al de contacto del evento.
export const RESERVATIONS_WHATSAPP = '526381271670';
export const RESERVATIONS_WHATSAPP_DISPLAY = '+52 638 127 1670';

// PDF para clientes; se regenera con `npm run propuesta:pdf`.
export const PROPOSAL_PDF = '/propuesta/CarFest2K26-Propuesta-Hospedaje.pdf';

export function whatsappLink(message) {
  return `https://wa.me/${RESERVATIONS_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

export function reservationLink(item, extra = '') {
  const base = `Hola, me interesa reservar en ${item.name} para el Car Fest 2K26.`;
  return whatsappLink(extra ? `${base} ${extra}` : base);
}

const mapsSearch = (query) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

export const hotels = [
  {
    slug: 'hotel-playa-inn',
    name: 'Playa Inn Rocky Point',
    tagline: 'Hotel estilo colonial con alberca central y jardines, cómodo para grupos.',
    badge: 'Alberca',
    folder: '/hospedaje/hoteles/hotel-playa-inn',
    mapsUrl: mapsSearch('Playa Inn Hotel Puerto Peñasco'),
    rooms: [
      {
        type: 'Habitación sencilla',
        capacity: '2 personas',
        price: 1790,
        priceStrike: 2050,
      },
      {
        type: 'Habitación doble',
        capacity: '4 personas',
        price: 1970,
        priceStrike: 2250,
      },
    ],
  },
  {
    slug: 'hotel-penasco-del-sol',
    name: 'Hotel Peñasco del Sol',
    tagline: 'Resort frente al mar con alberca, camastros y desayuno incluido.',
    badge: 'Frente al mar',
    folder: '/hospedaje/hoteles/hotel-penasco-del-sol',
    mapsUrl: mapsSearch('Hotel Peñasco del Sol Puerto Peñasco'),
    notes: [
      'Tarifa en dólares con desayuno e impuestos incluidos.',
      'Elige entre cuatro habitaciones de lujo: dos camas queen o una king, con vista a la alberca.',
    ],
    rooms: [
      {
        type: 'Habitación de lujo',
        capacity: '2 a 4 personas',
        price: 215,
        priceStrike: 245,
        currency: 'USD',
        priceLabel: 'Desayuno incluido',
      },
    ],
  },
  {
    slug: 'mannys-beach-club',
    name: "Manny's Beach Club",
    tagline: 'Beach club con habitaciones familiares y sofá cama incluido.',
    badge: 'Playa',
    folder: '/hospedaje/hoteles/mannys-beach-club',
    mapsUrl: 'https://maps.app.goo.gl/2yLzoH2kkDKgbKxG9',
    rooms: [
      {
        type: 'Habitación doble + sofá cama',
        capacity: '4 personas + niños',
        price: 2150,
        priceStrike: 2500,
        priceLabel: 'Precio fin de semana',
      },
    ],
  },
  {
    slug: 'hotel-vista-marina',
    name: 'Hotel Vista Marina',
    tagline: 'Vista al mar y precios accesibles a un paso del centro.',
    badge: 'Centro',
    folder: '/hospedaje/hoteles/hotel-vista-marina',
    mapsUrl: 'https://maps.app.goo.gl/UoToaUpecghGq3fS6',
    rooms: [
      {
        type: 'Habitación sencilla',
        capacity: '2 personas',
        price: 1100,
        priceStrike: 1300,
      },
      {
        type: 'Habitación doble',
        capacity: '4 personas',
        price: 1400,
        priceStrike: 1650,
      },
    ],
  },
  {
    slug: 'hotel-vinas-del-mar',
    name: 'Hotel Viña del Mar',
    tagline: 'Frente al malecón, ideal para parejas y familias.',
    badge: 'Malecón',
    folder: '/hospedaje/hoteles/hotel-vinas-del-mar',
    mapsUrl: 'https://maps.app.goo.gl/Qhb1k9LVJDnSjAtW6',
    rooms: [
      {
        type: 'Habitación sencilla',
        capacity: '2 personas',
        price: 1500,
        priceStrike: 1700,
      },
      {
        type: 'Habitación doble',
        capacity: '4 personas',
        price: 1500,
        priceStrike: 1700,
      },
    ],
  },
];

export const houses = Array.from({ length: 5 }, (_, i) => {
  const n = i + 1;
  return {
    slug: `casa-penasco-${n}`,
    name: `Casa Peñasco #${n}`,
    tagline: 'Casa vacacional privada en Comonfort, perfecta para grupos y familias.',
    badge: 'Casa privada',
    folder: `/hospedaje/casas/casa-penasco-${n}`,
    priceStatus: 'Consulta disponibilidad y tarifa por noche.',
  };
});

export const restaurants = [
  {
    slug: 'rosmarino-limon',
    name: 'Restaurante Rosmarino Limón',
    tagline: 'Cocina mediterránea con vista al mar. Reserva con nosotros y disfruta la experiencia sin filas.',
    badge: 'Mediterránea',
    folder: '/hospedaje/restaurantes/rosmarino-limon',
    mapsUrl: 'https://maps.app.goo.gl/Ly3XDB8EM2kguxvY6',
    highlights: [
      'Reservación garantizada durante el fin de semana del Car Fest.',
      'Atención prioritaria y menú recomendado por la agencia.',
    ],
  },
  {
    slug: 'mannys-restaurant',
    name: "Manny's Beach Club Restaurant",
    tagline: 'Comida frente al mar, mariscos y ambiente de playa. Ideal para arrancar o cerrar el día.',
    badge: 'Playa',
    folder: '/hospedaje/restaurantes/mannys-restaurant',
    mapsUrl: 'https://maps.app.goo.gl/XT2mqA6fGQHuG7Co9',
    highlights: [
      'Reservación garantizada durante el fin de semana del Car Fest.',
      'Zona playa con música y ambiente familiar.',
    ],
  },
];

export const activities = [
  {
    slug: 'barco-pirata',
    name: 'Paseos en Barco Pirata',
    tagline: 'Aventura familiar en la bahía de Puerto Peñasco con música, animación y show pirata.',
    badge: 'Bahía',
    folder: '/hospedaje/actividades/barco-pirata',
    mapsUrl: 'https://maps.app.goo.gl/ZKnKAEjRRXJsUGo76',
    externalUrl: 'https://barco-pirata.vercel.app/',
    externalLabel: 'Ver sitio oficial',
    highlights: [
      'Salidas programadas durante el fin de semana del evento.',
      'Reserva tu paquete con la agencia y aparta lugar sin filas.',
    ],
    // Precio público por persona, en MXN.
    packages: [
      {
        id: 'cena-barra-libre',
        name: 'Cena y Barra Libre',
        price: 700,
        details: 'Adultos: cena de fajitas de pollo y barra libre. Adolescentes: cena, soda y agua.',
      },
      {
        id: 'barra-libre',
        name: 'Barra Libre',
        price: 600,
        details: 'Adultos: barra libre. Adolescentes: sodas y agua.',
      },
      {
        id: 'solo-cena',
        name: 'Solo Cena',
        price: 600,
        details: 'Cena a bordo, sin barra libre.',
      },
      {
        id: 'ninos',
        name: 'Paquete Niños',
        price: 300,
        details: 'Agua, sodas y pizza. De 3 a 11 años.',
      },
    ],
  },
];

// Océano (Océano Luxury Rentals), patrocinador oficial. Sale de su flyer
// "Oceano_Car_Fest_2026 V1 Spanish.pdf" (respaldo en _originales/hospedaje/oceano/).
// Como el resto del catálogo, se reserva con el WhatsApp de la agencia: los
// teléfonos de Océano del flyer no se publican.
export const oceano = {
  name: 'Océano',
  folder: '/hospedaje/oceano',
  tagline: 'Un fin de semana en el Mar de Cortés',
  headline: 'Cerca del mar. Cerca de los autos.',
  offer: 'Hasta 15% de descuento exclusivo del evento',
  residences: [
    {
      slug: 'paz-del-mar',
      name: 'Paz del Mar',
      description: 'Villa privada para reuniones de hasta treinta personas.',
    },
    {
      slug: 'casa-evita',
      name: 'Casa Evita',
      description: 'Frente al mar en Las Conchas.',
    },
    {
      slug: 'casa-playa',
      name: 'Casa Playa',
      description: 'Frente al mar en Las Conchas.',
    },
  ],
  forSale: {
    slug: 'las-mareas-34',
    eyebrow: 'Una invitación a ser dueño',
    name: 'Mejor Vida',
    address: 'Las Mareas 34',
    features: ['Tres recámaras', 'Tres baños', 'Tercera fila, a unos pasos de la arena'],
    // Confirmado con el organizador: USD 525 (el flyer dice "525,000 USD").
    price: 525,
    currency: 'USD',
    note: 'Casa abierta durante el fin de semana del Car Fest',
  },
  finePrint: 'Hasta 15% en propiedades selectas disponibles. Sujeto a disponibilidad.',
};
