"use client";

const tabs = ["contacts", "audiences", "campaigns"];

export default function AppHeader({
  activeTab,
  userName,
  onTabChange,
  onLogout,
}: {
  activeTab: string;
  userName: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}) {
  return (
    <header>
      <strong>Nexus Mail</strong>
      <nav>
        {tabs.map((tab) => (
          <button className={activeTab === tab ? "active" : ""} key={tab} onClick={() => onTabChange(tab)}>
            {tab}
          </button>
        ))}
      </nav>
      <div>
        {userName} <button className="link" onClick={onLogout}>Log out</button>
      </div>
    </header>
  );
}
