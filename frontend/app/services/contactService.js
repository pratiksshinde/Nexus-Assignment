import { apiClient } from "./api";

export const getContacts = () => 
  apiClient.get("/contacts", { params: { limit: 100 } });

export const getTags = () => 
  apiClient.get("/tags");

export const createContact = (values) => 
  apiClient.post("/contacts", values);

export const updateContact = (id, values) => 
  apiClient.patch(`/contacts/${id}`, values);

export const deleteContact = (id) => 
  apiClient.delete(`/contacts/${id}`);

export const importContacts = (formData) => 
  apiClient.post("/contacts/import", formData);

export const createTag = (values) => 
  apiClient.post("/tags", values);

export const updateContactTags = (id, tagIds) =>
  apiClient.put(`/contacts/${id}/tags`, { tag_ids: tagIds });
