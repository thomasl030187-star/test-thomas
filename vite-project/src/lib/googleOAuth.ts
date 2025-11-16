import { GoogleAccount } from './types';

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'openid'
].join(' ');

const GOOGLE_IDENTITY_SCRIPT = 'https://accounts.google.com/gsi/client';
const SCRIPT_ID = 'google-identity-services';

let scriptPromise: Promise<void> | null = null;

interface TokenOptions {
  prompt?: '' | 'none' | 'consent' | 'select_account';
  hint?: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

export interface GoogleAccessTokenPayload {
  accessToken: string;
  expiresAt: number;
  grantedScopes: string[];
}

export type GoogleAccountConnection = GoogleAccount & GoogleAccessTokenPayload;

function getClientId(): string {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      'Missing Google client id. Please set VITE_GOOGLE_CLIENT_ID in your environment.'
    );
  }
  return clientId;
}

function loadGoogleIdentityServices(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Identity Services can only be used in the browser.'));
  }

  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.onload = () => resolve();
      existing.onerror = () => reject(new Error('Failed to load Google Identity Services script.'));
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = GOOGLE_IDENTITY_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Failed to load Google Identity Services script.'));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

async function requestAccessToken(options: TokenOptions = {}): Promise<GoogleAccessTokenPayload> {
  await loadGoogleIdentityServices();

  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services failed to initialize.');
  }

  const scopes = GOOGLE_SCOPES;

  return new Promise<GoogleAccessTokenPayload>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: getClientId(),
      scope: scopes,
      hint: options.hint,
      callback: (tokenResponse: GoogleTokenResponse) => {
        resolve({
          accessToken: tokenResponse.access_token,
          expiresAt: Date.now() + tokenResponse.expires_in * 1000,
          grantedScopes: tokenResponse.scope?.split(' ') ?? scopes.split(' ')
        });
      },
      error_callback: (error) => {
        reject(new Error(error.error || 'Google authentication failed.'));
      }
    });

    client.requestAccessToken({ prompt: options.prompt ?? '' });
  });
}

async function fetchUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Unable to fetch Google profile information.');
  }

  return response.json() as Promise<GoogleUserInfo>;
}

export async function connectGoogleAccount(options: TokenOptions = {}): Promise<GoogleAccountConnection> {
  const tokenPayload = await requestAccessToken({ ...options, prompt: options.prompt ?? 'select_account' });
  const profile = await fetchUserInfo(tokenPayload.accessToken);

  return {
    id: profile.sub,
    email: profile.email,
    name: profile.name ?? profile.email,
    picture: profile.picture,
    ...tokenPayload
  };
}

export async function refreshGoogleAccessToken(email: string): Promise<GoogleAccessTokenPayload> {
  try {
    return await requestAccessToken({ hint: email, prompt: '' });
  } catch (error) {
    // Silent refresh can fail if the user cleared cookies or revoked permissions.
    return requestAccessToken({ hint: email, prompt: 'select_account' });
  }
}
