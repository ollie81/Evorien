"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type CreatePostFormState = { error?: string } | undefined;

export async function createPostAction(
  _prevState: CreatePostFormState,
  formData: FormData
): Promise<CreatePostFormState> {
  const userId = await requireUserId();
  const content = String(formData.get("content") ?? "").trim();
  const pillarCode = String(formData.get("pillarCode") ?? "").trim();

  if (!content) {
    return { error: "Write something before posting." };
  }
  if (content.length > 5000) {
    return { error: "Keep posts under 5000 characters." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("posts").insert({
    author_id: userId,
    content,
    pillar_code: pillarCode || null,
  });

  if (error) {
    return { error: "Could not publish your post." };
  }

  revalidatePath("/community");
  revalidatePath("/");
  return undefined;
}

export async function deletePostAction(postId: string) {
  const userId = await requireUserId();
  const supabase = await createClient();
  await supabase.from("posts").delete().eq("id", postId).eq("author_id", userId);
  revalidatePath("/community");
}

export async function toggleLikeAction(postId: string, currentlyLiked: boolean) {
  const userId = await requireUserId();
  const supabase = await createClient();

  if (currentlyLiked) {
    await supabase.from("likes").delete().eq("post_id", postId).eq("profile_id", userId);
  } else {
    await supabase.from("likes").insert({ post_id: postId, profile_id: userId });
  }

  revalidatePath("/community");
  revalidatePath(`/community/${postId}`);
}

export type AddCommentFormState = { error?: string } | undefined;

export async function addCommentAction(
  postId: string,
  _prevState: AddCommentFormState,
  formData: FormData
): Promise<AddCommentFormState> {
  const userId = await requireUserId();
  const content = String(formData.get("content") ?? "").trim();

  if (!content) return { error: "Write a comment first." };

  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: userId,
    content,
  });

  if (error) return { error: "Could not post your comment." };

  revalidatePath(`/community/${postId}`);
  revalidatePath("/community");
  return undefined;
}
