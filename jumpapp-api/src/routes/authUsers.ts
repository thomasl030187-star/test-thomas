import { Router } from 'express';
import { z } from 'zod';
import { dataStore } from '../store';

const googleAccountSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  picture: z.string().url().optional(),
  accessToken: z.string().optional(),
  expiresAt: z.number().optional(),
  grantedScopes: z.array(z.string()).optional()
});

const oauthAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  connectedAt: z.string()
});

const connectedAccountsSchema = z.object({
  google: z.array(googleAccountSchema).optional(),
  linkedin: oauthAccountSchema.optional(),
  facebook: oauthAccountSchema.optional()
});

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  picture: z.string().url().optional(),
  connectedAccounts: connectedAccountsSchema.optional()
});

const updateSchema = createSchema.partial();

export const authUsersRouter = Router();

authUsersRouter.get('/', (_, res) => {
  res.json(dataStore.listAuthUsers());
});

authUsersRouter.get('/:id', (req, res) => {
  const user = dataStore.getAuthUser(req.params.id);
  if (!user) {
    res.status(404).json({ message: 'Auth user not found.' });
    return;
  }
  res.json(user);
});

authUsersRouter.post('/', (req, res, next) => {
  try {
    const payload = createSchema.parse(req.body);
    const user = dataStore.createAuthUser(payload);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

authUsersRouter.put('/:id', (req, res, next) => {
  try {
    const payload = updateSchema.parse(req.body);
    const user = dataStore.updateAuthUser(req.params.id, payload);
    if (!user) {
      res.status(404).json({ message: 'Auth user not found.' });
      return;
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

authUsersRouter.delete('/:id', (req, res) => {
  const deleted = dataStore.deleteAuthUser(req.params.id);
  if (!deleted) {
    res.status(404).json({ message: 'Auth user not found.' });
    return;
  }
  res.status(204).send();
});
