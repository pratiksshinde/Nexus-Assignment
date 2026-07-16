"use client";

import { useCallback, useEffect, useState } from "react";
import { getAudiences } from "../services/audienceService";
import { getCurrentUser, logout } from "../services/authService";
import { getCampaigns } from "../services/campaignService";
import { getContacts, getTags } from "../services/contactService";
import type { Audience, Campaign, Contact, Tag, User } from "../types";
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

  const reloadContacts = useCallback(
    () => Promise.all([loadContacts(), loadTags(), loadAudiences()]).then(() => undefined),
    [loadContacts, loadTags, loadAudiences],
  );

  const loadDashboard = useCallback(async () => {
    const [auth] = await Promise.all([
      getCurrentUser(),
      loadContacts(),
      loadTags(),
      loadAudiences(),
      loadCampaigns(),
    ]);
    setUser(auth.data.user);
  }, [loadContacts, loadTags, loadAudiences, loadCampaigns]);

  useEffect(() => {
    Promise.all([
      getCurrentUser(),
      getContacts(),
      getTags(),
      getAudiences(),
      getCampaigns(),
    ])
      .then(([auth, contactsResult, tagsResult, audiencesResult, campaignsResult]) => {
        setUser(auth.data.user);
        setContacts(contactsResult.data.contacts);
        setTags(tagsResult.data.tags);
        setAudiences(audiencesResult.data.audiences);
        setCampaigns(campaignsResult.data.campaigns);
      })
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  async function signOut() {
    try { await logout(); } finally { setUser(null); }
  }

  if (!ready) return <main className="auth-shell">Loading…</main>;
  if (!user) return <AuthForm onDone={loadDashboard} />;

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
