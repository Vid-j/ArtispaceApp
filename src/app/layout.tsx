import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Artispace",
  description: "A social platform for artists to share and curate their work."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-neutral-50">
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-neutral-800">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-gradient-to-tr from-sky-500 via-fuchsia-500 to-amber-400" />
                <span className="text-lg font-semibold tracking-tight">
                  Artispace
                </span>
              </div>
              <nav className="flex items-center gap-4 text-sm text-neutral-300">
                <a href="/">Home</a>
                <a href="/feed">Feed</a>
                <a href="/dashboard">Dashboard</a>
              </nav>
            </div>
          </header>
          <main className="flex-1">
            <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
          </main>
          <footer className="border-t border-neutral-900 py-4 text-center text-xs text-neutral-500">
            <span>Artispace · a space for artists</span>
          </footer>
        </div>
      </body>
    </html>
  );
}

