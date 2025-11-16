import { Router } from 'express';
import { z } from 'zod';
import { dataStore } from '../store';

const automationSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['generate_post']),
  platform: z.enum(['linkedin', 'facebook']),
  description: z.string(),
  example: z.string()
});

const createSettingsSchema = z.object({
  userId: z.string(),
  botJoinMinutes: z.number().int().min(0).max(15).optional(),
  automations: z.array(automationSchema).optional()
});

const updateSettingsSchema = createSettingsSchema.partial().omit({ userId: true });

export const settingsRouter = Router();

settingsRouter.get('/', (_, res) => {
  res.json(dataStore.listSettings());
});

settingsRouter.get('/user/:userId', (req, res) => {
  const record = dataStore.getSettingsByUser(req.params.userId);
  if (!record) {
    res.status(404).json({ message: 'Settings not found for user.' });
    return;
  }
  res.json(record);
});

settingsRouter.get('/:id', (req, res) => {
  const record = dataStore.getSettingsById(req.params.id);
  if (!record) {
    res.status(404).json({ message: 'Settings not found.' });
    return;
  }
  res.json(record);
});

settingsRouter.post('/', (req, res, next) => {
  try {
    const payload = createSettingsSchema.parse(req.body);
    const record = dataStore.createSettings(payload);
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
});

settingsRouter.put('/:id', (req, res, next) => {
  try {
    const payload = updateSettingsSchema.parse(req.body);
    const record = dataStore.updateSettings(req.params.id, payload);
    if (!record) {
      res.status(404).json({ message: 'Settings not found.' });
      return;
    }
    res.json(record);
  } catch (error) {
    next(error);
  }
});

settingsRouter.delete('/:id', (req, res) => {
  const deleted = dataStore.deleteSettings(req.params.id);
  if (!deleted) {
    res.status(404).json({ message: 'Settings not found.' });
    return;
  }
  res.status(204).send();
});
