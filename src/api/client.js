const baseURL = import.meta.env.VITE_API_BASE_URL || '';

export async function api(path, options = {}) {
  console.log('API Request:', path, options);
  const token = localStorage.getItem('admin_token');
  const method = (options.method || 'GET').toUpperCase();

  let requestBody = options.body;
  const isMutation = ['POST', 'PUT', 'PATCH'].includes(method);
  if (isMutation && (requestBody === undefined || requestBody === null || requestBody === '')) {
    requestBody = JSON.stringify({});
  } else if (isMutation && typeof requestBody === 'object' && !(requestBody instanceof FormData)) {
    requestBody = JSON.stringify(requestBody);
  }

  const isFormData = typeof FormData !== 'undefined' && requestBody instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const url = path.startsWith('http')
    ? path
    : `${baseURL}${path.startsWith('/') ? path : '/' + path}`;

  const response = await fetch(url, {
    ...options,
    method,
    headers,
    body: requestBody,
  });

  if (response.status === 401) {
    // Token expired or invalid — clear session and redirect if not already on login
    if (!window.location.pathname.includes('/login')) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_role');
      localStorage.removeItem('admin_email');
      window.location.href = '/login';
    }
  }

  const text = await response.text();
  let body = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }

  if (!response.ok) {
    const errorMsg = body.error || body.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = body;
    throw err;
  }

  return body;
}
