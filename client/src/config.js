// Shared API & Socket configuration
// In production (Vercel), reads from VITE_API_BASE_URL env variable
// In development, falls back to localhost:5000 (proxied by vite.config.js)

export const API_BASE = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api`
    : 'http://localhost:5000/api';

export const SOCKET_URL = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL
    : 'http://localhost:5000';
