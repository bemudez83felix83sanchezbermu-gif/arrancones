const request = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(payload?.error ?? 'No se pudo conectar con el servidor');
    error.status = response.status;
    error.fields = payload?.errors ?? {};
    error.detail = payload?.detail;
    throw error;
  }
  return payload;
};

export const listParticipants = () =>
  request('/api/participants').then((data) => data.participants ?? []);

// Competitors y el domo de la galería montan juntos en la landing: comparten la
// petición en vuelo en vez de bajar dos veces las fotos base64.
let publicParticipantsInFlight = null;

export const listPublicParticipants = () => {
  publicParticipantsInFlight ??= request('/api/participants/public')
    .then((data) => data.participants ?? [])
    .finally(() => {
      publicParticipantsInFlight = null;
    });
  return publicParticipantsInFlight;
};

export const createParticipant = (body) =>
  request('/api/participants', { method: 'POST', body }).then((data) => data.participant);

export const updateParticipant = (id, body) =>
  request(`/api/participants/${id}`, { method: 'PATCH', body }).then((data) => data.participant);

export const deleteParticipant = (id) =>
  request(`/api/participants/${id}`, { method: 'DELETE' });

export const login = (body) =>
  request('/api/auth/login', { method: 'POST', body }).then((data) => data.admin);

export const logout = () => request('/api/auth/logout', { method: 'POST' });

export const fetchCurrentAdmin = () =>
  request('/api/auth/me').then((data) => data.admin);

export const listAlbumAdmin = () =>
  request('/api/album/admin').then((data) => ({
    photos: data.photos ?? [],
    rateLimit: data.rateLimit ?? null,
  }));

/** `items`: `{ publicId, resourceType, uploader }[]`; responde `{ done, failed }`. */
export const moderateAlbumItems = (items, action) =>
  request('/api/album/admin', { method: 'POST', body: { action, items } });

export const setAlbumItemsCategory = (items, category) =>
  request('/api/album/admin', { method: 'POST', body: { action: 'category', items, category } });

export const fetchTaquilla = () =>
  request('/api/taquilla/sales').then((data) => ({
    sales: data.sales ?? [],
    types: data.types ?? [],
  }));

export const createTicketSale = (body) =>
  request('/api/taquilla/sales', { method: 'POST', body }).then((data) => data.sale);

export const setTicketSaleVoided = (id, voided, reason = '') =>
  request('/api/taquilla/sales', {
    method: 'PATCH',
    body: { id, action: voided ? 'void' : 'restore', reason },
  }).then((data) => data.sale);

export const createTicketType = (body) =>
  request('/api/taquilla/types', { method: 'POST', body }).then((data) => data.type);

export const updateTicketType = (id, body) =>
  request('/api/taquilla/types', { method: 'PATCH', body: { ...body, id } }).then(
    (data) => data.type,
  );

export const deleteTicketType = (id) =>
  request('/api/taquilla/types', { method: 'DELETE', body: { id } });

export const deleteAlbumPhoto = (publicId, resourceType = 'image') =>
  request('/api/album/admin', {
    method: 'DELETE',
    body: { publicId, resourceType },
  });
