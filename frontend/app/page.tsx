"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, setAuthToken } from "./lib/api";

type Tag = { id: number; name: string; contact_count?: number };
type Contact = { id: number; name: string; email?: string; phone?: string; city?: string; tags: Tag[] };
type Audience = { id: number; name: string; contact_count: number; filter_definition: Record<string, unknown> };
type CampaignRecipient = {
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
type Campaign = { id: number; name: string; subject: string; status: string; scheduled_at?: string; analytics: Record<string, number>; recipients: CampaignRecipient[] };
type RecipientPreview = { input: string; matched: boolean; sendable: boolean; contact: Contact | null };

const errorMessage = (error: unknown) => error instanceof Error ? error.message : "Something went wrong";
const displayDate = (value?: string) => value ? new Date(value).toLocaleString() : "—";

function Auth({ onDone }: { onDone: () => void }) {
  const [register, setRegister] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError("");
    try {
      const result = await api(`/auth/${register ? "register" : "login"}`, { method: "POST", body: JSON.stringify(values) });
      setAuthToken(result.data.token);
      await onDone();
    } catch (caught) { setError(errorMessage(caught)); }
    finally { setBusy(false); }
  }

  return <main className="auth-shell">
    <form className="card auth-card" onSubmit={submit}>
      <h1>Nexus Mail</h1>
      <p>{register ? "Create your workspace" : "Sign in to your workspace"}</p>
      {register && <><input name="name" placeholder="Your name" required /><input name="company_name" placeholder="Company name" required /></>}
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" minLength={8} required />
      {error && <p className="error">{error}</p>}
      <button disabled={busy}>{busy ? "Please wait…" : register ? "Create account" : "Sign in"}</button>
      <button className="link" type="button" disabled={busy} onClick={() => setRegister(!register)}>
        {register ? "Already have an account?" : "Need an account?"}
      </button>
    </form>
  </main>;
}

function ContactTags({ contact, tags, reload, notice }: { contact: Contact; tags: Tag[]; reload: () => void; notice: (text: string) => void }) {
  const [selected, setSelected] = useState(contact.tags.map((tag) => tag.id));
  const [saving, setSaving] = useState(false);
  return <div className="tag-editor">
    {tags.map((tag) => <label key={tag.id}><input type="checkbox" disabled={saving} checked={selected.includes(tag.id)} onChange={() => setSelected((ids) => ids.includes(tag.id) ? ids.filter((id) => id !== tag.id) : [...ids, tag.id])} />{tag.name}</label>)}
    <button className="small" onClick={async () => {
      setSaving(true);
      try { await api(`/contacts/${contact.id}/tags`, { method: "PUT", body: JSON.stringify({ tag_ids: selected }) }); await reload(); }
      catch (caught) { notice(errorMessage(caught)); }
      finally { setSaving(false); }
    }} disabled={saving}>{saving ? "Saving…" : "Save tags"}</button>
  </div>;
}

