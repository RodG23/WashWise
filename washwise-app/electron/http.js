const API_URL = 'http://localhost:3000';

async function request(path, { method = 'GET', body, timeoutMs = 8000 } = {}) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);

  const opts = { method, signal: ctrl.signal };
  if (body !== undefined) {
    opts.headers = { 'content-type': 'application/json' };
    opts.body = JSON.stringify(body);
  } else {
    opts.headers = { accept: 'application/json' };
  }

  const res = await fetch(`${API_URL}${path}`, opts).finally(() => clearTimeout(id));

  const ct = res.headers.get('content-type') || '';
  const isJson = ct.includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const msg =
      (typeof data === 'object' && data?.error) ? data.error :
      (typeof data === 'object' && data?.message) ? data.message :
      String(data || `HTTP ${res.status}`);
    return { success: false, message: msg, status: res.status };
  }
  return { success: true, data };
}

export const http = {
  get: (p) => request(p),
  post: (p, b) => request(p, { method:'POST', body:b }),
  put:  (p, b) => request(p, { method:'PUT',  body:b }),
  del:  (p)    => request(p, { method:'DELETE' }),
};
