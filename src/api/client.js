const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:18080';

export async function api(path, options = {}) {
  const response = await fetch(`${baseURL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw Object.assign(new Error(body.error || 'Request failed'), { status: response.status });
  }
  return body;
}
