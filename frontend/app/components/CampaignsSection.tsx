"use client";

import { FormEvent, useState } from "react";
import { createCampaign, previewRecipients } from "../services/campaignService";
import type { Audience, Campaign, RecipientPreview, Tag } from "../types";
import { errorMessage } from "../utils";
import CampaignCard from "./CampaignCard";

export default function CampaignsSection({
  campaigns,
  audiences,
  tags,
  reload,
  notice,
}: {
  campaigns: Campaign[];
  audiences: Audience[];
  tags: Tag[];
  reload: () => Promise<void>;
  notice: (text: string) => void;
}) {
  const [source, setSource] = useState("audience");
  const [manual, setManual] = useState("");
  const [preview, setPreview] = useState<RecipientPreview[]>([]);
  const [busy, setBusy] = useState("");
  const identifiers = [...new Set(manual.split(/[\n,;]+/).map((value) => value.trim()).filter(Boolean))];

  async function matchRecipients() {
    setBusy("preview");
    try {
      const result = await previewRecipients(identifiers);
      setPreview(result.data.recipients);
    } catch (caught) {
      notice(errorMessage(caught));
    } finally {
      setBusy("");
    }
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    if (source === "manual" && (preview.length !== identifiers.length || preview.some((item, index) => item.input !== identifiers[index]))) {
      return notice("Match the pasted recipients before creating the campaign");
    }
    setBusy("create");
    try {
      await createCampaign({
        name: values.name,
        subject: values.subject,
        body_html: values.body_html,
        recipient_source: source,
        recipient_source_data: source === "manual" ? { identifiers } : { id: Number(values.source_id) },
      });
      form.reset();
      setManual("");
      setPreview([]);
      await reload();
      notice("Campaign draft created");
    } catch (caught) {
      notice(errorMessage(caught));
    } finally {
      setBusy("");
    }
  }

  return (
    <section>
      <h2>Campaigns</h2>
      <form className="card" onSubmit={create}>
        <h3>Create campaign</h3>
        <input name="name" placeholder="Campaign name" required disabled={Boolean(busy)} />
        <input name="subject" placeholder="Email subject" required disabled={Boolean(busy)} />
        <textarea name="body_html" placeholder="Email body (HTML is allowed)" rows={6} required disabled={Boolean(busy)} />
        <select value={source} disabled={Boolean(busy)} onChange={(event) => { setSource(event.target.value); setPreview([]); }}>
          <option value="audience">Audience</option>
          <option value="tag">Tag</option>
          <option value="manual">Paste emails or phones</option>
        </select>
        {source === "audience" && (
          <select name="source_id" required disabled={Boolean(busy)}>
            <option value="">Choose audience</option>
            {audiences.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.contact_count})</option>)}
          </select>
        )}
        {source === "tag" && (
          <select name="source_id" required disabled={Boolean(busy)}>
            <option value="">Choose tag</option>
            {tags.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        )}
        {source === "manual" && (
          <>
            <textarea value={manual} disabled={Boolean(busy)} onChange={(event) => setManual(event.target.value)} placeholder="One email or phone per line" rows={5} required />
            <button type="button" className="secondary" disabled={Boolean(busy)} onClick={matchRecipients}>
              {busy === "preview" ? "Matching…" : "Match recipients"}
            </button>
            {preview.length > 0 && (
              <ul className="preview">
                {preview.map((item) => (
                  <li className={item.sendable ? "ok" : "error"} key={item.input}>
                    {item.input} — {item.contact?.name || "not matched"}{item.matched && !item.sendable ? " (no email)" : ""}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        <button disabled={Boolean(busy)}>{busy === "create" ? "Creating…" : "Create draft"}</button>
      </form>
      <div className="campaign-list">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} reload={reload} notice={notice} />
        ))}
      </div>
    </section>
  );
}
