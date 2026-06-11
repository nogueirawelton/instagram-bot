export interface InstagramPost {
  id: string;
  imageUrl: string;
  timestamp: string;
  pinned: boolean;
  isVisible: boolean;
}

export interface Company {
  id: string;
  name: string;
  username: string;
  avatar: string;
  postsCount: number;
  visiblePostsCount: number;
  lastSync: string;
  posts: InstagramPost[];
}
