export const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL ?? 'http://localhost:5173';

export const LINKEDIN_CONFIG = {
  clientId: process.env.LINKEDIN_CLIENT_ID ?? 'YOUR_LINKEDIN_CLIENT_ID',
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET ?? 'YOUR_LINKEDIN_CLIENT_SECRET',
  redirectUri: process.env.LINKEDIN_REDIRECT_URI ?? 'http://localhost:4000/auth/linkedin/callback',
  scopes: ['profile', 'email']
} as const;

export const FACEBOOK_CONFIG = {
  clientId: process.env.FACEBOOK_CLIENT_ID ?? 'YOUR_FACEBOOK_CLIENT_ID',
  clientSecret: process.env.FACEBOOK_CLIENT_SECRET ?? 'YOUR_FACEBOOK_CLIENT_SECRET',
  redirectUri: process.env.FACEBOOK_REDIRECT_URI ?? 'http://localhost:4000/auth/facebook/callback',
  scopes: ['public_profile', 'email']
} as const;

export const OAUTH_JWT_SECRET = process.env.OAUTH_JWT_SECRET ?? 'change-this-secret';
