export type User = { name: string };
export type Tag = { id: number; name: string; contact_count?: number };
export type Contact = { id: number; name: string; email?: string; phone?: string; city?: string; tags: Tag[] };
export type Audience = { id: number; name: string; contact_count: number; filter_definition: Record<string, unknown> };
export type CampaignRecipient = {
  id: number;
  name?: string;
  email: string;
  status: string;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  failed_at?: string;
  failure_reason?: string;
};
export type Campaign = {
  id: number;
  name: string;
  subject: string;
  status: string;
  scheduled_at?: string;
  analytics: Record<string, number>;
  recipients?: CampaignRecipient[];
};
export type RecipientPreview = { input: string; matched: boolean; sendable: boolean; contact: Contact | null };
