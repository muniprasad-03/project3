import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});
let accessToken = null;
export const setAccessToken = (token) => {
  accessToken = token;
};
api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});
let refreshing;
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes("/auth/")
    ) {
      original._retry = true;
      try {
        refreshing ||= api
          .post("/auth/refresh")
          .then((r) => {
            setAccessToken(r.data.accessToken);
            return r.data.accessToken;
          })
          .finally(() => {
            refreshing = null;
          });
        const token = await refreshing;
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        setAccessToken(null);
      }
    }
    return Promise.reject(error);
  },
);
export default api;
