import { apiClient } from "./api";

export const getCurrentUser = () => apiClient.get("/auth/me");
export const login = (values) => apiClient.post("/auth/login", values);
export const register = (values) => apiClient.post("/auth/register", values);
export const logout = () => apiClient.post("/auth/logout");