function Contacts({ contacts, tags, reload, notice }: { contacts: Contact[]; tags: Tag[]; reload: () => void; notice: (text: string) => void }) {
  const [busy, setBusy] = useState("");

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      setBusy("contact");
      const values = Object.fromEntries(new FormData(form));
      values.custom_fields = values.custom_fields ? JSON.parse(String(values.custom_fields)) : {};
      await api("/contacts", { method: "POST", body: JSON.stringify(values) });
      form.reset(); await reload();
    } catch (caught) { notice(errorMessage(caught)); }
    finally { setBusy(""); }
  }
  async function importCsv(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      setBusy("import");
      const result = await api("/contacts/import", { method: "POST", body: new FormData(form) });
      notice(`${result.data.added} added, ${result.data.skipped} skipped`); form.reset(); await reload();
    } catch (caught) { notice(errorMessage(caught)); }
    finally { setBusy(""); }
  }
  async function createTag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget;
    try {
      setBusy("tag");
      await api("/tags", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      form.reset(); await reload();
    } catch (caught) { notice(errorMessage(caught)); }
    finally { setBusy(""); }
  }
  async function edit(contact: Contact) {
    const name = window.prompt("Name", contact.name);
    if (name === null) return;
    const email = window.prompt("Email", contact.email || "");
    if (email === null) return;
    const phone = window.prompt("Phone", contact.phone || "");
    if (phone === null) return;
    const city = window.prompt("City", contact.city || "");
    if (city === null) return;
    try { await api(`/contacts/${contact.id}`, { method: "PATCH", body: JSON.stringify({ name, email, phone, city }) }); reload(); }
    catch (caught) { notice(errorMessage(caught)); }
  }
  return <section>
    <h2>Contacts</h2>
    <div className="grid two">
      <form className="card" onSubmit={create}><h3>Add contact</h3><input name="name" placeholder="Name" required disabled={Boolean(busy)} /><input name="email" type="email" placeholder="Email" disabled={Boolean(busy)} /><input name="phone" placeholder="Phone" disabled={Boolean(busy)} /><input name="city" placeholder="City" disabled={Boolean(busy)} /><textarea name="custom_fields" placeholder='Custom fields JSON, e.g. {"plan":"pro"}' rows={2} disabled={Boolean(busy)} /><button disabled={Boolean(busy)}>{busy === "contact" ? "Adding…" : "Add contact"}</button></form>
      <div className="stack"><form className="card" onSubmit={importCsv}><h3>Import CSV</h3><input name="file" type="file" accept=".csv,text/csv" required disabled={Boolean(busy)} /><button disabled={Boolean(busy)}>{busy === "import" ? "Importing…" : "Import"}</button></form><form className="card inline" onSubmit={createTag}><input name="name" placeholder="New tag" required disabled={Boolean(busy)} /><button disabled={Boolean(busy)}>{busy === "tag" ? "Creating…" : "Create tag"}</button></form></div>
    </div>
    <div className="card table-wrap"><table><thead><tr><th>Name</th><th>Email / phone</th><th>City</th><th>Tags</th><th /></tr></thead><tbody>{contacts.map((contact) => <tr key={contact.id}><td>{contact.name}</td><td>{contact.email || contact.phone}</td><td>{contact.city || "—"}</td><td><ContactTags contact={contact} tags={tags} reload={reload} notice={notice} /></td><td><div className="inline"><button className="small" onClick={() => edit(contact)}>Edit</button><button className="danger small" onClick={async () => {
      try { await api(`/contacts/${contact.id}`, { method: "DELETE" }); reload(); }
      catch (caught) { notice(errorMessage(caught)); }
    }}>Delete</button></div></td></tr>)}</tbody></table></div>
  </section>;
}

function Audiences({ audiences, tags, reload, notice }: { audiences: Audience[]; tags: Tag[]; reload: () => void; notice: (text: string) => void }) {
  const [type, setType] = useState("city");
  const [busy, setBusy] = useState(false);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const values = Object.fromEntries(new FormData(form));
    try {
      setBusy(true);
      await api("/audiences", { method: "POST", body: JSON.stringify({ name: values.name, filter_definition: { type, operator: type === "city" ? values.operator : "equals", value: values.value, ...(type === "custom_field" && { field: values.field }) } }) });
      form.reset(); await reload();
    } catch (caught) { notice(errorMessage(caught)); }
    finally { setBusy(false); }
  }
  return <section><h2>Audiences</h2><form className="card" onSubmit={create}><h3>Save a filtered audience</h3><div className="form-row"><input name="name" placeholder="Audience name" required disabled={busy} /><select value={type} disabled={busy} onChange={(event) => setType(event.target.value)}><option value="city">City</option><option value="tag">Tag</option><option value="custom_field">Custom field</option></select>{type === "custom_field" && <input name="field" placeholder="Field name" required disabled={busy} />}{type === "tag" ? <select name="value" required disabled={busy}><option value="">Choose tag</option>{tags.map((tag) => <option value={tag.id} key={tag.id}>{tag.name}</option>)}</select> : <input name="value" placeholder="Value" required disabled={busy} />}{type === "city" && <select name="operator" disabled={busy}><option value="equals">Equals</option><option value="contains">Contains</option></select>}<button disabled={busy}>{busy ? "Saving…" : "Save audience"}</button></div></form>
    <div className="cards">{audiences.map((audience) => <article className="card" key={audience.id}><h3>{audience.name}</h3><strong>{audience.contact_count} contacts</strong><pre>{JSON.stringify(audience.filter_definition)}</pre><button className="danger small" onClick={async () => {
      try { await api(`/audiences/${audience.id}`, { method: "DELETE" }); reload(); }
      catch (caught) { notice(errorMessage(caught)); }
    }}>Delete</button></article>)}</div>
  </section>;
}

