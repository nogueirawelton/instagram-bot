export interface Post {
  id: string;
  url: string;
  imagePath: string;
  pinned: boolean;
  visible: boolean;
  position: number | null;
  createdAt: string;
  profileUsername: string;
}
