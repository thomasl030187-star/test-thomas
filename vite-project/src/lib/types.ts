
export interface User {
    id: string;
    email: string;
    name: string;
    picture: string;
    connectedAccounts: {
      google: GoogleAccount[];
      linkedin?: OAuthAccount;
      facebook?: OAuthAccount;
    };
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
  
  export interface OAuthAccount {
    id: string;
    name: string;
    connectedAt: string;
    accessToken?: string;
    expiresAt?: number;
  }
  
  export interface CalendarEvent {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    attendees: string[];
    platform: 'zoom' | 'teams' | 'meet';
    meetingLink?: string;
    notetakerEnabled: boolean;
    accountEmail: string;
  }
  
  export interface Meeting {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    attendees: string[];
    platform: 'zoom' | 'teams' | 'meet';
    transcript: TranscriptSegment[];
    socialPosts: SocialPost[];
    followUpEmail?: string;
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
  
  export type AutomationPlatform = 'linkedin' | 'facebook';
  export type AutomationType = 'generate_post';

  export interface Automation {
    id: string;
    name: string;
    type: AutomationType;
    platform: AutomationPlatform;
    description: string;
    example: string;
  }
  
  export interface AppSettings {
    id: string;
    userId: string;
    botJoinMinutes: number;
    automations: Automation[];
    createdAt?: string;
    updatedAt?: string;
  }
  
  export interface RecallBotMediaLinks {
    videoUrl?: string;
    transcriptUrl?: string;
  }
  
  export interface RecallBotTracker {
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
    media?: RecallBotMediaLinks;
  }
