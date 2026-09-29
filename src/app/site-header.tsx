import Link from "next/link";

// Sections that aren't built yet; each tab jumps to its preview on the coming-soon page.
export const SECTIONS = [
  { id: "portfolios", label: "Portfolios" },
  { id: "discover", label: "Discover" },
  { id: "galleries", label: "Galleries & curators" }
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/">
        Artispace
      </Link>
      <nav className="tabs" aria-label="Sections">
        {SECTIONS.map((s) => (
          <Link key={s.id} href={`/coming-soon#${s.id}`}>
            {s.label}
          </Link>
        ))}
      </nav>
      <Link className="signin" href="/coming-soon">
        Sign in
      </Link>
    </header>
  );
}
