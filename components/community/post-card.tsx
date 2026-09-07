import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { FeedPost } from "@/lib/data/community";
import { profileDisplayName } from "@/lib/types";
import { formatDistanceToNow } from "@/lib/format-date";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PillarBadge } from "@/components/shared/pillar-badge";
import { ReportDialog } from "@/components/shared/report-dialog";
import { LikeButton } from "@/components/community/like-button";

export function PostCard({ post, linkToDetail = true }: { post: FeedPost; linkToDetail?: boolean }) {
  const name = post.author ? profileDisplayName(post.author) : "A member";

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Avatar className="size-8">
              <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs text-muted-foreground">{formatDistanceToNow(post.created_at)}</p>
            </div>
          </div>
          {post.pillar_code && <PillarBadge code={post.pillar_code} dense />}
        </div>

        <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>

        <div className="flex items-center gap-1 pt-1">
          <LikeButton postId={post.id} liked={post.viewerHasLiked} count={post.likeCount} />
          {linkToDetail ? (
            <Button
              variant="ghost"
              size="sm"
              render={
                <Link href={`/community/${post.id}`}>
                  <MessageCircle className="size-4" />
                  {post.commentCount}
                </Link>
              }
            />
          ) : (
            <span className="flex items-center gap-1.5 px-2 text-sm text-muted-foreground">
              <MessageCircle className="size-4" />
              {post.commentCount}
            </span>
          )}
          <span className="ml-auto">
            <ReportDialog targetType="POST" targetId={post.id} />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
