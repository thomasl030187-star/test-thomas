import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { dataStore } from '../store';
import { FACEBOOK_CONFIG, FRONTEND_BASE_URL, LINKEDIN_CONFIG, OAUTH_JWT_SECRET } from '../config/oauth';

interface OAuthStatePayload {
  userId: string;
  platform: 'linkedin' | 'facebook';
}

function signState(payload: OAuthStatePayload): string {
  return jwt.sign(payload, OAUTH_JWT_SECRET, { expiresIn: '10m' });
}

function verifyState(token: string): OAuthStatePayload {
  return jwt.verify(token, OAUTH_JWT_SECRET) as OAuthStatePayload;
}

function redirectWithResult(res: Response, platform: string, status: 'success' | 'error') {
  const url = new URL('/settings', FRONTEND_BASE_URL);
  url.searchParams.set('connection', `${platform}-${status}`);
  res.redirect(url.toString());
}

export const oauthRouter = Router();

oauthRouter.get('/linkedin', (req, res) => {
  const userId = req.query.userId as string | undefined;
  if (!userId) {
    res.status(400).json({ message: 'Missing userId.' });
    return;
  }

  const user = dataStore.getAuthUser(userId);
  if (!user) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }

  const state = signState({ userId, platform: 'linkedin' });
  const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', LINKEDIN_CONFIG.clientId);
  authUrl.searchParams.set('redirect_uri', LINKEDIN_CONFIG.redirectUri);
  authUrl.searchParams.set('scope', LINKEDIN_CONFIG.scopes.join(' '));
  authUrl.searchParams.set('state', state);

  res.redirect(authUrl.toString());
});

oauthRouter.get('/linkedin/callback', async (req, res) => {
  const code = req.query.code as string | undefined;
  const stateToken = req.query.state as string | undefined;

  if (!code || !stateToken) {
    res.status(400).send('Missing code or state.');
    return;
  }

  let state: OAuthStatePayload;
  try {
    state = verifyState(stateToken);
  } catch {
    redirectWithResult(res, 'linkedin', 'error');
    return;
  }

  try {
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: LINKEDIN_CONFIG.redirectUri,
        client_id: LINKEDIN_CONFIG.clientId,
        client_secret: LINKEDIN_CONFIG.clientSecret
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange LinkedIn auth code.');
    }
    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      expires_in?: number;
    };

    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    });

    if (!profileResponse.ok) {
      throw new Error('Unable to fetch LinkedIn profile.');
    }

    const profile = (await profileResponse.json()) as {
      sub?: string;
      id?: string;
      name?: string;
      given_name?: string;
      family_name?: string;
      email?: string;
    };

    const user = dataStore.getAuthUser(state.userId);
    if (!user) {
      throw new Error('User not found.');
    }

    const accountId = profile.sub || profile.id || randomUUID();
    const accountName =
      profile.name || [profile.given_name, profile.family_name].filter(Boolean).join(' ').trim() || user.name;

    dataStore.updateAuthUser(user.id, {
      connectedAccounts: {
        ...user.connectedAccounts,
        linkedin: {
          id: accountId,
          name: accountName,
          connectedAt: new Date().toISOString(),
          accessToken: tokenData.access_token,
          expiresAt: tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : undefined
        }
      }
    });

    redirectWithResult(res, 'linkedin', 'success');
  } catch (error) {
    console.error(error);
    redirectWithResult(res, 'linkedin', 'error');
  }
});

oauthRouter.get('/facebook', (req, res) => {
  const userId = req.query.userId as string | undefined;
  if (!userId) {
    res.status(400).json({ message: 'Missing userId.' });
    return;
  }

  const user = dataStore.getAuthUser(userId);
  if (!user) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }

  const state = signState({ userId, platform: 'facebook' });
  const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
  authUrl.searchParams.set('client_id', FACEBOOK_CONFIG.clientId);
  authUrl.searchParams.set('redirect_uri', FACEBOOK_CONFIG.redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('scope', FACEBOOK_CONFIG.scopes.join(','));

  res.redirect(authUrl.toString());
});

oauthRouter.get('/facebook/callback', async (req, res) => {
  const code = req.query.code as string | undefined;
  const stateToken = req.query.state as string | undefined;

  if (!code || !stateToken) {
    res.status(400).send('Missing code or state.');
    return;
  }

  let state: OAuthStatePayload;
  try {
    state = verifyState(stateToken);
  } catch {
    redirectWithResult(res, 'facebook', 'error');
    return;
  }

  try {
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', FACEBOOK_CONFIG.clientId);
    tokenUrl.searchParams.set('redirect_uri', FACEBOOK_CONFIG.redirectUri);
    tokenUrl.searchParams.set('client_secret', FACEBOOK_CONFIG.clientSecret);
    tokenUrl.searchParams.set('code', code);

    const tokenResponse = await fetch(tokenUrl);
    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange Facebook auth code.');
    }
    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      token_type?: string;
      expires_in?: number;
    };

    const profileUrl = new URL('https://graph.facebook.com/me');
    profileUrl.searchParams.set('fields', 'id,name,email');
    profileUrl.searchParams.set('access_token', tokenData.access_token);

    const profileResponse = await fetch(profileUrl);
    if (!profileResponse.ok) {
      throw new Error('Unable to fetch Facebook profile.');
    }
    const profile = (await profileResponse.json()) as { id: string; name: string; email?: string };

    const user = dataStore.getAuthUser(state.userId);
    if (!user) {
      throw new Error('User not found.');
    }

    dataStore.updateAuthUser(user.id, {
      connectedAccounts: {
        ...user.connectedAccounts,
        facebook: {
          id: profile.id,
          name: profile.name,
          connectedAt: new Date().toISOString(),
          accessToken: tokenData.access_token,
          expiresAt: tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : undefined
        }
      }
    });

    redirectWithResult(res, 'facebook', 'success');
  } catch (error) {
    console.error(error);
    redirectWithResult(res, 'facebook', 'error');
  }
});
