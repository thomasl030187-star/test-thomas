import { Router } from 'express';
import { z } from 'zod';
import { dataStore } from '../store';

const platformSchema = z.enum(['zoom', 'teams', 'meet']);

const transcriptSegmentSchema = z.object({
  speaker: z.string(),
  timestamp: z.string(),
  text: z.string()
});

const createMeetingSchema = z.object({
  title: z.string().min(1),
  startTime: z.string(),
  endTime: z.string(),
  attendees: z.array(z.string()).default([]),
  platform: platformSchema,
  meetingLink: z.string().optional(),
  notes: z.string().optional(),
  accountEmail: z.string().email(),
  notetakerEnabled: z.boolean().optional(),
  transcript: z.array(transcriptSegmentSchema).optional(),
  followUpEmail: z.string().optional(),
  recallBotId: z.string().optional()
});

const updateMeetingSchema = createMeetingSchema.partial();

export const meetingsRouter = Router();

meetingsRouter.get('/', (_, res) => {
  res.json(dataStore.listMeetings());
});

meetingsRouter.get('/:id', (req, res) => {
  const meeting = dataStore.getMeeting(req.params.id);
  if (!meeting) {
    res.status(404).json({ message: 'Meeting not found.' });
    return;
  }
  res.json(meeting);
});

meetingsRouter.post('/', (req, res, next) => {
  try {
    const payload = createMeetingSchema.parse(req.body);
    const meeting = dataStore.createMeeting(payload);
    res.status(201).json(meeting);
  } catch (error) {
    next(error);
  }
});

meetingsRouter.put('/:id', (req, res, next) => {
  try {
    const payload = updateMeetingSchema.parse(req.body);
    const meeting = dataStore.updateMeeting(req.params.id, payload);
    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found.' });
      return;
    }
    res.json(meeting);
  } catch (error) {
    next(error);
  }
});

meetingsRouter.delete('/:id', (req, res) => {
  const deleted = dataStore.deleteMeeting(req.params.id);
  if (!deleted) {
    res.status(404).json({ message: 'Meeting not found.' });
    return;
  }
  res.status(204).send();
});
