export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="logo">
      <img src="/brand/trender-mark.png" alt="Trender" />
      {!compact && <span className="logo-word">Trender<span className="logo-dot">.</span></span>}
    </div>
  );
}
