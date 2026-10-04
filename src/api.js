import axios from "axios";

export const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://balahadia-pauleen-lavalust-api.onrender.com";

const api = axios.create({ baseURL: API_URL });

export const getTokens = () => ({
  access: localStorage.getItem("access_token"),
  refresh: localStorage.getItem("refresh_token"),
});

export const saveTokens = (tokens) => {
  localStorage.setItem("access_token", tokens.access_token);
  localStorage.setItem("refresh_token", tokens.refresh_token);
};

export const clearTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
};

// Attach the access token to every request
api.interceptors.request.use((config) => {
  const { access } = getTokens();
  if (access) config.headers.Authorization = `Bearer ${access}`;
  return config;
});

// If the access token expired (401), try the refresh token once, then retry
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const { refresh } = getTokens();

    if (
      error.response?.status === 401 &&
      refresh &&
      !original._retried &&
      !original.url.includes("/api/refresh")
    ) {
      original._retried = true;
      try {
        const res = await axios.post(`${API_URL}/api/refresh`, {
          refresh_token: refresh,
        });
        saveTokens(res.data.tokens);
        original.headers.Authorization = `Bearer ${res.data.tokens.access_token}`;
        return api(original);
      } catch {
        clearTokens();
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
