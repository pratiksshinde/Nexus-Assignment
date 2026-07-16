"use client";

import { useCallback, useEffect, useState } from "react";
import { getAudiences } from "../services/audienceService";
import { getCurrentUser, logout } from "../services/authService";
import { getCampaigns } from "../services/campaignService";
import { getContacts, getTags } from "../services/contactService";
import type { Audience, Campaign, Contact, Tag, User } from "../types";
import { errorMessage } from "../utils";
import AppHeader from "./AppHeader";
import AudiencesSection from "./AudiencesSection";
import AuthForm from "./AuthForm";
import CampaignsSection from "./CampaignsSection";
import ContactsSection from "./ContactsSection";

export default function Dashboard() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState("contacts");
  const [message, setMessage] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

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

  const loadAll = useCallback(
    () => Promise.all([loadContacts(), loadTags(), loadAudiences(), loadCampaigns()]).then(() => undefined),
    [loadContacts, loadTags, loadAudiences, loadCampaigns],
  );

  const reloadContacts = useCallback(
    () => Promise.all([loadContacts(), loadTags(), loadAudiences()]).then(() => undefined),
    [loadContacts, loadTags, loadAudiences],
  );

  const authenticate = useCallback(async () => {
    try {
      const result = await getCurrentUser();
      setUser(result.data.user);
      await loadAll();
    } catch (caught) {
      setUser(null);
      setMessage(errorMessage(caught));
    } finally {
      setReady(true);
    }
  }, [loadAll]);

  useEffect(() => {
    getCurrentUser()
      .then(async (result) => {
        setUser(result.data.user);
        await loadAll();
      })
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, [loadAll]);

  useEffect(() => {
    if (!user || tab !== "campaigns") return;
    const timer = setInterval(() => loadCampaigns().catch(() => undefined), 5000);
    return () => clearInterval(timer);
  }, [user, tab, loadCampaigns]);

  async function signOut() {
    try { await logout(); } finally { setUser(null); }
  }

  if (!ready) return <main className="auth-shell">Loading…</main>;
  if (!user) return <AuthForm onDone={authenticate} />;

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
