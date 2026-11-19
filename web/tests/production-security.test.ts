import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { auth, TOKEN_KEY, AUTH_CHANGED_EVENT } from '../src/services/auth';
import { jsonFetch, authenticatedJsonFetch } from '../src/services/http';
import { resolveApiUrl } from '../src/services/config';

class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}
const originalFetch = globalThis.fetch;
const originalDescriptors = Object.fromEntries(['window', 'localStorage', 'sessionStorage'].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
const token = (expiry = Math.floor(Date.now() / 1000) + 3600) => `header.${Buffer.from(JSON.stringify({ exp: expiry })).toString('base64url')}.signature`;

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true });
  Object.defineProperty(globalThis, 'sessionStorage', { value: new MemoryStorage(), configurable: true });
  Object.defineProperty(globalThis, 'window', { value: new EventTarget(), configurable: true });
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const [key, descriptor] of Object.entries(originalDescriptors)) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});

test('persists a usable token and clears storage and context listeners on logout', () => {
  const accessToken = token();
  auth.setToken(accessToken);
  assert.equal(auth.getToken(), accessToken);
  let changes = 0;
  window.addEventListener(AUTH_CHANGED_EVENT, () => changes++);
  auth.removeToken();
  assert.equal(localStorage.getItem(TOKEN_KEY), null);
  assert.equal(auth.isAuthenticated(), false);
  assert.equal(changes, 1);
});
test('clears malformed and expired sessions with a one-time sign-in message', () => {
  for (const accessToken of ['malformed', token(1)]) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    assert.equal(auth.getToken(), null);
    assert.match(auth.takeSessionMessage(), /session expired/i);
    assert.equal(auth.takeSessionMessage(), '');
  }
});
test('requires a production HTTPS API URL and preserves the development default', () => {
  assert.equal(resolveApiUrl(undefined, false), 'http://localhost:5000/api');
  assert.equal(resolveApiUrl(' https://api.example.invalid/api/ ', true), 'https://api.example.invalid/api');
  for (const value of ['', 'http://localhost:5000/api', 'https://user:pass@api.example.invalid/api', 'https://api.example.invalid/api?secret=value', 'https://api.example.invalid']) {
    assert.throws(() => resolveApiUrl(value, true), /VITE_API_URL/);
  }
});
test('clears rejected authenticated sessions but preserves ordinary forbidden responses', async () => {
  const accessToken = token();
  auth.setToken(accessToken);
  globalThis.fetch = async (_url, options) => {
    assert.equal(new Headers(options?.headers).get('Authorization'), `Bearer ${accessToken}`);
    return new Response('{"message":"Forbidden"}', { status: 403 });
  };
  assert.equal((await authenticatedJsonFetch('https://api.example.invalid/api/private')).status, 403);
  assert.equal(auth.getToken(), accessToken);
  globalThis.fetch = async () => new Response('{"message":"Expired"}', { status: 401 });
  assert.equal((await authenticatedJsonFetch('https://api.example.invalid/api/private')).status, 401);
  assert.equal(auth.getToken(), null);
});
test('an old 401 cannot erase a newly signed-in session', async () => {
  auth.setToken(token());
  const newToken = token(Math.floor(Date.now() / 1000) + 7200);
  globalThis.fetch = async () => {
    auth.setToken(newToken);
    return new Response('{"message":"Expired"}', { status: 401 });
  };
  await authenticatedJsonFetch('https://api.example.invalid/api/private');
  assert.equal(auth.getToken(), newToken);
});
test('does not send protected requests after local expiry', async () => {
  localStorage.setItem(TOKEN_KEY, token(1));
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response('{}'); };
  await assert.rejects(authenticatedJsonFetch('https://api.example.invalid/api/private'), /sign in again/);
  assert.equal(calls, 0);
});
test('reports offline and malformed proxy responses without discarding a draft', async () => {
  const draft = { title: 'Broken streetlights', description: 'The streetlights have stopped working near the community park.' };
  const original = structuredClone(draft);
  globalThis.fetch = async () => { throw new TypeError('Network failure'); };
  await assert.rejects(jsonFetch('https://api.example.invalid/api/ai/improve-problem', { body: JSON.stringify(draft) }), /Check your connection/);
  globalThis.fetch = async () => new Response('<html>proxy error</html>', { status: 503 });
  await assert.rejects(jsonFetch('https://api.example.invalid/api/ai/improve-problem'), /temporarily unavailable/);
  assert.deepEqual(draft, original);
});
test('aborts a hung connection at its deadline', async () => {
  globalThis.fetch = async (_url, options) => new Promise((_resolve, reject) => options?.signal?.addEventListener('abort', () => reject(new Error('Aborted'))));
  await assert.rejects(jsonFetch('https://api.example.invalid/api/private', {}, 10), /timed out/);
});
test('keeps the deadline active while a response body is hanging', async () => {
  globalThis.fetch = async (_url, options) => ({ text: () => new Promise((_resolve, reject) => options?.signal?.addEventListener('abort', () => reject(new Error('Aborted')))) }) as Response;
  await assert.rejects(jsonFetch('https://api.example.invalid/api/private', {}, 10), /timed out/);
});
