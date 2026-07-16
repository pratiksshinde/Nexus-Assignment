import { apiClient } from "./api";

export const getCampaigns = () => apiClient.get("/campaigns");
export const createCampaign = (values) => apiClient.post("/campaigns", values);
export const previewRecipients = (identifiers) =>
  apiClient.post("/campaigns/recipients/preview", { identifiers });
export const sendCampaign = (id, scheduledAt) =>
  apiClient.post(`/campaigns/${id}/send`, scheduledAt ? { scheduled_at: new Date(scheduledAt).toISOString() } : {});
