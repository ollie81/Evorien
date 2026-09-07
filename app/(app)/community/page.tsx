import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";
import { getUserId } from "@/lib/auth";
import { getFeedPosts } from "@/lib/data/community";
import { PostComposer } from "@/components/community/post-composer";
import { PostCard } from "@/components/community/post-card";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Community" };

export default async function CommunityPage() {
  const userId = await getUserId();
  const posts = await getFeedPosts(userId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Community</h1>
      <PostComposer />
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
