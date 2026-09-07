"use client";

import { useOptimistic, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleLikeAction } from "@/actions/community";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LikeButton({
  postId,
  liked,
  count,
}: {
  postId: string;
  liked: boolean;
  count: number;
}) {
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    { liked, count },
    (_state, next: { liked: boolean; count: number }) => next
  );

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(optimistic.liked && "text-destructive")}
      onClick={() => {
        startTransition(async () => {
          setOptimistic({
            liked: !optimistic.liked,
            count: optimistic.liked ? optimistic.count - 1 : optimistic.count + 1,
          });
          await toggleLikeAction(postId, optimistic.liked);
        });
      }}
    >
      <Heart className={cn("size-4", optimistic.liked && "fill-current")} />
      {optimistic.count}
    </Button>
  );
}
