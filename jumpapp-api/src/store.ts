import { randomUUID } from 'crypto';
import {
  Automation,
  AppSettings,
  AuthUser,
  CreateAuthUserPayload,
  CreateMeetingPayload,
  CreateRecallBotPayload,
  CreateSettingsPayload,
  Meeting,
  RecallBotRecord,
  SocialPost,
  UpdateAuthUserPayload,
  UpdateMeetingPayload,
  UpdateRecallBotPayload,
  UpdateSettingsPayload
} from './types';

function timestamp() {
  return new Date().toISOString();
}

const authUsers = new Map<string, AuthUser>();
const meetings = new Map<string, Meeting>();
const recallBots = new Map<string, RecallBotRecord>();
const settings = new Map<string, AppSettings>();
const settingsByUser = new Map<string, string>();

const defaultAutomationTemplates = [
  {
    name: 'LinkedIn Recap',
    type: 'generate_post' as const,
    platform: 'linkedin' as const,
    description: 'Professional LinkedIn update highlighting key insights and value delivered during the meeting.',
    example: 'Great conversation with ACME Corp today about diversifying their portfolio with sustainable funds.'
  },
  {
    name: 'Facebook Community Post',
    type: 'generate_post' as const,
    platform: 'facebook' as const,
    description: 'Friendly, approachable Facebook recap that invites followers to start a conversation.',
    example: 'Just wrapped a call helping a family plan for college savings. Love guiding clients toward their goals!'
  }
] as const;

function buildDefaultAutomations(): Automation[] {
  return defaultAutomationTemplates.map((template) => ({
    id: randomUUID(),
    ...template
  }));
}

function seedData() {
  if (authUsers.size > 0) {
    return;
  }

  const now = timestamp();
  const userId = randomUUID();
  const sampleUser: AuthUser = {
    id: userId,
    email: 'advisor@example.com',
    name: 'Sample Advisor',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Advisor',
    connectedAccounts: {
      google: [
        {
          id: randomUUID(),
          email: 'advisor@example.com',
          name: 'Sample Advisor'
        }
      ],
      linkedin: {
        id: 'li-1',
        name: 'Sample Advisor',
        connectedAt: now
      }
    },
    createdAt: now,
    updatedAt: now
  };

  authUsers.set(sampleUser.id, sampleUser);

  const meetingId = '7a7c0dc1-e6b5-4819-ba6c-639339678b35';
  const sampleMeeting: Meeting = {
    id: meetingId,
    title: 'Mock Past Meeting',
    startTime: new Date(Date.now() - 86_400_000).toISOString(),
    endTime: new Date(Date.now() - 90_000_000).toISOString(),
    attendees: ['Alex Smith', 'Sample Advisor'],
    platform: 'zoom',
    meetingLink: 'https://zoom.us/j/123456789',
    accountEmail: 'advisor@example.com',
    notetakerEnabled: true,
    transcript: [
      {
        speaker: 'Sample Advisor',
        timestamp: '00:00:05',
        text: 'Thanks for joining today, Alex. I wanted to walk through your onboarding questions.'
      },
      {
        speaker: 'Alex Smith',
        timestamp: '00:00:14',
        text: 'Great, I’m most curious about how the first 90 days look.'
      },
      {
        speaker: 'Sample Advisor',
        timestamp: '00:00:30',
        text: 'Perfect—we’ll cover milestones, automation ideas, and where Recall.ai fits in.'
      }
    ],
    followUpEmail: `Subject: Welcome Call Recap

Hi Alex,

Great speaking with you today! As discussed, I’ll send over the onboarding checklist and we’ll reconnect next week to review your automation settings.

Best,
Sample Advisor`,
    socialPosts: [
      {
        id: 'sp-linkedin-1',
        platform: 'linkedin',
        content:
          'Excited to welcome Alex to the platform today! We outlined the first 90 days, highlighted Recall.ai automations, and set clear KPIs for success. 🚀',
        createdAt: new Date().toISOString(),
        posted: false
      },
      {
        id: 'sp-facebook-1',
        platform: 'facebook',
        content:
          'Had a fantastic kickoff call with a new client! We built their onboarding plan and showed how AI notetakers keep them ahead of schedule.',
        createdAt: new Date().toISOString(),
        posted: false
      }
    ]
  };
  meetings.set(sampleMeeting.id, sampleMeeting);

  const settingsId = randomUUID();
  const sampleSettings: AppSettings = {
    id: settingsId,
    userId,
    botJoinMinutes: 2,
    automations: buildDefaultAutomations(),
    createdAt: now,
    updatedAt: now
  };

  settings.set(sampleSettings.id, sampleSettings);
  settingsByUser.set(userId, settingsId);
}

seedData();

