import axios from "axios";
import * as SecureStore from "expo-secure-store";

const BASE_URL = "https://vupth-backend-ia.onrender.com";

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
          data.tokens.access_token
        );
        await SecureStore.setItemAsync(
          "vupth_refresh_token",
          data.tokens.refresh_token
        );

        originalRequest.headers.Authorization = `Bearer ${data.tokens.access_token}`;
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
