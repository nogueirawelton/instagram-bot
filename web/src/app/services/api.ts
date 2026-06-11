import { Company, InstagramPost } from '../types';

const API_BASE_URL = 'http://localhost:3030';

interface ProfilePost {
  id: string;
  url: string;
  imagePath: string;
  pinned: boolean;
  visible: boolean;
  position: number | null;
  createdAt: string;
  profileUsername: string;
}

interface Profile {
  username: string;
  name: string;
  avatarUrl: string;
  lastSync?: string | null;
  postsCount?: number;
  visiblePostsCount?: number;
  posts?: ProfilePost[];
}

function mediaUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

function profileToCompany(profile: Profile): Company {
  const posts: InstagramPost[] = (profile.posts ?? []).map((p) => ({
    id: p.id,
    imageUrl: mediaUrl(p.imagePath),
    timestamp: p.createdAt,
    pinned: p.pinned,
    isVisible: p.visible,
  }));

  return {
    id: profile.username,
    name: profile.name,
    username: `@${profile.username}`,
    avatar: mediaUrl(profile.avatarUrl),
    postsCount: profile.postsCount ?? posts.length,
    visiblePostsCount: profile.visiblePostsCount ?? posts.filter(p => p.isVisible).length,
    lastSync: profile.lastSync ?? new Date().toISOString(),
    posts,
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}/api${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  getAllCompanies: async (): Promise<Company[]> => {
    const profiles = await request<Profile[]>('/profiles');
    return profiles.map(profileToCompany);
  },

  getCompany: async (id: string): Promise<Company | undefined> => {
    const profile = await request<Profile>(`/profiles/${id}/manage`);
    return profileToCompany(profile);
  },

  addCompany: async (username: string): Promise<Company> => {
    const profile = await request<Profile>('/profiles', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
    return profileToCompany(profile);
  },

  removeCompany: async (id: string): Promise<void> => {
    await request<void>(`/profiles/${id}`, { method: 'DELETE' });
  },

  syncCompany: async (id: string): Promise<Company | undefined> => {
    await request(`/profiles/${id}/sync`);
    return api.getCompany(id);
  },

  syncAllCompanies: async (): Promise<Company[]> => {
    await request('/profiles/sync');
    return api.getAllCompanies();
  },

  togglePostVisibility: async (companyId: string, postId: string, visible: boolean): Promise<void> => {
    await request(`/profiles/${companyId}/posts/${postId}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify({ visible }),
    });
  },

  reorderPosts: async (companyId: string, postIds: string[]): Promise<void> => {
    await request(`/profiles/${companyId}/posts/order`, {
      method: 'PUT',
      body: JSON.stringify({ order: postIds }),
    });
  },
};
