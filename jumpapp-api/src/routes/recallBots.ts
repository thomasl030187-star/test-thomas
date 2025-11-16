import { Router } from 'express';
import { z } from 'zod';
import { dataStore } from '../store';
import { createRecallBot, isRecallConfigured } from '../utils/recallClient';

const mediaSchema = z
  .object({
    videoUrl: z.string().url().optional(),
    transcriptUrl: z.string().url().optional()
  })
  .optional();

const createRecallBotSchema = z.object({
  eventId: z.string(),
  botId: z.string(),
  meetingUrl: z.string().url(),
  meetingStartTime: z.string(),
  joinAt: z.string().optional(),
  status: z.string().optional(),
  accountEmail: z.string().email(),
  title: z.string(),
  media: mediaSchema,
  metadata: z.record(z.unknown()).optional()
});

const updateRecallBotSchema = createRecallBotSchema.partial();

export const recallBotsRouter = Router();

recallBotsRouter.get('/', (_, res) => {
  res.json(dataStore.listRecallBots());
});

recallBotsRouter.get('/:id', (req, res) => {
  const record = dataStore.getRecallBot(req.params.id);
  if (!record) {
    res.status(404).json({ message: 'Recall bot not found.' });
    return;
  }
  res.json(record);
});

recallBotsRouter.post('/', (req, res, next) => {
  try {
    const payload = createRecallBotSchema.parse(req.body);
    const record = dataStore.createRecallBot(payload);
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
});

recallBotsRouter.put('/:id', (req, res, next) => {
  try {
    const payload = updateRecallBotSchema.parse(req.body);
    const record = dataStore.updateRecallBot(req.params.id, payload);
    if (!record) {
      res.status(404).json({ message: 'Recall bot not found.' });
      return;
    }
    res.json(record);
  } catch (error) {
    next(error);
  }
});

recallBotsRouter.delete('/:id', (req, res) => {
  const deleted = dataStore.deleteRecallBot(req.params.id);
  if (!deleted) {
    res.status(404).json({ message: 'Recall bot not found.' });
    return;
  }
  res.status(204).send();
});

const scheduleBodySchema = z.object({
  eventId: z.string(),
  meetingUrl: z.string().url(),
  meetingStartTime: z.string(),
  accountEmail: z.string().email(),
  title: z.string(),
  joinAt: z.string().optional()
});

recallBotsRouter.post('/schedule', async (req, res) => {
  if (!isRecallConfigured()) {
    res.status(400).json({ message: 'Recall.ai is not configured on the server.' });
    return;
  }

  try {
    const payload = scheduleBodySchema.parse(req.body);
    const recallPayload = await createRecallBot({
      meeting_url: payload.meetingUrl,
      bot_name: `Recall Bot - ${payload.accountEmail}`,
      join_at: payload.joinAt,
      recording_config: {
        transcript: { provider: { meeting_captions: {} } },
        video_mixed_mp4: {}
      },
      metadata: { event_id: payload.eventId }
    });

    const record = dataStore.createRecallBot({
      botId: recallPayload.id!,
      eventId: payload.eventId,
      meetingUrl: payload.meetingUrl,
      meetingStartTime: payload.meetingStartTime,
      joinAt: recallPayload.join_at ?? payload.joinAt,
      status: recallPayload.status ?? 'scheduled',
      accountEmail: payload.accountEmail,
      title: payload.title,
      media: undefined
    });

    res.status(201).json(record);
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Unable to schedule Recall bot.'
    });
  }
});
