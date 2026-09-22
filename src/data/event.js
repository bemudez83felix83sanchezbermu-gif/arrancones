export const EVENT = {
  name: 'Car Fest 2K26',
  organizer: 'ALP Racing',
  tagline: '¡Vive la pasión, siente la velocidad!',
  slogan: '3 días de adrenalina',
  city: 'Puerto Peñasco, Sonora',
  venue: 'Centro de Convenciones',
  // Arranque del fest: salida del desfile. Lo usa la cuenta regresiva del Hero.
  // Sonora no cambia de horario: siempre -07:00 (America/Hermosillo).
  startDate: '2026-09-25T17:30:00-07:00',
  // Cierre de los arrancones del domingo. El cierre de inscripciones es por
  // categoría: `closesAt` en shared/participants.js.
  endDate: '2026-09-27T19:00:00-07:00',
  displayDate: '25, 26 y 27 de Septiembre 2026',
  // Entrada general en taquilla (tipo "General" de /admin/taquilla). null la oculta.
  admission: { label: 'Entrada general', price: 50, currency: 'MXN', note: 'Se paga en taquilla' },
  days: [
    {
      label: 'Día 1',
      iso: '2026-09-25',
      date: 'Viernes 25 de Septiembre',
      title: 'Desfile por la ciudad',
      description:
        "Arrancamos el fin de semana con un desfile por la ciudad: salimos a las 5:30 pm de Sam's Club Puerto Peñasco y terminamos en la Calle 12.",
      activities: ['Desfile', '5:30 pm', "Sam's Club → Calle 12"],
      time: '5:30 pm',
      place: "Sale de Sam's Club y termina en la Calle 12",
      mapsQuery: "Sam's Club Puerto Peñasco, Sonora, Mexico",
    },
    {
      label: 'Día 2',
      iso: '2026-09-26',
      date: 'Sábado 26 de Septiembre',
      title: 'Drift & Car Show',
      description:
        'Exhibiciones de drift, competencia de mejor auto en múltiples categorías, exposición de tuning, lowrider, off-road, exóticos y bikers.',
      activities: ['Drift', 'Car Show', 'Exhibiciones'],
      time: '10:00 am – 7:00 pm',
      place: 'Centro de Convenciones',
      mapsQuery: 'Centro de Convenciones, Puerto Peñasco, Sonora, Mexico',
    },
    {
      label: 'Día 3',
      iso: '2026-09-27',
      date: 'Domingo 27 de Septiembre',
      title: 'Arrancones',
      description:
        'Un día completo de arrancones con las máquinas más rápidas del noroeste. Confirmados: Leon Racing y La Paloma buscando rival.',
      activities: ['Arrancones', 'Time attack', 'Premios'],
      time: '9:00 am – 7:00 pm',
      agenda: [
        { time: '9:00 – 11:30 am', label: 'Caladas' },
        { time: '11:30 am – 12:00 pm', label: 'Sorteo' },
        { time: '12:00 – 7:00 pm', label: 'Arrancones' },
      ],
      place: 'Centro de Convenciones',
      mapsQuery: 'Centro de Convenciones, Puerto Peñasco, Sonora, Mexico',
    },
  ],
  categories: [
    { name: 'Drift', icon: 'flame' },
    { name: 'Car Show', icon: 'sparkles' },
    { name: 'Arrancones', icon: 'timer' },
    { name: 'Exóticos', icon: 'gem' },
    { name: 'Tuning', icon: 'wrench' },
    { name: 'Lowrider', icon: 'car' },
    { name: 'Off-Road', icon: 'mountain' },
    { name: 'Bikers', icon: 'bike' },
  ],
  confirmed: [
    {
      name: 'Leon Racing',
      note: 'Confirmado para el 27 de septiembre',
      image: '/images/competitors/placeholder-driver.svg',
      borderColor: '#E10600',
      gradient: 'linear-gradient(145deg, #E10600, #0A0A0A)',
    },
    {
      name: 'La Paloma',
      note: '"Miel no hay..!" — Quiere rival',
      image: '/images/competitors/placeholder-driver.svg',
      borderColor: '#F5B301',
      gradient: 'linear-gradient(145deg, #F5B301, #0A0A0A)',
    },
  ],
  contact: {
    whatsapp: '526383865268',
    whatsappDisplay: '+52 638 386 5268',
    facebookEvent: 'https://www.facebook.com/events/2102109513678205/',
    facebookPage: 'https://www.facebook.com/arrankonezlapista',
    instagram: 'https://www.instagram.com/arrancones_la_pista/',
    instagramHandle: '@arrancones_la_pista',
  },
  media: {
    hero: '/images/gallery/event-05.webp',
    sponsors: '/images/flyer-2.svg',
    lineup: '/images/flyer-3.svg',
  },
};

export const WHATSAPP_URL = (message = '') =>
  `https://wa.me/${EVENT.contact.whatsapp}?text=${encodeURIComponent(message)}`;

export const MAPS_URL = (query) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
