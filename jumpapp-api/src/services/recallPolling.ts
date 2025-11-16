import { randomUUID } from 'crypto';
import { dataStore } from '../store';
import { getRecallBot, isRecallConfigured, RecallEndpointPayload } from '../utils/recallClient';
import { generateSocialPostFromTranscript, isOpenAIConfigured } from '../utils/socialPostGenerator';

const FINAL_STATUSES = new Set(['done', 'failed']);
const POLL_INTERVAL_MS = Number(process.env.RECALL_POLL_INTERVAL_MS ?? 30_000);

function extractStatus(payload: RecallEndpointPayload, fallback?: string): string | undefined {
  if (payload.status) {
    return payload.status;
  }
  const changes = payload.status_changes;
  if (!changes || changes.length === 0) {
    return fallback;
  }
  return changes[changes.length - 1]?.status ?? fallback;
}

function extractMedia(payload: RecallEndpointPayload) {
  const recording = payload.recordings?.[0];
  if (!recording) {
    return undefined;
  }

  const videoUrl =
    recording.media_shortcuts?.video_mixed?.data?.download_url ??
    recording.media_shortcuts?.video_mixed_mp4?.data?.download_url;
  const transcriptUrl = recording.media_shortcuts?.transcript?.data?.download_url;

  if (!videoUrl && !transcriptUrl) {
    return undefined;
  }

  return {
    videoUrl,
    transcriptUrl
  };
}

export function startRecallPolling() {
  if (!isRecallConfigured()) {
    console.warn('Recall.ai is not configured; polling skipped.');
    return;
  }

  const poll = async () => {
    const bots = dataStore.listRecallBots();
    const pending = bots.filter(
      (bot) => !bot.status || !FINAL_STATUSES.has(bot.status.toLowerCase())
    );

    for (const bot of pending) {
      try {
        const remote = await getRecallBot(bot.botId);
        const status = extractStatus(remote, bot.status);
        const media = extractMedia(remote);

        const previousStatus = bot.status;
        dataStore.updateRecallBot(bot.botId, {
          status,
          media: media
            ? {
                videoUrl: media.videoUrl ?? bot.media?.videoUrl,
                transcriptUrl: media.transcriptUrl ?? bot.media?.transcriptUrl
              }
            : bot.media,
          updatedAt: new Date().toISOString()
        });

        if (
          status?.toLowerCase() === 'done' &&
          previousStatus?.toLowerCase() !== 'done' &&
          isOpenAIConfigured()
        ) {
          const meeting = dataStore.getMeeting(bot.eventId);
          if (meeting && (meeting.socialPosts ?? []).length === 0) {
            const content = await generateSocialPostFromTranscript({
              meetingTitle: meeting.title,
              transcript: meeting.transcript ?? []
            });
            if (content) {
              dataStore.appendSocialPost(meeting.id, {
                id: randomUUID(),
                platform: 'linkedin',
                content,
                createdAt: new Date().toISOString(),
                posted: false
              });
            }
          }
        }
      } catch (error) {
        console.error(`Failed to poll Recall bot ${bot.botId}`, error);
      }
    }
  };

  void poll();
  setInterval(poll, POLL_INTERVAL_MS);
}
