import { CalendarEvent, GoogleAccount } from './types';
import { authService } from './auth';
import { refreshGoogleAccessToken } from './googleOAuth';

const CALENDAR_BASE_URL = 'https://www.googleapis.com/calendar/v3';
const MAX_CALENDARS = 10;
const MAX_EVENTS_PER_CALENDAR = 25;
const UPCOMING_WINDOW_DAYS = 14;

interface GoogleCalendarListResponse {
  items?: Array<{
    id: string;
    summary?: string;
    accessRole?: string;
    selected?: boolean;
  }>;
}

interface GoogleCalendarEventResponse {
  items?: GoogleCalendarEvent[];
  nextSyncToken?: string;
}

interface GoogleCalendarEvent {
  id?: string;
  summary?: string;
  description?: string;
  hangoutLink?: string;
  htmlLink?: string;
  location?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
  attendees?: Array<{
    email?: string;
    displayName?: string;
    organizer?: boolean;
    resource?: boolean;
  }>;
  conferenceData?: {
    entryPoints?: Array<{
      uri?: string;
    }>;
    conferenceSolution?: {
      key?: {
        type?: string;
      };
    };
  };
}

function isTokenValid(account: GoogleAccount): boolean {
  if (!account.accessToken || !account.expiresAt) {
    return false;
  }
  // Refresh 60 seconds before the deadline to avoid race conditions.
  return account.expiresAt - Date.now() > 60_000;
}

async function ensureAccessToken(account: GoogleAccount): Promise<string> {
  if (isTokenValid(account)) {
    return account.accessToken as string;
  }

  const refreshed = await refreshGoogleAccessToken(account.email);
  authService.updateGoogleAccountToken(account.id, refreshed);
  return refreshed.accessToken;
}

async function fetchCalendarList(accessToken: string): Promise<string[]> {
  const url = new URL(`${CALENDAR_BASE_URL}/users/me/calendarList`);
  url.searchParams.set('maxResults', String(MAX_CALENDARS));
  url.searchParams.set('minAccessRole', 'reader');

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    throw new Error('Unable to load Google calendars.');
  }

  const payload = (await response.json()) as GoogleCalendarListResponse;

  return (
    payload.items
      ?.filter((calendar) => calendar.accessRole !== 'freeBusyReader')
      .filter((calendar) => calendar.selected !== false)
      .map((calendar) => calendar.id) ?? []
  );
}

function buildEventTime(value?: { dateTime?: string; date?: string }): string | undefined {
  if (!value) {
    return undefined;
  }

  if (value.dateTime) {
    return value.dateTime;
  }

  if (value.date) {
    return `${value.date}T00:00:00Z`;
  }

  return undefined;
}

function detectPlatform(event: GoogleCalendarEvent): CalendarEvent['platform'] {
  const possibleSources = [
    event.hangoutLink,
    event.location,
    ...(event.conferenceData?.entryPoints?.map((entry) => entry.uri) ?? [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (possibleSources.includes('zoom.us')) {
    return 'zoom';
  }
  if (possibleSources.includes('teams.microsoft')) {
    return 'teams';
  }

  return 'meet';
}

function extractMeetingLink(event: GoogleCalendarEvent): string | undefined {
  return (
    event.hangoutLink ||
    event.conferenceData?.entryPoints?.find((entry) => entry.uri)?.uri ||
    event.location ||
    event.htmlLink
  );
}

export function hasZoomMeetingLink(event: CalendarEvent): boolean {
  if (event.platform === 'zoom') {
    return true;
  }
  const link = event.meetingLink?.toLowerCase() ?? '';
  return link.includes('zoom.us');
}

function mapCalendarEvent(
  account: GoogleAccount,
  calendarId: string,
  event: GoogleCalendarEvent
): CalendarEvent | null {
  const startTime = buildEventTime(event.start);
  const endTime = buildEventTime(event.end);

  if (!event.id || !startTime || !endTime) {
    return null;
  }

  const attendees =
    event.attendees?.map((attendee) => attendee.displayName || attendee.email || '').filter(Boolean) ?? [];

  return {
    id: `${account.email}:${calendarId}:${event.id}`,
    title: event.summary || 'Untitled event',
    startTime,
    endTime,
    attendees,
    platform: detectPlatform(event),
    meetingLink: extractMeetingLink(event),
    notetakerEnabled: false,
    accountEmail: account.email
  };
}

async function fetchEventsForCalendar(
  accessToken: string,
  calendarId: string
): Promise<GoogleCalendarEvent[]> {
  const url = new URL(`${CALENDAR_BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events`);
  const now = new Date();
  const timeMax = new Date(now.getTime() + UPCOMING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('timeMin', now.toISOString());
  url.searchParams.set('timeMax', timeMax.toISOString());
  url.searchParams.set('maxResults', String(MAX_EVENTS_PER_CALENDAR));
  url.searchParams.set('showDeleted', 'false');

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    throw new Error('Unable to load events from Google Calendar.');
  }

  const payload = (await response.json()) as GoogleCalendarEventResponse;
  return payload.items ?? [];
}

async function fetchEventsForAccount(account: GoogleAccount): Promise<CalendarEvent[]> {
  const accessToken = await ensureAccessToken(account);
  const calendarIds = await fetchCalendarList(accessToken);

  const events = await Promise.all(
    calendarIds.map(async (calendarId) => {
      const calendarEvents = await fetchEventsForCalendar(accessToken, calendarId);
      return calendarEvents
        .map((event) => mapCalendarEvent(account, calendarId, event))
        .filter((event): event is CalendarEvent => Boolean(event));
    })
  );

  return events.flat();
}

export async function fetchUpcomingEvents(accounts: GoogleAccount[]): Promise<CalendarEvent[]> {
  if (!accounts.length) {
    return [];
  }

  const accountEvents = await Promise.all(accounts.map((account) => fetchEventsForAccount(account)));

  return accountEvents
    .flat()
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}
