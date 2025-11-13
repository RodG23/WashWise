import https from 'https';
import fs from 'fs';
import fetch from 'node-fetch';
import {app} from "electron";
import path from 'path';
import { Availability } from './availability.js';


const CFG = {
  API_URL: 'https://192.168.1.207:5050',
  HEALTH_INTERVAL_MS: 8000,
  HEALTH_TIMEOUT_MS: 2500,
  FAIL_THRESHOLD: 2,
  REQUEST_TIMEOUT_MS: 8000,
  HEALTH_PATH: '/health'
};

const agent = new https.Agent({
  cert: fs.readFileSync(path.join(app.getAppPath(), '../renderer', 'certs/client.crt.pem')),
  key:  fs.readFileSync(path.join(app.getAppPath(), '../renderer', 'certs/client.key.pem')),
  ca:   fs.readFileSync(path.join(app.getAppPath(), '../renderer', 'certs/ca.crt.pem')),
  rejectUnauthorized: true,
});

const availability = new Availability({
  baseURL: CFG.API_URL,
  agent,
  failThreshold: CFG.FAIL_THRESHOLD,
  intervalMs: CFG.HEALTH_INTERVAL_MS,
  timeoutMs: CFG.HEALTH_TIMEOUT_MS,
  healthPath: CFG.HEALTH_PATH
});
availability.start();

export function getApiState() { return availability.getState(); }
export function onApiStateChange(cb) { availability.on('state', cb); }

async function request(path, { method = 'GET', body, timeoutMs = CFG.REQUEST_TIMEOUT_MS } = {}) {

  const isHealth = typeof path === 'string' && path.startsWith(CFG.HEALTH_PATH);

  // Gate: se DOWN e não é /health, não tentamos enviar
  if (!isHealth && !availability.isUp()) {
    return { success: false, message: 'Servidor indisponível.', status: 0 };
  }

  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);

  const opts = { method, signal: ctrl.signal, agent };
  if (body !== undefined) {
    opts.headers = { 'content-type': 'application/json' };
    opts.body = JSON.stringify(body);
  } else {
    opts.headers = { accept: 'application/json' };
  }

  //const res = await fetch(`${API_URL}${path}`, opts).finally(() => clearTimeout(id));

  let res;
  try {
    res = await fetch(`${CFG.API_URL}${path}`, opts);
  } catch (e) {
    clearTimeout(id);
    availability.noteNetworkFailure(); // timeouts, TLS, DNS, ligação
    return { success: false, message: 'Falha de rede/timeout a contactar a API.', status: 0 };
  } finally {
    clearTimeout(id);
  }

  availability.noteSuccess();

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
  get: (p)     => request(p),
  post: (p, b) => request(p, { method:'POST', body:b }),
  put:  (p, b) => request(p, { method:'PUT',  body:b }),
  del:  (p)    => request(p, { method:'DELETE' }),
};
