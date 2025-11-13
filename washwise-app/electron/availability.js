// main/availability.js
import EventEmitter from 'events';
import fetch from 'node-fetch';

export class Availability extends EventEmitter {
  constructor({ baseURL, agent, failThreshold = 3, intervalMs = 8000, timeoutMs = 2500, healthPath = '/health' }) {
    super();
    this.baseURL = baseURL.replace(/\/$/, '');
    this.agent = agent;
    this.failThreshold = failThreshold;
    this.intervalMs = intervalMs;
    this.timeoutMs = timeoutMs;
    this.healthPath = healthPath;
    this.state = 'DOWN';
    this.failures = 0;
    this.timer = null;
  }

  start() {
    const tick = async () => {
      const ok = await this.#probeOnce();
      this.#setState(ok ? 'UP' : 'DOWN');
      this.timer = setTimeout(tick, this.intervalMs);
    };
    tick();
  }

  stop() { if (this.timer) clearTimeout(this.timer); }

  isUp() { return this.state === 'UP'; }
  getState() { return this.state; }

  noteNetworkFailure() {
    this.failures++;
    if (this.failures >= this.failThreshold) this.#setState('DOWN');
  }

  noteSuccess() { this.failures = 0; }

  async #probeOnce() {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      const res = await fetch(`${this.baseURL}${this.healthPath}`, {
        method: 'GET',
        agent: this.agent,
        signal: ctrl.signal,
        headers: { 'cache-control': 'no-store', accept: 'application/json' }
      }).finally(() => clearTimeout(id));
      const ok = res.ok; // 200 => UP, 503 => DOWN
      if (ok) this.noteSuccess();
      else this.failures++; // acelera queda se o health der != 200
      return ok;
    } catch {
      this.failures++;
      return false;
    }
  }

  #setState(s) {
    if (s !== this.state) {
      this.state = s;
      this.emit('state', s);
    }
    if (s === 'UP') this.failures = 0;
  }
}
