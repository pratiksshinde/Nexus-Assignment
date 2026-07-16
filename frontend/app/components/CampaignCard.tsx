"use client";

import { useState } from "react";
import { sendCampaign } from "../services/campaignService";
import type { Campaign } from "../types";
import { displayDate, errorMessage } from "../utils";

export default function CampaignCard({
  campaign,
  reload,
  notice,
}: {
  campaign: Campaign;
  reload: () => Promise<void>;
  notice: (text: string) => void;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
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
      <p className="hint">Accepted means Brevo accepted the request. Opens can include mailbox privacy scans.</p>
      <div className="campaign-actions">
        {campaign.status === "draft" && (
          <div className="inline">
            <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
            <button onClick={send} disabled={sending}>
              {sending ? "Queueing…" : scheduledAt ? "Schedule" : "Send now"}
            </button>
          </div>
        )}
        <button className="secondary small" onClick={() => setDetailsOpen((open) => !open)}>
          {detailsOpen ? "Hide recipients" : "View recipients"}
        </button>
      </div>
      {detailsOpen && (
        <div className="table-wrap recipient-table">
          <table>
            <thead><tr><th>Recipient</th><th>Status</th><th>Accepted</th><th>Delivered</th><th>Opened / failed</th></tr></thead>
            <tbody>
              {(campaign.recipients || []).map((recipient) => (
                <tr key={recipient.id}>
                  <td>{recipient.name && <><strong>{recipient.name}</strong><br /></>}{recipient.email}</td>
                  <td><span className={`status ${recipient.status}`}>{recipient.status}</span></td>
                  <td>{displayDate(recipient.sent_at)}</td>
                  <td>{displayDate(recipient.delivered_at)}</td>
                  <td>
                    {displayDate(recipient.opened_at || recipient.failed_at)}
                    {recipient.failure_reason && <div className="error detail">{recipient.failure_reason}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}
