import { api } from "./api";

export const getCampaigns = () => api("/campaigns");
export const createCampaign = (values) => api("/campaigns", { method: "POST", body: JSON.stringify(values) });
export const previewRecipients = (identifiers) =>
  api("/campaigns/recipients/preview", { method: "POST", body: JSON.stringify({ identifiers }) });
export const sendCampaign = (id, scheduledAt) =>
  api(`/campaigns/${id}/send`, {
    method: "POST",
    body: JSON.stringify(scheduledAt ? { scheduled_at: new Date(scheduledAt).toISOString() } : {}),
  });
