export const dynamic = 'force-dynamic';

import { getAppUrl, getCookieName } from '@/utils/env';

export default async function fetchApi(endpoint, options = {}) {
  const isServer = typeof window === 'undefined';
  const url = isServer ? `${getAppUrl()}/api${endpoint}` : `/api${endpoint}`;

  let token = null;

  if (isServer) {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      token = cookieStore.get(getCookieName())?.value || null;
    } catch (error) {
      console.warn('Không thể lấy cookies trên server:', error);
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(isServer && token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const defaultOptions = {
    headers,
    ...options,
  };

  if (defaultOptions.body && typeof defaultOptions.body === 'object') {
    defaultOptions.body = JSON.stringify(defaultOptions.body);
  }    try {
      const response = await fetch(url, defaultOptions);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error fetching ${endpoint}: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      
      throw error;
    }
}