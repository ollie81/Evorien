import type { Metadata } from "next";
import { Calendar, MessageSquare } from "lucide-react";
import { getUserId } from "@/lib/auth";
import { getFeedPosts } from "@/lib/data/community";
import { getMyProjects } from "@/lib/data/projects";
import { getPastEvents, getUpcomingEvents } from "@/lib/data/events";
import { PostComposer } from "@/components/community/post-composer";
import { PostCard } from "@/components/community/post-card";
import { CreateEventDialog } from "@/components/community/create-event-dialog";
import { EventCard } from "@/components/community/event-card";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeader } from "@/components/shared/section-header";
import { TabLink } from "@/components/build/tab-link";

export const metadata: Metadata = { title: "Community" };

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const tab = params.tab === "events" ? "events" : "feed";
  const userId = await getUserId();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Community</h1>

      <div className="flex gap-1 border-b border-border pb-px">
        <TabLink href="/community?tab=feed" active={tab === "feed"}>
          Feed
        </TabLink>
        <TabLink href="/community?tab=events" active={tab === "events"}>
          Events
        </TabLink>
      </div>

      {tab === "feed" ? <FeedTab userId={userId} /> : <EventsTab userId={userId} />}
    </div>
  );
}

async function FeedTab({ userId }: { userId: string | null }) {
  const [posts, myProjects] = await Promise.all([
    getFeedPosts(userId),
    userId ? getMyProjects(userId) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <PostComposer projects={myProjects.map((p) => ({ id: p.id, name: p.name }))} />
      {posts.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No posts yet"
          message="Share progress, ask for help, or celebrate a win with the network."
        />
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

async function EventsTab({ userId }: { userId: string | null }) {
  const [upcoming, past] = await Promise.all([getUpcomingEvents(), getPastEvents()]);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <CreateEventDialog />
      </div>

      <section className="space-y-3">
        <SectionHeader title="Upcoming" />
        {upcoming.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No upcoming events"
            message="Host one for the community — online or in person."
          />
        ) : (
          <div className="space-y-2">
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} viewerId={userId} />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="space-y-3">
          <SectionHeader title="Past" />
          <div className="space-y-2">
            {past.map((event) => (
              <EventCard key={event.id} event={event} viewerId={userId} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
