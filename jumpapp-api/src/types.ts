export type MeetingPlatform = 'zoom' | 'teams' | 'meet';

export interface OAuthAccount {
  id: string;
  name: string;
  connectedAt: string;
  accessToken?: string;
  expiresAt?: number;
}

export interface GoogleAccount {
  id: string;
  email: string;
  name: string;
  picture?: string;
  accessToken?: string;
  expiresAt?: number;
  grantedScopes?: string[];
}

export interface ConnectedAccounts {
  google: GoogleAccount[];
  linkedin?: OAuthAccount;
  facebook?: OAuthAccount;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  connectedAccounts: ConnectedAccounts;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  platform: MeetingPlatform;
  meetingLink?: string;
  notes?: string;
  accountEmail: string;
  notetakerEnabled?: boolean;
  recallBotId?: string;
}

export interface TranscriptSegment {
  speaker: string;
  timestamp: string;
  text: string;
}

export interface SocialPost {
  id: string;
  platform: 'linkedin' | 'facebook';
  content: string;
  createdAt: string;
  posted: boolean;
  postedAt?: string;
}

export interface Meeting extends CalendarEvent {
  transcript: TranscriptSegment[];
  followUpEmail?: string;
  socialPosts?: SocialPost[];
}

export interface RecallBotRecord {
  id: string; // same as botId for convenience
  eventId: string;
  botId: string;
  meetingUrl: string;
  meetingStartTime: string;
  joinAt?: string;
  status?: string;
  accountEmail: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
  media?: {
    videoUrl?: string;
    transcriptUrl?: string;
  };
  metadata?: Record<string, unknown>;
}

export type AutomationType = 'generate_post';

export interface Automation {
  id: string;
  name: string;
  type: AutomationType;
  platform: 'linkedin' | 'facebook';
  description: string;
  example: string;
}

export interface AppSettings {
  id: string;
  userId: string;
  botJoinMinutes: number;
  automations: Automation[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAuthUserPayload {
  email: string;
  name: string;
  picture?: string;
  connectedAccounts?: Partial<ConnectedAccounts>;
}

export type UpdateAuthUserPayload = Partial<Omit<AuthUser, 'id' | 'connectedAccounts'>> & {
  connectedAccounts?: Partial<ConnectedAccounts>;
};

export interface CreateMeetingPayload
  extends Omit<CalendarEvent, 'id' | 'recallBotId'> {
  transcript?: TranscriptSegment[];
  followUpEmail?: string;
  recallBotId?: string;
}

export type UpdateMeetingPayload = Partial<Omit<Meeting, 'id'>>;

export interface CreateRecallBotPayload
  extends Omit<RecallBotRecord, 'id' | 'createdAt' | 'updatedAt'> {}

export type UpdateRecallBotPayload = Partial<Omit<RecallBotRecord, 'id'>>;

export interface CreateSettingsPayload {
  userId: string;
  botJoinMinutes?: number;
  automations?: Automation[];
}

export type UpdateSettingsPayload = Partial<Omit<AppSettings, 'id' | 'userId'>>;
