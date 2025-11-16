const RECALL_API_KEY = process.env.RECALL_API_KEY ?? '';
const RECALL_REGION = process.env.RECALL_REGION ?? 'us-west-2';
const BASE_URL = `https://${RECALL_REGION}.recall.ai/api/v1`;

interface RequestOptions extends RequestInit {
  skipJson?: boolean;
}

export function isRecallConfigured() {
  return Boolean(RECALL_API_KEY);
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!isRecallConfigured()) {
    throw new Error('Recall.ai API is not configured.');
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Token ${RECALL_API_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Recall.ai request failed.');
  }

  if (options.skipJson) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export interface RecallEndpointPayload {
  id?: string;
  status?: string;
  join_at?: string;
  status_changes?: Array<{ status?: string; timestamp?: string }>;
  recordings?: Array<{
    media_shortcuts?: {
      video_mixed?: {
        data?: {
          download_url?: string;
        };
      };
      video_mixed_mp4?: {
        data?: {
          download_url?: string;
        };
      };
      transcript?: {
        data?: {
          download_url?: string;
        };
      };
    };
  }>;
}

export function getRecallBot(botId: string) {
  return request<RecallEndpointPayload>(`/bot/${botId}`);
}

export interface CreateRecallBotOptions {
  meeting_url: string;
  bot_name: string;
  join_at?: string;
  recording_config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export function createRecallBot(payload: CreateRecallBotOptions) {
  return request<RecallEndpointPayload>('/bot', { method: 'POST', body: JSON.stringify(payload) });
}
