export default function DashboardPage() {
  // In a later step, this will be gated by auth and show the artist's own stats.
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-sm text-neutral-400">
        From here you&apos;ll manage your profile, create posts, and build
        galleries.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <a
          href="/dashboard/profile/edit"
          className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 text-sm hover:border-neutral-600"
        >
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Profile
          </div>
          <div className="text-neutral-100">Edit your artist profile</div>
        </a>
        <a
          href="/dashboard/posts/new"
          className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 text-sm hover:border-neutral-600"
        >
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Posts
          </div>
          <div className="text-neutral-100">Create a new single post</div>
        </a>
        <a
          href="/dashboard/galleries/new"
          className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 text-sm hover:border-neutral-600"
        >
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Galleries
          </div>
          <div className="text-neutral-100">
            Start a new series or gallery
          </div>
        </a>
      </div>
    </div>
  );
}

