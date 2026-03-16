import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function FeedPage() {
  const supabase = createSupabaseServerClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, caption, media_url, created_at, profiles!inner(display_name, handle, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Recent work</h1>
      <p className="text-sm text-neutral-400">
        A simple global feed of the latest posts. This is optional for the MVP.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {posts?.map((post) => (
          <article
            key={post.id}
            className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/40"
          >
            <div className="aspect-[4/3] w-full bg-neutral-900">
              {/* Replace with next/image once media is wired up */}
            </div>
            <div className="space-y-1 px-3 py-3">
              <h2 className="text-sm font-medium text-neutral-50">
                {post.title}
              </h2>
              {post.caption ? (
                <p className="line-clamp-2 text-xs text-neutral-300">
                  {post.caption}
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

