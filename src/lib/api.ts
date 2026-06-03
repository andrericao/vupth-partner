import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_URLS: Record<string, string> = {
  local: `http://${process.env.EXPO_PUBLIC_API_LOCAL_IP ?? "192.168.0.16"}:8080`,
  staging: "https://vupth-backend-ia.onrender.com",
  prod: "https://vupth-backend-ia-production.up.railway.app",
};

const env = process.env.EXPO_PUBLIC_API_ENV ?? "staging";
const BASE_URL = API_URLS[env] ?? API_URLS.staging;

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("vupth_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = await SecureStore.getItemAsync("vupth_refresh_token");
      if (!refreshToken) {
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        await SecureStore.setItemAsync(
          "vupth_access_token",
          data.access_token
        );
        await SecureStore.setItemAsync(
          "vupth_refresh_token",
          data.refresh_token
        );

        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch {
        await SecureStore.deleteItemAsync("vupth_access_token");
        await SecureStore.deleteItemAsync("vupth_refresh_token");
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