function Campaigns({ campaigns, audiences, tags, reload, notice }: { campaigns: Campaign[]; audiences: Audience[]; tags: Tag[]; reload: () => void; notice: (text: string) => void }) {
  const [source, setSource] = useState("audience");
  const [manual, setManual] = useState("");
  const [preview, setPreview] = useState<RecipientPreview[]>([]);
  const [schedule, setSchedule] = useState<Record<number, string>>({});
  const [expanded, setExpanded] = useState<number | null>(null);
  const [busy, setBusy] = useState("");
  const identifiers = [...new Set(manual.split(/[\n,;]+/).map((value) => value.trim()).filter(Boolean))];

  async function previewManual() {
    try {
      setBusy("preview");
      const result = await api("/campaigns/recipients/preview", { method: "POST", body: JSON.stringify({ identifiers }) });
      setPreview(result.data.recipients);
    } catch (caught) { notice(errorMessage(caught)); }
    finally { setBusy(""); }
  }
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const values = Object.fromEntries(new FormData(form));
    if (source === "manual" && (preview.length !== identifiers.length || preview.some((item, index) => item.input !== identifiers[index]))) {
      return notice("Match the pasted recipients before creating the campaign");
    }
    try {
      setBusy("create");
      const recipient_source_data = source === "manual" ? { identifiers } : { id: Number(values.source_id) };
      await api("/campaigns", { method: "POST", body: JSON.stringify({ name: values.name, subject: values.subject, body_html: values.body_html, recipient_source: source, recipient_source_data }) });
      form.reset(); setManual(""); setPreview([]); await reload(); notice("Campaign draft created");
    } catch (caught) { notice(errorMessage(caught)); }
    finally { setBusy(""); }
  }
  return <section><h2>Campaigns</h2><form className="card" onSubmit={create}><h3>Create campaign</h3><input name="name" placeholder="Campaign name" required disabled={Boolean(busy)} /><input name="subject" placeholder="Email subject" required disabled={Boolean(busy)} /><textarea name="body_html" placeholder="Email body (HTML is allowed)" rows={6} required disabled={Boolean(busy)} /><select value={source} disabled={Boolean(busy)} onChange={(event) => { setSource(event.target.value); setPreview([]); }}><option value="audience">Audience</option><option value="tag">Tag</option><option value="manual">Paste emails or phones</option></select>{source === "audience" && <select name="source_id" required disabled={Boolean(busy)}><option value="">Choose audience</option>{audiences.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.contact_count})</option>)}</select>}{source === "tag" && <select name="source_id" required disabled={Boolean(busy)}><option value="">Choose tag</option>{tags.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}{source === "manual" && <><textarea value={manual} disabled={Boolean(busy)} onChange={(event) => setManual(event.target.value)} placeholder="One email or phone per line" rows={5} required /><button type="button" className="secondary" disabled={Boolean(busy)} onClick={previewManual}>{busy === "preview" ? "Matching…" : "Match recipients"}</button>{preview.length > 0 && <ul className="preview">{preview.map((item) => <li className={item.sendable ? "ok" : "error"} key={item.input}>{item.input} — {item.contact?.name || "not matched"}{item.matched && !item.sendable ? " (no email)" : ""}</li>)}</ul>}</>}<button disabled={Boolean(busy)}>{busy === "create" ? "Creating…" : "Create draft"}</button></form>
    <div className="cards">{campaigns.map((campaign) => <article className="card" key={campaign.id}><div className="spread"><div><h3>{campaign.name}</h3><p>{campaign.subject}</p></div><span className={`status ${campaign.status}`}>{campaign.status}</span></div><div className="metrics"><span>Recipients <b>{campaign.analytics.recipients}</b></span><span>Sent <b>{campaign.analytics.sent}</b></span><span>Delivered <b>{campaign.analytics.delivered}</b></span><span>Opened <b>{campaign.analytics.opened}</b></span><span>Failed <b>{campaign.analytics.failed}</b></span></div>{campaign.status === "draft" && <div className="inline"><input type="datetime-local" value={schedule[campaign.id] || ""} onChange={(event) => setSchedule({ ...schedule, [campaign.id]: event.target.value })} /><button onClick={async () => {
      setBusy(`send-${campaign.id}`);
      try {
        await api(`/campaigns/${campaign.id}/send`, { method: "POST", body: JSON.stringify(schedule[campaign.id] ? { scheduled_at: new Date(schedule[campaign.id]).toISOString() } : {}) });
        await reload();
      } catch (caught) { notice(errorMessage(caught)); }
      finally { setBusy(""); }
    }} disabled={Boolean(busy)}>{busy === `send-${campaign.id}` ? "Queueing…" : schedule[campaign.id] ? "Schedule" : "Send now"}</button></div>}<button className="secondary small" onClick={() => setExpanded(expanded === campaign.id ? null : campaign.id)}>{expanded === campaign.id ? "Hide recipients" : "View recipients"}</button>{expanded === campaign.id && <div className="table-wrap recipient-table"><table><thead><tr><th>Recipient</th><th>Status</th><th>Sent</th><th>Delivered</th><th>Opened / failed</th></tr></thead><tbody>{(campaign.recipients || []).map((recipient) => <tr key={recipient.id}><td>{recipient.name && <strong>{recipient.name}<br /></strong>}{recipient.email}</td><td><span className={`status ${recipient.status}`}>{recipient.status}</span></td><td>{displayDate(recipient.sent_at)}</td><td>{displayDate(recipient.delivered_at)}</td><td>{displayDate(recipient.opened_at || recipient.failed_at)}{recipient.failure_reason && <div className="error detail">{recipient.failure_reason}</div>}</td></tr>)}</tbody></table></div>}</article>)}</div>
  </section>;
}

