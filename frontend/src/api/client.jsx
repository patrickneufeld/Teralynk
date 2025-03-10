// ✅ FILE: frontend/src/api/client.jsx

import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const client = axios.create({
  baseURL: backendUrl,
});

export default client;
