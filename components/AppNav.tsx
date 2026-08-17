"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brand } from "./Brand";
import { useAuth } from "../contexts/AuthProvider";

export function AppNav({ role }: { role: "creator" | "artist" | "business" | "admin" }) {
  const { session, signOut } = useAuth();
  const router = useRouter();

  const links = role === "creator"
    ? [["/creator", "Home"], ["/creator/campaigns", "Campaigns"], ["/creator/campaigns/history", "History"], ["/creator/wallet", "Wallet"], ["/creator/career", "Career"], ["/creator/profile", "Profile"]]
    : role === "artist"
    ? [["/artist", "Dashboard"], ["/artist/campaigns/new", "Create Campaign"], ["/artist/analytics", "Analytics"]]
    : role === "business"
    ? [["/business", "Dashboard"], ["/business/analytics", "Analytics"], ["/business/profile", "Profile"]]
    : [["/admin", "Admin"]];

  async function handleExit() {
    if (session) await signOut();
    router.push("/");
  }

  return (
    <>
      <header className="navbar">
        <div className="container nav-inner">
          <Brand />
          <nav className="nav-links">
            {links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
          </nav>
          <button className="btn secondary" type="button" onClick={handleExit}>{session ? "Log out" : "Exit"}</button>
        </div>
      </header>
      {role === "creator" && (
        <nav className="bottom-nav">
          {links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
      )}
    </>
  );
}