export default function Home() {
  const [ready, setReady] = useState(false); const [user, setUser] = useState<{ name: string } | null>(null); const [tab, setTab] = useState("contacts"); const [message, setMessage] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]); const [tags, setTags] = useState<Tag[]>([]); const [audiences, setAudiences] = useState<Audience[]>([]); const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const loadContacts = useCallback(async () => {
    const result = await api("/contacts?limit=100");
    setContacts(result.data.contacts);
  }, []);
  const loadTags = useCallback(async () => {
    const result = await api("/tags");
    setTags(result.data.tags);
  }, []);
  const loadAudiences = useCallback(async () => {
    const result = await api("/audiences");
    setAudiences(result.data.audiences);
  }, []);
  const loadCampaigns = useCallback(async () => {
    const result = await api("/campaigns");
    setCampaigns(result.data.campaigns);
  }, []);
  const load = useCallback(async () => {
    await Promise.all([loadContacts(), loadTags(), loadAudiences(), loadCampaigns()]);
  }, [loadContacts, loadTags, loadAudiences, loadCampaigns]);
  const reloadContacts = useCallback(async () => {
    await Promise.all([loadContacts(), loadTags(), loadAudiences()]);
  }, [loadContacts, loadTags, loadAudiences]);
  const authenticate = useCallback(async () => {
    try {
      const result = await api("/auth/me");
      setUser(result.data.user);
      try { await load(); } catch (caught) { setMessage(errorMessage(caught)); }
    } catch { setUser(null); }
    finally { setReady(true); }
  }, [load]);
  useEffect(() => {
    api("/auth/me")
      .then(async (result) => {
        setUser(result.data.user);
        try { await load(); } catch (caught) { setMessage(errorMessage(caught)); }
      })
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, [load]);
  useEffect(() => {
    if (!user || tab !== "campaigns") return;
    const timer = setInterval(() => {
      loadCampaigns().catch(() => undefined);
    }, 5000);
    return () => clearInterval(timer);
  }, [user, tab, loadCampaigns]);
  if (!ready) return <main className="auth-shell">Loading…</main>;
  if (!user) return <Auth onDone={authenticate} />;
  return <><header><strong>Nexus Mail</strong><nav>{["contacts", "audiences", "campaigns"].map((item) => <button className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>{item}</button>)}</nav><div>{user.name} <button className="link" onClick={async () => { await api("/auth/logout", { method: "POST" }); setAuthToken(null); setUser(null); }}>Log out</button></div></header><main className="container">{message && <div className="notice" onClick={() => setMessage("")}>{message}</div>}{tab === "contacts" && <Contacts contacts={contacts} tags={tags} reload={reloadContacts} notice={setMessage} />}{tab === "audiences" && <Audiences audiences={audiences} tags={tags} reload={loadAudiences} notice={setMessage} />}{tab === "campaigns" && <Campaigns campaigns={campaigns} audiences={audiences} tags={tags} reload={loadCampaigns} notice={setMessage} />}</main></>;
}
