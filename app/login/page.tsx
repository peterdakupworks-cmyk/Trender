import Link from "next/link";
import { Brand } from "../../components/Brand";

const OPTIONS = [
  { href: "/login/creator", emoji: "🎥", title: "Creator", desc: "Find campaigns, create content and earn." },
  { href: "/login/artist", emoji: "🎵", title: "Artist", desc: "Promote your music and launch campaigns." },
  { href: "/login/business", emoji: "🏢", title: "Business / Brand", desc: "Promote your products, services or business." },
];

export default function Login() {
  return (
    <main className="center">
      <div className="form">
        <Brand />
        <div className="card card-pad" style={{ marginTop: 24, textAlign: "center" }}>
          <h1>Log in</h1>
          <p className="muted">What do you want to access?</p>
        </div>

        <div className="grid" style={{ marginTop: 16 }}>
          {OPTIONS.map((o) => (
            <Link key={o.href} className="choice" href={o.href}>
              <strong>{o.emoji} {o.title}</strong>
              <span>{o.desc}</span>
            </Link>
          ))}
        </div>

        <p className="muted" style={{ textAlign: "center", marginTop: 18 }}>
          One Trender account can have more than one of these — use the same email and password each time.
        </p>
        <p className="muted" style={{ textAlign: "center", marginTop: 6 }}>
          Don't have an account? <Link href="/choose-role">Create one</Link>
        </p>
      </div>
    </main>
  );
}
