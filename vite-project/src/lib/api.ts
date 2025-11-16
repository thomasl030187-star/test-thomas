import { AppSettings, AuthUser, Meeting, RecallBotTracker } from '@/lib/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

interface RequestOptions extends RequestInit {
  skipJson?: boolean;
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    },
    ...options
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'API request failed.');
  }

  if (options.skipJson) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return undefined as any;
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  authUsers: {
    list: () => apiRequest<AuthUser[]>('/api/auth-users'),
    get: (id: string) => apiRequest<AuthUser>(`/api/auth-users/${id}`),
    create: (payload: Partial<AuthUser>) =>
      apiRequest<AuthUser>('/api/auth-users', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id: string, payload: Partial<AuthUser>) =>
      apiRequest<AuthUser>(`/api/auth-users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    delete: (id: string) => apiRequest<void>(`/api/auth-users/${id}`, { method: 'DELETE', skipJson: true })
  },
  meetings: {
    list: () => apiRequest<Meeting[]>('/api/meetings'),
    get: (id: string) => apiRequest<Meeting>(`/api/meetings/${id}`),
    create: (payload: Partial<Meeting>) =>
      apiRequest<Meeting>('/api/meetings', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id: string, payload: Partial<Meeting>) =>
      apiRequest<Meeting>(`/api/meetings/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    delete: (id: string) => apiRequest<void>(`/api/meetings/${id}`, { method: 'DELETE', skipJson: true })
  },
  recallBots: {
    list: () => apiRequest<RecallBotTracker[]>('/api/recall-bots'),
    get: (id: string) => apiRequest<RecallBotTracker>(`/api/recall-bots/${id}`),
    create: (payload: Partial<RecallBotTracker>) =>
      apiRequest<RecallBotTracker>('/api/recall-bots', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id: string, payload: Partial<RecallBotTracker>) =>
      apiRequest<RecallBotTracker>(`/api/recall-bots/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    delete: (id: string) => apiRequest<void>(`/api/recall-bots/${id}`, { method: 'DELETE', skipJson: true }),
    schedule: (payload: {
      eventId: string;
      meetingUrl: string;
      meetingStartTime: string;
      accountEmail: string;
      title: string;
      joinAt?: string;
    }) =>
      apiRequest<RecallBotTracker>('/api/recall-bots/schedule', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
  },
  settings: {
    list: () => apiRequest<AppSettings[]>('/api/settings'),
    get: (id: string) => apiRequest<AppSettings>(`/api/settings/${id}`),
    getByUser: (userId: string) => apiRequest<AppSettings>(`/api/settings/user/${userId}`),
    create: (payload: Partial<AppSettings>) =>
      apiRequest<AppSettings>('/api/settings', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id: string, payload: Partial<AppSettings>) =>
      apiRequest<AppSettings>(`/api/settings/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    delete: (id: string) => apiRequest<void>(`/api/settings/${id}`, { method: 'DELETE', skipJson: true })
  }
};

export async function findAuthUserByEmail(email: string): Promise<AuthUser | undefined> {
  const users = await apiClient.authUsers.list();
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}
