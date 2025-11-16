
import { GoogleAccount, User } from './types';
import { connectGoogleAccount, GoogleAccessTokenPayload } from './googleOAuth';
import { apiClient, findAuthUserByEmail } from './api';

const AUTH_KEY = 'post_meeting_auth_v2';
type AuthListener = (user: User | null) => void;

let cachedUser: User | null | undefined;
const listeners = new Set<AuthListener>();

function normalizeUser(user: User | null): User | null {
  if (!user) {
    return null;
  }

  return {
    ...user,
    connectedAccounts: {
      google: user.connectedAccounts?.google ?? [],
      linkedin: user.connectedAccounts?.linkedin,
      facebook: user.connectedAccounts?.facebook
    }
  };
}

function loadUserFromStorage(): User | null {
  if (cachedUser !== undefined) {
    return cachedUser;
  }

  try {
    const stored = localStorage.getItem(AUTH_KEY);
    cachedUser = stored ? (JSON.parse(stored) as User) : null;
  } catch {
    cachedUser = null;
  }

  cachedUser = normalizeUser(cachedUser);
  return cachedUser;
}

function persistUser(user: User | null) {
  cachedUser = normalizeUser(user);

  if (cachedUser) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(cachedUser));
  } else {
    localStorage.removeItem(AUTH_KEY);
  }

  listeners.forEach((listener) => {
    try {
      listener(cachedUser);
    } catch {
      // Ignore listener errors to avoid breaking auth flow.
    }
  });
}

export const authService = {
  async loginWithGoogle(): Promise<User> {
    const connection = await connectGoogleAccount({ prompt: 'select_account' });
    const existing = await findAuthUserByEmail(connection.email);

    if (existing) {
      const updatedAccounts = this.mergeGoogleAccount(existing.connectedAccounts.google, connection);
      const updatedUser = await apiClient.authUsers.update(existing.id, {
        ...existing,
        picture: connection.picture ?? existing.picture,
        name: connection.name ?? existing.name,
        connectedAccounts: {
          ...existing.connectedAccounts,
          google: updatedAccounts
        }
      });
      persistUser(updatedUser);
      return updatedUser;
    }

    const newUser = await apiClient.authUsers.create({
      email: connection.email,
      name: connection.name,
      picture: connection.picture,
      connectedAccounts: {
        google: [connection]
      }
    });

    persistUser(newUser as User);
    return newUser as User;
  },

  async addGoogleAccount(): Promise<User> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('You must be signed in to connect another account.');
    }

    const connection = await connectGoogleAccount({ prompt: 'select_account' });
    const updatedAccounts = this.mergeGoogleAccount(currentUser.connectedAccounts.google, connection);
    const updatedUser = await apiClient.authUsers.update(currentUser.id, {
      ...currentUser,
      connectedAccounts: {
        ...currentUser.connectedAccounts,
        google: updatedAccounts
      }
    });
    persistUser(updatedUser);
    return updatedUser;
  },

  mergeGoogleAccount(accounts: GoogleAccount[], connection: GoogleAccount): GoogleAccount[] {
    const index = accounts.findIndex((account) => account.id === connection.id);
    if (index >= 0) {
      return accounts.map((account, idx) => (idx === index ? { ...account, ...connection } : account));
    }
    return [...accounts, connection];
  },

  async removeGoogleAccount(accountId: string): Promise<User | null> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return null;
    }

    const remainingAccounts = currentUser.connectedAccounts.google.filter(
      (account) => account.id !== accountId
    );

    if (remainingAccounts.length === 0) {
      await apiClient.authUsers.delete(currentUser.id);
      persistUser(null);
      return null;
    }

    const updatedUser = await apiClient.authUsers.update(currentUser.id, {
      ...currentUser,
      connectedAccounts: {
        ...currentUser.connectedAccounts,
        google: remainingAccounts
      }
    });
    persistUser(updatedUser);
    return updatedUser;
  },

  async updateGoogleAccountToken(accountId: string, payload: GoogleAccessTokenPayload): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return;
    }

    const updatedAccounts = currentUser.connectedAccounts.google.map((account) =>
      account.id === accountId ? { ...account, ...payload } : account
    );

    const updatedUser = await apiClient.authUsers.update(currentUser.id, {
      ...currentUser,
      connectedAccounts: {
        ...currentUser.connectedAccounts,
        google: updatedAccounts
      }
    });
    persistUser(updatedUser);
  },

  async connectSocialAccount(platform: 'linkedin' | 'facebook', name: string): Promise<User> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('You must be signed in to connect this account.');
    }

    const socialAccount = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${platform}-${Date.now()}`,
      name,
      connectedAt: new Date().toISOString()
    };

    const updatedUser = await apiClient.authUsers.update(currentUser.id, {
      ...currentUser,
      connectedAccounts: {
        ...currentUser.connectedAccounts,
        [platform]: socialAccount
      }
    });

    persistUser(updatedUser);
    return updatedUser;
  },

  async disconnectSocialAccount(platform: 'linkedin' | 'facebook'): Promise<User> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('You must be signed in to disconnect this account.');
    }

    const updatedUser = await apiClient.authUsers.update(currentUser.id, {
      ...currentUser,
      connectedAccounts: {
        ...currentUser.connectedAccounts,
        [platform]: undefined
      }
    });

    persistUser(updatedUser);
    return updatedUser;
  },

  logout(): void {
    persistUser(null);
  },

  async syncFromBackend(): Promise<User | null> {
    const localUser = loadUserFromStorage();
    if (!localUser?.id) {
      persistUser(null);
      return null;
    }

    try {
      const freshUser = await apiClient.authUsers.get(localUser.id);
      persistUser(freshUser);
      return freshUser;
    } catch (error) {
      console.error('Unable to sync user from API', error);
      persistUser(null);
      return null;
    }
  },

  getCurrentUser(): User | null {
    return loadUserFromStorage();
  },

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  },

  subscribe(listener: AuthListener): () => void {
    listeners.add(listener);
    listener(this.getCurrentUser());
    return () => {
      listeners.delete(listener);
    };
  }
};
