import Link from "next/link";
import { Brand } from "../../components/Brand";

export default function Onboarding() {
  return (
    <main className="center">
      <div style={{ width: "min(560px,100%)" }}>
        <Brand />
        <div className="card card-pad" style={{ marginTop: 30, textAlign: "center" }}>
          <h1>Get started with Trender</h1>
          <p className="muted">Create one universal Trender account or log in to your existing account.</p>
          <div className="form-actions" style={{ justifyContent: "center", marginTop: 22 }}>
            <Link className="btn" href="/signup">Create an Account</Link>
            <Link className="btn secondary" href="/login">Log In</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
