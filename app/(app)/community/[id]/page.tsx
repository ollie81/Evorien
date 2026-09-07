import { notFound } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { getPost, getPostComments } from "@/lib/data/community";
import { profileDisplayName } from "@/lib/types";
import { formatDistanceToNow } from "@/lib/format-date";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PostCard } from "@/components/community/post-card";
import { CommentComposer } from "@/components/community/comment-composer";
import { SectionHeader } from "@/components/shared/section-header";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getUserId();
  const post = await getPost(id, userId);
  if (!post) notFound();

  const comments = await getPostComments(id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PostCard post={post} linkToDetail={false} />

      <section className="space-y-3">
        <SectionHeader title={`${comments.length} comment${comments.length === 1 ? "" : "s"}`} />
        {userId && <CommentComposer postId={post.id} />}
        <div className="space-y-3">
          {comments.map((comment) => {
            const name = comment.author ? profileDisplayName(comment.author) : "A member";
            return (
              <div key={comment.id} className="flex gap-2.5">
                <Avatar className="size-7">
                  <AvatarFallback className="text-xs">{name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-baseline gap-2">
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(comment.created_at)}
                    </p>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
