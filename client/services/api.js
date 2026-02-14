import axios from 'axios';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

export const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

const AUTH_READY_TIMEOUT_MS = 3000;

let authReadyResolved = false;
const authReadyPromise = new Promise((resolve) => {
  const unsubscribe = onAuthStateChanged(auth, () => {
    authReadyResolved = true;
    unsubscribe();
    resolve();
  });
});

const waitForAuthReady = async () => {
  if (authReadyResolved) return;
  await Promise.race([
    authReadyPromise,
    new Promise((resolve) => setTimeout(resolve, AUTH_READY_TIMEOUT_MS))
  ]);
};

api.interceptors.request.use(async (config) => {
  if (config.skipAuth) return config;


  config.headers = config.headers || {};
  if (config.headers.Authorization) return config;



  await waitForAuthReady();

  const user = auth.currentUser;
  if (!user) return config;

  try {
    const token = await user.getIdToken();

    if (token) config.headers.Authorization = `Bearer ${token}`;

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

  } catch (error) {
    console.warn('Unable to attach Firebase ID token to request.', error);
  }

  return config;
});

export default api;
