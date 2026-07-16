import { api } from "./api";

export const getAudiences = () => api("/audiences");
export const createAudience = (values) => api("/audiences", { method: "POST", body: JSON.stringify(values) });
export const deleteAudience = (id) => api(`/audiences/${id}`, { method: "DELETE" });
