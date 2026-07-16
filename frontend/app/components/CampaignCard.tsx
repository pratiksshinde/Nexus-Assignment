"use client";

import Link from "next/link";
import { useState } from "react";
import { sendCampaign } from "../services/campaignService";
import type { Campaign } from "../types";
import { errorMessage } from "../utils";

export default function CampaignCard({
  campaign,
  reload,
  notice,
}: {
  campaign: Campaign;
  reload: () => Promise<void>;
  notice: (text: string) => void;
}) {
  const [scheduledAt, setScheduledAt] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    setSending(true);
    try {
      await sendCampaign(campaign.id, scheduledAt);
      await reload();
    } catch (caught) {
      notice(errorMessage(caught));
    } finally {
      setSending(false);
    }
  }

  return (
    <article className="card campaign-card">
      <div className="spread">
        <div>
          <h3>{campaign.name}</h3>
          <p>{campaign.subject}</p>
        </div>
        <span className={`status ${campaign.status}`}>{campaign.status}</span>
      </div>
      <div className="metrics">
        <span>Recipients <b>{campaign.analytics.recipients}</b></span>
        <span>Accepted <b>{campaign.analytics.sent}</b></span>
        <span>Delivered <b>{campaign.analytics.delivered}</b></span>
        <span>Open detected <b>{campaign.analytics.opened}</b></span>
        <span>Failed <b>{campaign.analytics.failed}</b></span>
      </div>
      <div className="campaign-actions">
        {campaign.status === "draft" && (
          <div className="inline">
            <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
            <button onClick={send} disabled={sending}>
              {sending ? "Queueing…" : scheduledAt ? "Schedule" : "Send now"}
            </button>
          </div>
        )}
        <Link className="button secondary small" href={`/campaigns/${campaign.id}`}>View details</Link>
      </div>
    </article>
  );
}
