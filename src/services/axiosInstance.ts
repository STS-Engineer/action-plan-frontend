import axios from "axios";
import { storeRedirect } from "../utils/actionDeepLink";

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}`,
  headers: {
    "Content-Type": "application/json",
  },
});

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const LEGACY_TOKEN_KEY = "token";
const SESSION_EXPIRED_MESSAGE_KEY = "sessionExpiredMessage";

const refreshClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}`,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<string> | null = null;

export const getStoredAccessToken = () => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);

  if (!accessToken && legacyToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, legacyToken);
    return legacyToken;
  }

  return accessToken;
};

export const getStoredRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const storeAuthTokens = (payload: {
  access_token?: string;
  refresh_token?: string;
}) => {
  if (payload.access_token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, payload.access_token);
  }

  if (payload.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, payload.refresh_token);
  }

  localStorage.removeItem(LEGACY_TOKEN_KEY);
};

export const clearAuthTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem("user");
};

export const getSessionExpiredMessage = () => (
  localStorage.getItem(SESSION_EXPIRED_MESSAGE_KEY)
);

export const clearSessionExpiredMessage = () => {
  localStorage.removeItem(SESSION_EXPIRED_MESSAGE_KEY);
};

const isAuthEndpoint = (url?: string) => {
  const normalizedUrl = String(url || "");

  return (
    normalizedUrl.includes("/api/auth/login") ||
    normalizedUrl.includes("/api/auth/register") ||
    normalizedUrl.includes("/api/auth/refresh")
  );
};

const redirectToLogin = () => {
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (!window.location.pathname.startsWith("/login")) {
    storeRedirect(currentUrl || "/");
  }

  localStorage.setItem(
    SESSION_EXPIRED_MESSAGE_KEY,
    "Your session expired. Please log in again."
  );
  clearAuthTokens();

  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
};

const refreshAccessToken = async () => {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    throw new Error("Missing refresh token.");
  }

  refreshPromise = refreshClient
    .post("/api/auth/refresh", {
      refresh_token: refreshToken,
    })
    .then((response) => {
      const nextAccessToken = response.data?.access_token;

      if (!nextAccessToken) {
        throw new Error("Refresh response did not include an access token.");
      }

      storeAuthTokens({
        access_token: nextAccessToken,
        refresh_token: response.data?.refresh_token,
      });

      return nextAccessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

axiosInstance.interceptors.request.use((config) => {
  const token = getStoredAccessToken();
  config.headers = config.headers || {};

  if (isAuthEndpoint(config.url)) {
    delete config.headers.Authorization;
  } else if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config || {};
    const status = error?.response?.status;

    if (
      status !== 401 ||
      originalRequest._retry ||
      isAuthEndpoint(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const nextAccessToken = await refreshAccessToken();
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;

      return axiosInstance(originalRequest);
    } catch (refreshError) {
      redirectToLogin();
      return Promise.reject(refreshError);
    }
  }
);

export default axiosInstance;
