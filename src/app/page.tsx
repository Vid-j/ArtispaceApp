export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-8 md:grid-cols-[2fr,3fr] md:items-center">
        <div className="space-y-4">
          <p className="inline rounded-full border border-neutral-800 px-3 py-1 text-xs uppercase tracking-wide text-neutral-400">
            MVP · Artist-first social platform
          </p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Share your work. Curate your space.
          </h1>
          <p className="text-sm text-neutral-300 md:text-base">
            Artispace is a social, interactive platform for artists to post
            individual pieces or series, and curate how their profile looks and
            feels. Think of it as your personal gallery on the web.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="/dashboard"
              className="rounded-full bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200"
            >
              Go to dashboard
            </a>
            <a
              href="/feed"
              className="rounded-full border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-100 hover:border-neutral-500"
            >
              Explore recent work
            </a>
          </div>
        </div>
        <div className="grid gap-3 rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 shadow-[0_0_40px_rgba(15,23,42,0.7)] sm:grid-cols-3">
          <div className="col-span-2 space-y-2 rounded-xl bg-gradient-to-tr from-sky-500/20 via-fuchsia-500/10 to-amber-400/10 p-3">
            <div className="aspect-[4/3] rounded-lg bg-neutral-900/60" />
            <p className="text-xs font-medium text-neutral-100">
              Single post
            </p>
            <p className="text-xs text-neutral-300">
              Showcase one piece with a focused caption.
            </p>
          </div>
          <div className="space-y-3">
            <div className="space-y-1 rounded-xl border border-neutral-800 bg-neutral-950/80 p-3">
              <div className="flex gap-1">
                <div className="h-10 flex-1 rounded-md bg-neutral-900/80" />
                <div className="h-10 flex-1 rounded-md bg-neutral-900/40" />
              </div>
              <p className="text-xs font-medium text-neutral-100">
                Series & galleries
              </p>
            </div>
            <div className="space-y-1 rounded-xl border border-dashed border-neutral-800 bg-neutral-950/60 p-3">
              <p className="text-xs font-medium text-neutral-100">
                Curated profile
              </p>
              <p className="text-xs text-neutral-300">
                Pin featured works and arrange your series.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

