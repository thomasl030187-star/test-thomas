import express from 'express';
import cors from 'cors';
import { authUsersRouter } from './routes/authUsers';
import { meetingsRouter } from './routes/meetings';
import { recallBotsRouter } from './routes/recallBots';
import { settingsRouter } from './routes/settings';
import { oauthRouter } from './routes/oauth';

export const app = express();

app.use(
  cors({
    origin: '*'
  })
);

app.use(express.json());

app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth-users', authUsersRouter);
app.use('/api/meetings', meetingsRouter);
app.use('/api/recall-bots', recallBotsRouter);
app.use('/api/settings', settingsRouter);
app.use('/auth', oauthRouter);

app.use((_, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  if (error instanceof Error) {
    res.status(400).json({ message: error.message });
    return;
  }
  res.status(500).json({ message: 'Unexpected server error.' });
});
