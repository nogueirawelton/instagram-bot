import type { Post } from "./post";

export interface Profile {
  username: string;
  name: string;
  avatarUrl: string;
  lastSync?: string | null;
  postsCount?: number;
  visiblePostsCount?: number;
  posts?: Post[];
}
