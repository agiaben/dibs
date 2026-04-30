const BASE = 'http://localhost:5000';

export function getToken() {
  return localStorage.getItem('dibs_token');
}

export function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`
  };
}

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: options.headers || authHeaders()
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}