export const dataStore = {
  listAuthUsers(): AuthUser[] {
    return Array.from(authUsers.values());
  },
  getAuthUser(id: string): AuthUser | undefined {
    return authUsers.get(id);
  },
  createAuthUser(payload: CreateAuthUserPayload): AuthUser {
    const id = randomUUID();
    const now = timestamp();
    const user: AuthUser = {
      id,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      connectedAccounts: {
        google: payload.connectedAccounts?.google ?? [],
        linkedin: payload.connectedAccounts?.linkedin,
        facebook: payload.connectedAccounts?.facebook
      },
      createdAt: now,
      updatedAt: now
    };
    authUsers.set(id, user);
    return user;
  },
  updateAuthUser(id: string, payload: UpdateAuthUserPayload): AuthUser | undefined {
    const existing = authUsers.get(id);
    if (!existing) {
      return undefined;
    }
    const updated: AuthUser = {
      ...existing,
      ...payload,
      connectedAccounts: payload.connectedAccounts
        ? {
            google: payload.connectedAccounts.google ?? existing.connectedAccounts.google,
            linkedin: payload.connectedAccounts.linkedin ?? existing.connectedAccounts.linkedin,
            facebook: payload.connectedAccounts.facebook ?? existing.connectedAccounts.facebook
          }
        : existing.connectedAccounts,
      updatedAt: timestamp()
    };
    authUsers.set(id, updated);
    return updated;
  },
  deleteAuthUser(id: string): boolean {
    return authUsers.delete(id);
  },

  listMeetings(): Meeting[] {
    return Array.from(meetings.values());
  },
  getMeeting(id: string): Meeting | undefined {
    return meetings.get(id);
  },
  createMeeting(payload: CreateMeetingPayload): Meeting {
    const id = randomUUID();
    const meeting: Meeting = {
      id,
      title: payload.title,
      startTime: payload.startTime,
      endTime: payload.endTime,
      attendees: payload.attendees,
      platform: payload.platform,
      meetingLink: payload.meetingLink,
      notes: payload.notes,
      accountEmail: payload.accountEmail,
      notetakerEnabled: payload.notetakerEnabled,
      transcript: payload.transcript ?? [],
      followUpEmail: payload.followUpEmail,
      recallBotId: payload.recallBotId
    };
    meetings.set(id, meeting);
    return meeting;
  },
  updateMeeting(id: string, payload: UpdateMeetingPayload): Meeting | undefined {
    const existing = meetings.get(id);
    if (!existing) {
      return undefined;
    }
    const updated: Meeting = {
      ...existing,
      ...payload,
      transcript: payload.transcript ?? existing.transcript
    };
    meetings.set(id, updated);
    return updated;
  },
  appendSocialPost(meetingId: string, socialPost: SocialPost): Meeting | undefined {
    const existing = meetings.get(meetingId);
    if (!existing) {
      return undefined;
    }
    const updated: Meeting = {
      ...existing,
      socialPosts: [...(existing.socialPosts ?? []), socialPost]
    };
    meetings.set(meetingId, updated);
    return updated;
  },
  deleteMeeting(id: string): boolean {
    return meetings.delete(id);
  },

  listRecallBots(): RecallBotRecord[] {
    return Array.from(recallBots.values());
  },
  getRecallBot(id: string): RecallBotRecord | undefined {
    return recallBots.get(id);
  },
  createRecallBot(payload: CreateRecallBotPayload): RecallBotRecord {
    const now = timestamp();
    const botId = payload.botId || randomUUID();
    const record: RecallBotRecord = {
      id: botId,
      botId,
      eventId: payload.eventId,
      meetingUrl: payload.meetingUrl,
      meetingStartTime: payload.meetingStartTime,
      joinAt: payload.joinAt,
      status: payload.status,
      accountEmail: payload.accountEmail,
      title: payload.title,
      media: payload.media,
      metadata: payload.metadata,
      createdAt: now,
      updatedAt: now
    };
    recallBots.set(botId, record);
    return record;
  },
  updateRecallBot(id: string, payload: UpdateRecallBotPayload): RecallBotRecord | undefined {
    const existing = recallBots.get(id);
    if (!existing) {
      return undefined;
    }
    const updated: RecallBotRecord = {
      ...existing,
      ...payload,
      media: payload.media ?? existing.media,
      metadata: payload.metadata ?? existing.metadata,
      updatedAt: timestamp()
    };
    recallBots.set(id, updated);
    return updated;
  },
  deleteRecallBot(id: string): boolean {
    return recallBots.delete(id);
  },

  listSettings(): AppSettings[] {
    return Array.from(settings.values());
  },
  getSettingsById(id: string): AppSettings | undefined {
    return settings.get(id);
  },
  getSettingsByUser(userId: string): AppSettings | undefined {
    const settingsId = settingsByUser.get(userId);
    return settingsId ? settings.get(settingsId) : undefined;
  },
  createSettings(payload: CreateSettingsPayload): AppSettings {
    const existing = settingsByUser.get(payload.userId);
    if (existing) {
      const found = settings.get(existing);
      if (found) {
        return found;
      }
    }
    const id = randomUUID();
    const now = timestamp();
    const record: AppSettings = {
      id,
      userId: payload.userId,
      botJoinMinutes: payload.botJoinMinutes ?? 2,
      automations:
        payload.automations && payload.automations.length > 0 ? payload.automations : buildDefaultAutomations(),
      createdAt: now,
      updatedAt: now
    };
    settings.set(id, record);
    settingsByUser.set(payload.userId, id);
    return record;
  },
  updateSettings(id: string, payload: UpdateSettingsPayload): AppSettings | undefined {
    const existing = settings.get(id);
    if (!existing) {
      return undefined;
    }
    const updated: AppSettings = {
      ...existing,
      ...payload,
      automations: payload.automations ?? existing.automations,
      updatedAt: timestamp()
    };
    settings.set(id, updated);
    return updated;
  },
  deleteSettings(id: string): boolean {
    const record = settings.get(id);
    if (!record) {
      return false;
    }
    settingsByUser.delete(record.userId);
    return settings.delete(id);
  }
};
