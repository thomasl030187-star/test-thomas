export {};

declare global {
  interface GoogleTokenResponse {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
  }

  interface GoogleTokenError {
    type: string;
    error: string;
    error_subtype?: string;
  }

  interface GoogleTokenClientRequestOptions {
    prompt?: '' | 'none' | 'consent' | 'select_account';
  }

  interface GoogleTokenClientConfig {
    client_id: string;
    scope: string;
    hint?: string;
    callback: (response: GoogleTokenResponse) => void;
    error_callback?: (error: GoogleTokenError) => void;
  }

  interface GoogleTokenClient {
    requestAccessToken(overrideConfig?: GoogleTokenClientRequestOptions): void;
  }

  interface GoogleOAuth2 {
    initTokenClient(config: GoogleTokenClientConfig): GoogleTokenClient;
  }

  interface GoogleAccounts {
    oauth2: GoogleOAuth2;
  }

  interface GoogleIdentityServices {
    accounts: GoogleAccounts;
  }

  interface Window {
    google?: GoogleIdentityServices;
  }
}
