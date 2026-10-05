export const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.opyeung.com';

export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('block_base_url');
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '');
    }
    if (process.env.NEXT_PUBLIC_BASE_URL && process.env.NEXT_PUBLIC_BASE_URL.trim()) {
      return process.env.NEXT_PUBLIC_BASE_URL.trim().replace(/\/+$/, '');
    }
    // If running on localhost in development, optionally use window.location.origin
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return window.location.origin;
    }
    return DEFAULT_BASE_URL.replace(/\/+$/, '');
  }
  return DEFAULT_BASE_URL.replace(/\/+$/, '');
}

export function setCustomBaseUrl(url) {
  if (typeof window !== 'undefined') {
    if (!url || !url.trim()) {
      localStorage.removeItem('block_base_url');
    } else {
      localStorage.setItem('block_base_url', url.trim().replace(/\/+$/, ''));
    }
  }
}
