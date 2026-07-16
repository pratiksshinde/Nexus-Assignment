import { api } from "./api";

export const getCurrentUser = () => api("/auth/me");
export const login = (values) => api("/auth/login", { method: "POST", body: JSON.stringify(values) });
export const register = (values) => api("/auth/register", { method: "POST", body: JSON.stringify(values) });
export const logout = () => api("/auth/logout", { method: "POST" });
