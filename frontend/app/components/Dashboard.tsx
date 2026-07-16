"use client";

import { useCallback, useState } from "react";
import { getAudiences } from "../services/audienceService";
import { logout } from "../services/authService";
import { getCampaigns } from "../services/campaignService";
import { getContacts, getTags } from "../services/contactService";
import type { Audience, Campaign, Contact, DashboardData, Tag, User } from "../types";
import AppHeader from "./AppHeader";
import AudiencesSection from "./AudiencesSection";
import AuthForm from "./AuthForm";
import CampaignsSection from "./CampaignsSection";
import ContactsSection from "./ContactsSection";

export default function Dashboard({
  initialData,
  initialTab,
}: {
  initialData: DashboardData | null;
  initialTab: string;
}) {
  const [user, setUser] = useState<User | null>(initialData?.user || null);
  const [tab, setTab] = useState(initialTab);
  const [message, setMessage] = useState("");
  const [contacts, setContacts] = useState<Contact[]>(initialData?.contacts || []);
  const [tags, setTags] = useState<Tag[]>(initialData?.tags || []);
  const [audiences, setAudiences] = useState<Audience[]>(initialData?.audiences || []);
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialData?.campaigns || []);

  const loadContacts = useCallback(async () => {
    const result = await getContacts();
    setContacts(result.data.contacts);
  }, []);

  const loadTags = useCallback(async () => {
    const result = await getTags();
    setTags(result.data.tags);
  }, []);

  const loadAudiences = useCallback(async () => {
    const result = await getAudiences();
    setAudiences(result.data.audiences);
  }, []);

  const loadCampaigns = useCallback(async () => {
    const result = await getCampaigns();
    setCampaigns(result.data.campaigns);
  }, []);

  const reloadContacts = useCallback(
    () => Promise.all([loadContacts(), loadTags(), loadAudiences()]).then(() => undefined),
    [loadContacts, loadTags, loadAudiences],
  );

  async function signOut() {
    try { await logout(); } finally { setUser(null); }
  }

  if (!user) return <AuthForm onDone={async () => window.location.reload()} />;

  return (
    <>
      <AppHeader activeTab={tab} userName={user.name} onTabChange={setTab} onLogout={signOut} />
      <main className="container">
        {message && <div className="notice" onClick={() => setMessage("")}>{message}</div>}
        {tab === "contacts" && <ContactsSection contacts={contacts} tags={tags} reload={reloadContacts} notice={setMessage} />}
        {tab === "audiences" && <AudiencesSection audiences={audiences} tags={tags} reload={loadAudiences} notice={setMessage} />}
        {tab === "campaigns" && <CampaignsSection campaigns={campaigns} audiences={audiences} tags={tags} reload={loadCampaigns} notice={setMessage} />}
      </main>
    </>
  );
}
