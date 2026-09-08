import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface PostAuthor {
  id: string;
  full_name: string | null;
  username: string | null;
  passport_id: string;
}

export interface PostProject {
  id: string;
  name: string;
}

export interface FeedPost {
  id: string;
  content: string;
  pillar_code: string | null;
  created_at: string;
  author: PostAuthor | null;
  project: PostProject | null;
  likeCount: number;
  commentCount: number;
  viewerHasLiked: boolean;
}

export interface PostComment {
  id: string;
  content: string;
  created_at: string;
  author: PostAuthor | null;
}

async function attachEngagement(
  posts: {
    id: string;
    content: string;
    pillar_code: string | null;
    created_at: string;
    profiles: PostAuthor | null;
    projects: PostProject | null;
  }[],
  viewerId: string | null
): Promise<FeedPost[]> {
  if (posts.length === 0) return [];
  const supabase = await createClient();
  const postIds = posts.map((p) => p.id);

  const [{ data: likeRows }, { data: commentRows }] = await Promise.all([
    supabase.from("likes").select("post_id, profile_id").in("post_id", postIds),
    supabase.from("comments").select("post_id").in("post_id", postIds),
  ]);

  const likeCounts = new Map<string, number>();
  const viewerLikes = new Set<string>();
  for (const row of likeRows ?? []) {
    likeCounts.set(row.post_id, (likeCounts.get(row.post_id) ?? 0) + 1);
    if (viewerId && row.profile_id === viewerId) viewerLikes.add(row.post_id);
  }

  const commentCounts = new Map<string, number>();
  for (const row of commentRows ?? []) {
    commentCounts.set(row.post_id, (commentCounts.get(row.post_id) ?? 0) + 1);
  }

  return posts.map((post) => ({
    id: post.id,
    content: post.content,
    pillar_code: post.pillar_code,
    created_at: post.created_at,
    author: post.profiles,
    project: post.projects,
    likeCount: likeCounts.get(post.id) ?? 0,
    commentCount: commentCounts.get(post.id) ?? 0,
    viewerHasLiked: viewerLikes.has(post.id),
  }));
}

const POST_SELECT =
  "id, content, pillar_code, created_at, profiles(id, full_name, username, passport_id), projects(id, name)";

export async function getFeedPosts(viewerId: string | null, limit = 20): Promise<FeedPost[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);

  return attachEngagement((data ?? []) as unknown as Parameters<typeof attachEngagement>[0], viewerId);
}

export async function getPost(postId: string, viewerId: string | null): Promise<FeedPost | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("posts").select(POST_SELECT).eq("id", postId).maybeSingle();

  if (!data) return null;
  const [post] = await attachEngagement([data as unknown as Parameters<typeof attachEngagement>[0][number]], viewerId);
  return post;
}

export async function getProjectPosts(projectId: string, viewerId: string | null, limit = 5): Promise<FeedPost[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return attachEngagement((data ?? []) as unknown as Parameters<typeof attachEngagement>[0], viewerId);
}

export async function getPostComments(postId: string): Promise<PostComment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comments")
    .select("id, content, created_at, profiles(id, full_name, username, passport_id)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id as string,
    content: row.content as string,
    created_at: row.created_at as string,
    author: row.profiles as unknown as PostAuthor | null,
  }));
}
