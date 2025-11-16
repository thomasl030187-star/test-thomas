import { app } from './app';
import { startRecallPolling } from './services/recallPolling';

const PORT = Number(process.env.PORT ?? 4000);

app.listen(PORT, () => {
  console.log(`Jumpapp API listening on http://localhost:${PORT}`);
  startRecallPolling();
});
