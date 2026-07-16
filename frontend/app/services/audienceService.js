import { apiClient } from "./api";

export const getAudiences = () => apiClient.get("/audiences");
export const createAudience = (values) => apiClient.post("/audiences", values);
export const deleteAudience = (id) => apiClient.delete(`/audiences/${id}`);
