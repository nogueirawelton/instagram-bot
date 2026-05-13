export interface Profile {
  username: string;
  lastSync?: string;
  posts?: Post[];
}

export interface Post {
  id: string;
  url: string;
  imagePath: string;
}
