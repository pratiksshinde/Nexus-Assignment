import Dashboard from "./components/Dashboard";
import { serverApi } from "./services/serverApi";
import type { DashboardData } from "./types";

async function getDashboardData(): Promise<DashboardData | null> {
  try {
    const [auth, contacts, tags, audiences, campaigns] = await Promise.all([
      serverApi("/auth/me"),
      serverApi("/contacts?limit=100"),
      serverApi("/tags"),
      serverApi("/audiences"),
      serverApi("/campaigns"),
    ]);

    return {
      user: auth.data.user,
      contacts: contacts.data.contacts,
      tags: tags.data.tags,
      audiences: audiences.data.audiences,
      campaigns: campaigns.data.campaigns,
    };
  } catch {
    return null;
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const initialTab = tab && ["contacts", "audiences", "campaigns"].includes(tab) ? tab : "contacts";
  return <Dashboard initialData={await getDashboardData()} initialTab={initialTab} />;
}
