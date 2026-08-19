export const EVENT = {
  name: 'Car Fest 2K26',
  organizer: 'ALP Racing',
  tagline: '¡Vive la pasión, siente la velocidad!',
  slogan: '2 días de adrenalina',
  city: 'Puerto Peñasco, Sonora',
  venue: 'Centro de Convenciones',
  startDate: '2026-09-26T10:00:00-07:00',
  endDate: '2026-09-27T22:00:00-07:00',
  displayDate: '26 y 27 de Septiembre 2026',
  days: [
    {
      label: 'Día 1',
      date: 'Sábado 26 de Septiembre',
      title: 'Drift & Car Show',
      description:
        'Exhibiciones de drift, competencia de mejor auto en múltiples categorías, exposición de tuning, lowrider, off-road, exóticos y bikers.',
      activities: ['Drift', 'Car Show', 'Exhibiciones'],
    },
    {
      label: 'Día 2',
      date: 'Domingo 27 de Septiembre',
      title: 'Arrancones',
      description:
        'Un día completo de arrancones con las máquinas más rápidas del noroeste. Confirmados: Leon Racing y La Paloma buscando rival.',
      activities: ['Arrancones', 'Time attack', 'Premios'],
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
    facebookEvent: 'https://www.facebook.com/events/1622648475955051/',
    instagram: 'https://www.instagram.com/arrancones_la_pista/',
    instagramHandle: '@arrancones_la_pista',
  },
  media: {
    hero: '/images/flyer-1.svg',
    sponsors: '/images/flyer-2.svg',
    lineup: '/images/flyer-3.svg',
  },
};

export const WHATSAPP_URL = (message = '') =>
  `https://wa.me/${EVENT.contact.whatsapp}?text=${encodeURIComponent(message)}`;
