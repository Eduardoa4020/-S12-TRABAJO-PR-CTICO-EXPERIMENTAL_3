const API_URL = (import.meta.env?.VITE_API_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
);

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, { token, signal, ...options } = {}) {
  const headers = new Headers(options.headers);
  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    signal,
  });
  const responseText = await response.text();
  let result = {};
  if (responseText) {
    try {
      result = JSON.parse(responseText);
    } catch {
      if (response.ok) {
        throw new ApiError('El servidor devolvió una respuesta no válida.', response.status);
      }
    }
  }

  if (!response.ok) {
    throw new ApiError(
      result.error || result.mensaje || 'No se pudo completar la solicitud.',
      response.status,
    );
  }

  return result;
}

export function registerUser(user) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(user),
  });
}

export function loginUser(credentials) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export function getProfile(token, signal) {
  return request('/auth/perfil', { token, signal });
}

export function getUsers(token, signal) {
  return request('/usuarios', { token, signal });
}

export function updateUser(id, user, token) {
  return request(`/usuarios/${encodeURIComponent(id)}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(user),
  });
}

export function deleteUser(id, token) {
  return request(`/usuarios/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  });
}
