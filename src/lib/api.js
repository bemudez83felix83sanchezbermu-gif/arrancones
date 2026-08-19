const request = async (url, options = {}) => {
  const response = await fetch(url, {
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

export const createParticipant = (body) =>
  request('/api/participants', { method: 'POST', body }).then((data) => data.participant);

export const updateParticipant = (id, body) =>
  request(`/api/participants/${id}`, { method: 'PATCH', body }).then((data) => data.participant);

export const deleteParticipant = (id) =>
  request(`/api/participants/${id}`, { method: 'DELETE' });
