import https from 'https';
import fs from 'fs';
import fetch from 'node-fetch';
import {app} from "electron";
import path from 'path';

const API_URL = 'https://localhost:5050'; //todo mudar no fim

const agent = new https.Agent({
  cert: fs.readFileSync(path.join(app.getAppPath(), '../renderer', 'certs/client.crt.pem')),
  key:  fs.readFileSync(path.join(app.getAppPath(), '../renderer', 'certs/client.key.pem')),
  ca:   fs.readFileSync(path.join(app.getAppPath(), '../renderer', 'certs/ca.crt.pem')),
  rejectUnauthorized: true,
});

async function request(path, { method = 'GET', body, timeoutMs = 8000 } = {}) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);

  const opts = { method, signal: ctrl.signal, agent };
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
