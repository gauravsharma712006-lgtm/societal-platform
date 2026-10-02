import { auth } from './auth';

const API_URL = 'http://localhost:5000/api';

const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
) => {
  const token = auth.getToken();

  const headers = new Headers(options.headers);

  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

export const api = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
  }) => {
    const response = await fetch(
      `${API_URL}/auth/register`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || 'Registration failed'
      );
    }

    return result;
  },

  login: async (data: {
    email: string;
    password: string;
  }) => {
    const response = await fetch(
      `${API_URL}/auth/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || 'Login failed'
      );
    }

    return result;
  },

  getMe: async () => {
    const response = await authenticatedFetch(
      `${API_URL}/auth/me`,
      {
        method: 'GET',
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || 'Failed to fetch current user'
      );
    }

    return result;
  },
};