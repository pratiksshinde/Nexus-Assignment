"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getCampaign } from "../../services/campaignService";
import type { Campaign, CampaignRecipient } from "../../types";
import { displayDate, friendlyDeliveryReason } from "../../utils";

const statuses = ["all", "pending", "queued", "sent", "delivered", "opened", "failed", "bounced"];

export default function CampaignDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const status = statuses.includes(searchParams.get("status") || "") ? searchParams.get("status") || "all" : "all";
  const search = searchParams.get("search") || "";
  const [data, setData] = useState<{
    campaign: Campaign;
    recipients: CampaignRecipient[];
    analytics: Record<string, number>;
    pagination: { page: number; pages: number; total: number };
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getCampaign(id, { page, limit: 10, status, search })
      .then((result) => {
        setData(result.data);
        setError("");
      })
      .catch((caught) => setError(caught.message));

    const timer = setInterval(() => {
      getCampaign(id, { page, limit: 10, status, search })
        .then((result) => {
          setData(result.data);
          setError("");
        })
        .catch(() => undefined);
    }, 5000);

    return () => clearInterval(timer);
  }, [id, page, status, search]);

  const pageHref = (nextPage: number) => {
    const next = new URLSearchParams({ page: String(nextPage), status });
    if (search) next.set("search", search);
    return `/campaigns/${id}?${next}`;
  };

  if (error) return <main className="auth-shell"><div className="card error">{error}</div></main>;
  if (!data) return <main className="auth-shell">Loading campaign…</main>;

  return (
    <main className="container detail-page">
      <div className="detail-header">
        <div>
          <Link className="back-link" href="/">← Back to dashboard</Link>
          <h1>{data.campaign.name}</h1>
          <p>{data.campaign.subject}</p>
        </div>
        <span className={`status ${data.campaign.status}`}>{data.campaign.status}</span>
      </div>

      <div className="metrics card">
        <span>Recipients <b>{data.analytics.recipients}</b></span>
        <span>Accepted <b>{data.analytics.sent}</b></span>
        <span>Delivered <b>{data.analytics.delivered}</b></span>
        <span>Opened <b>{data.analytics.opened}</b></span>
        <span>Failed <b>{data.analytics.failed}</b></span>
      </div>

      <section className="card">
        <form className="filters" method="get">
          <input name="search" defaultValue={search} placeholder="Search name or email" />
          <select name="status" defaultValue={status}>
            {statuses.map((item) => <option key={item} value={item}>{item === "all" ? "All statuses" : item}</option>)}
          </select>
          <button>Apply filters</button>
        </form>
        <div className="table-wrap recipient-table">
          <table>
            <thead><tr><th>Recipient</th><th className="status-column">Status</th><th>Accepted</th><th>Delivered</th><th>Opened</th><th>Details</th></tr></thead>
            <tbody>
              {data.recipients.map((recipient) => (
                <tr key={recipient.id}>
                  <td>{recipient.name && <><strong>{recipient.name}</strong><br /></>}{recipient.email}</td>
                  <td className="status-column"><span className={`status ${recipient.status}`}>{recipient.status}</span></td>
                  <td>{displayDate(recipient.sent_at)}</td>
                  <td>{displayDate(recipient.delivered_at)}</td>
                  <td>{displayDate(recipient.opened_at)}</td>
                  <td>{friendlyDeliveryReason(recipient.failure_reason)}</td>
                </tr>
              ))}
              {!data.recipients.length && <tr><td colSpan={6} className="empty-state">No recipients match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span>Showing page {data.pagination.page} of {data.pagination.pages} · {data.pagination.total} results</span>
          <div>
            {data.pagination.page > 1 && <Link className="button secondary small" href={pageHref(data.pagination.page - 1)}>Previous</Link>}
            {data.pagination.page < data.pagination.pages && <Link className="button small" href={pageHref(data.pagination.page + 1)}>Next</Link>}
          </div>
        </div>
      </section>
    </main>
  );
}
