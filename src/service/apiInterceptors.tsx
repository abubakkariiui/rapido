import axios from "axios";
import { tokenStorage } from "@/store/store";
import { BASE_URL } from "./config";
import { logout } from "./authService";

export const appAxios = axios.create({
  baseURL: BASE_URL,
});

// Helper to refresh tokens
export const refresh_tokens = async () => {
  try {
    const refreshToken = await tokenStorage.getItem("refresh_token");
    if (!refreshToken) throw new Error("No refresh token available");

    const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
      refresh_token: refreshToken,
    });

    const new_access_token = response.data.access_token;
    const new_refresh_token = response.data.refresh_token;

    await tokenStorage.setItem("access_token", new_access_token);
    await tokenStorage.setItem("refresh_token", new_refresh_token);
    return new_access_token;
  } catch (error) {
    console.error("Error refreshing tokens", error);
    await tokenStorage.removeItem("access_token");
    await tokenStorage.removeItem("refresh_token");
    logout();
    return null;
  }
};

// Axios request interceptor
appAxios.interceptors.request.use(async (config) => {
  try {
    const accessToken = await tokenStorage.getItem("access_token");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  } catch (error) {
    console.error("Error setting Authorization header", error);
    return config;
  }
});

// Axios response interceptor
appAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      try {
        const newAccessToken = await refresh_tokens();
        if (newAccessToken) {
          error.config.headers.Authorization = `Bearer ${newAccessToken}`;
          return axios(error.config); // Retry the failed request
        }
      } catch (refreshError) {
        console.error("Error handling 401 response", refreshError);
      }
    }
    return Promise.reject(error);
  }
);
