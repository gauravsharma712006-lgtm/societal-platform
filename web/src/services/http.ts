import { auth } from './auth';

// Bound both connection time and reading the JSON body, including proxy errors.
export const jsonFetch = async (url: string, options: RequestInit = {}, timeoutMs = 20_000): Promise<Response> => {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (options.signal?.aborted) abort();
  options.signal?.addEventListener('abort', abort, { once: true });
  const deadline = setTimeout(abort, timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const body = await response.text();
    if (response.status !== 204) {
      try { JSON.parse(body); } catch {
        throw new Error(response.ok ? 'The server returned an invalid response. Please try again.' : 'The service is temporarily unavailable. Please try again.');
      }
    }
    return new Response(response.status === 204 ? null : body, { status: response.status, statusText: response.statusText, headers: response.headers });
  } catch (error) {
    if (controller.signal.aborted) {
      const timeout = new Error('The request timed out. Please try again.');
      timeout.name = 'AbortError';
      throw timeout;
    }
    if (error instanceof TypeError) throw new Error('Unable to connect. Check your connection and try again.');
    throw error;
  } finally {
    clearTimeout(deadline);
    options.signal?.removeEventListener('abort', abort);
  }
};
export const authenticatedJsonFetch = async (url: string, options: RequestInit = {}, timeoutMs = 20_000): Promise<Response> => {
  const token = auth.getToken();
  if (!token) throw new Error('Your session expired. Please sign in again.');
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${token}`);
  const response = await jsonFetch(url, { ...options, headers }, timeoutMs);
  // An in-flight response from a prior session must not log out a new login.
  if (response.status === 401 && auth.getToken() === token) {
    auth.removeToken('Your session expired or is no longer valid. Please sign in again.');
  }
  return response;
};
