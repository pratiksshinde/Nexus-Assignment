import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { serverApi } from "../../services/serverApi";
import type { Campaign, CampaignRecipient } from "../../types";
import { displayDate, friendlyDeliveryReason } from "../../utils";

const statuses = ["all", "pending", "queued", "sent", "delivered", "opened", "failed", "bounced"];

export default async function CampaignDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const page = Math.max(1, Number(query.page) || 1);
  const status = statuses.includes(query.status || "") ? query.status || "all" : "all";
  const search = query.search?.trim() || "";
  const qs = new URLSearchParams({ page: String(page), limit: "10", status });
  if (search) qs.set("search", search);

  let result;
  try {
    result = await serverApi(`/campaigns/${id}?${qs}`);
  } catch (error) {
    if (error instanceof Error && error.message === "AUTH_REQUIRED") redirect("/");
    if (error instanceof Error && error.message === "NOT_FOUND") notFound();
    throw error;
  }

  const campaign: Campaign = result.data.campaign;
  const recipients: CampaignRecipient[] = result.data.recipients;
  const analytics: Record<string, number> = result.data.analytics;
  const pagination: { page: number; pages: number; total: number } = result.data.pagination;
  const pageHref = (nextPage: number) => {
    const next = new URLSearchParams(qs);
    next.set("page", String(nextPage));
    return `/campaigns/${id}?${next}`;
  };

  return (
    <main className="container detail-page">
      <div className="detail-header">
        <div>
          <Link className="back-link" href="/?tab=campaigns">← Back to campaigns</Link>
          <h1>{campaign.name}</h1>
          <p>{campaign.subject}</p>
        </div>
        <span className={`status ${campaign.status}`}>{campaign.status}</span>
      </div>

      <div className="metrics card">
        <span>Recipients <b>{analytics.recipients}</b></span>
        <span>Accepted <b>{analytics.sent}</b></span>
        <span>Delivered <b>{analytics.delivered}</b></span>
        <span>Opened <b>{analytics.opened}</b></span>
        <span>Failed <b>{analytics.failed}</b></span>
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
              {recipients.map((recipient) => (
                <tr key={recipient.id}>
                  <td>{recipient.name && <><strong>{recipient.name}</strong><br /></>}{recipient.email}</td>
                  <td className="status-column"><span className={`status ${recipient.status}`}>{recipient.status}</span></td>
                  <td>{displayDate(recipient.sent_at)}</td>
                  <td>{displayDate(recipient.delivered_at)}</td>
                  <td>{displayDate(recipient.opened_at)}</td>
                  <td>{friendlyDeliveryReason(recipient.failure_reason)}</td>
                </tr>
              ))}
              {!recipients.length && <tr><td colSpan={6} className="empty-state">No recipients match these filters.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span>Showing page {pagination.page} of {pagination.pages} · {pagination.total} results</span>
          <div>
            {pagination.page > 1 && <Link className="button secondary small" href={pageHref(pagination.page - 1)}>Previous</Link>}
            {pagination.page < pagination.pages && <Link className="button small" href={pageHref(pagination.page + 1)}>Next</Link>}
          </div>
        </div>
      </section>
    </main>
  );
}
