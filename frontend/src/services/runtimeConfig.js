const explicitApiBase = import.meta.env.VITE_API_BASE_URL;

// Default to same-origin API so mobile/ngrok can work without pointing to localhost.
export const API_BASE_URL = explicitApiBase || '/api';

// Used for static assets (/uploads/...) and Socket.IO connection.
export const SERVER_BASE_URL =
  import.meta.env.VITE_SERVER_BASE_URL ||
  (explicitApiBase
    ? explicitApiBase.replace(/\/api\/?$/, '')
    : window.location.origin);
