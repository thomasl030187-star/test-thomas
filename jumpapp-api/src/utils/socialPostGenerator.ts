import type { TranscriptSegment } from '../types';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? '';
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

export function isOpenAIConfigured() {
  return Boolean(OPENAI_API_KEY);
}

export async function generateSocialPostFromTranscript(options: {
  meetingTitle: string;
  transcript: TranscriptSegment[];
}): Promise<string | null> {
  if (!isOpenAIConfigured()) {
    return null;
  }

  const transcriptExcerpt = options.transcript
    .slice(0, 6)
    .map((segment) => `${segment.speaker}: ${segment.text}`)
    .join('\n');

  const prompt = `You are an assistant generating a short LinkedIn update summarizing a meeting.
Meeting title: ${options.meetingTitle}
Transcript excerpts:
${transcriptExcerpt || 'No transcript available'}

Write a concise, professional post (max 120 words) highlighting value delivered.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: 'You write concise professional social media posts.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4
    })
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('OpenAI error', text);
    return null;
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return payload.choices?.[0]?.message?.content?.trim() ?? null;
}
