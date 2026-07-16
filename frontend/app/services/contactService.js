import { api } from "./api";

export const getContacts = () => api("/contacts?limit=100");
export const getTags = () => api("/tags");
export const createContact = (values) => api("/contacts", { method: "POST", body: JSON.stringify(values) });
export const updateContact = (id, values) => api(`/contacts/${id}`, { method: "PATCH", body: JSON.stringify(values) });
export const deleteContact = (id) => api(`/contacts/${id}`, { method: "DELETE" });
export const importContacts = (formData) => api("/contacts/import", { method: "POST", body: formData });
export const createTag = (values) => api("/tags", { method: "POST", body: JSON.stringify(values) });
export const updateContactTags = (id, tagIds) =>
  api(`/contacts/${id}/tags`, { method: "PUT", body: JSON.stringify({ tag_ids: tagIds }) });
