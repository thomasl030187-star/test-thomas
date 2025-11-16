import { useEffect, useMemo } from 'react';
import Header from '@/components/layout/Header';
import CalendarEventCard from '@/components/meetings/CalendarEventCard';
import MeetingCard from '@/components/meetings/MeetingCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarEvent, Meeting } from '@/lib/types';
import { Calendar, History, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useNotetakerPreferences } from '@/hooks/useNotetakerPreferences';
import { useQuery } from '@tanstack/react-query';
import { fetchUpcomingEvents, hasZoomMeetingLink } from '@/lib/calendar';
import { useRecallBots } from '@/hooks/useRecallBots';
import { apiClient } from '@/lib/api';
import { useUserSettings } from '@/hooks/useUserSettings';

export default function Dashboard() {
  const user = useAuthUser();
  const googleAccounts = user?.connectedAccounts.google ?? [];
  const accountKey = googleAccounts.map(account => account.id).sort().join('|');
  const { preferences, togglePreference } = useNotetakerPreferences();
  const { data: userSettings } = useUserSettings(user?.id);
  const botJoinMinutes = userSettings?.botJoinMinutes ?? 2;
  const {
    assignments,
    scheduleBot,
    refreshBot,
    failures,
    clearFailure,
    isScheduling,
    isRefreshing
  } = useRecallBots();

  const {
    data: rawEvents,
    isLoading,
    isFetching,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['calendar-events', accountKey],
    queryFn: () => fetchUpcomingEvents(googleAccounts),
    enabled: googleAccounts.length > 0
  });

  const upcomingEvents: CalendarEvent[] = useMemo(() => {
    return (rawEvents ?? []).map(event => ({
      ...event,
      notetakerEnabled: preferences[event.id] ?? false
    }));
  }, [rawEvents, preferences]);

  const {
    data: pastMeetings = [],
    isLoading: meetingsLoading
  } = useQuery({
    queryKey: ['meetings'],
    queryFn: () => apiClient.meetings.list()
  });

  const handleToggleNotetaker = (eventId: string) => {
    togglePreference(eventId);
  };

  useEffect(() => {
    upcomingEvents.forEach(event => {
      if (!event.notetakerEnabled) {
        return;
      }
      if (!hasZoomMeetingLink(event) || !event.meetingLink) {
        return;
      }
      if (assignments[event.id] || failures[event.id]) {
        return;
      }

      void scheduleBot(
        {
          id: event.id,
          title: event.title,
          meetingLink: event.meetingLink,
          startTime: event.startTime,
          accountEmail: event.accountEmail
        },
        botJoinMinutes
      );
    });
  }, [assignments, failures, scheduleBot, upcomingEvents, botJoinMinutes]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Your Meetings</h2>
            <p className="text-muted-foreground">
              Manage your calendar events and review past meeting content
            </p>
          </div>
          {googleAccounts.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCcw className="w-4 h-4 mr-2" />
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </Button>
          )}
        </div>

        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="upcoming" className="gap-2">
              <Calendar className="w-4 h-4" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="past" className="gap-2">
              <History className="w-4 h-4" />
              Past Meetings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {googleAccounts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Connect your Google Calendar</h3>
                <p className="text-muted-foreground">
                  Visit the settings page to connect one or more Google accounts and sync your
                  meetings.
                </p>
              </div>
            ) : isLoading ? (
              <div className="text-center py-12 bg-white rounded-lg border">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
                <h3 className="text-lg font-semibold mb-2">Loading your meetings...</h3>
                <p className="text-muted-foreground">Fetching events from your connected accounts.</p>
              </div>
            ) : isError ? (
              <div className="text-center py-12 bg-white rounded-lg border space-y-4">
                <Calendar className="w-12 h-12 mx-auto text-destructive mb-2" />
                <div>
                  <h3 className="text-lg font-semibold mb-1">Unable to load events</h3>
                  <p className="text-muted-foreground">
                    {error instanceof Error
                      ? error.message
                      : 'Something went wrong while retrieving your calendar data.'}
                  </p>
                </div>
                <Button onClick={() => refetch()} variant="outline">
                  Try again
                </Button>
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No upcoming meetings</h3>
                <p className="text-muted-foreground">Your calendar events will appear here</p>
              </div>
            ) : (
              upcomingEvents.map(event => (
                <CalendarEventCard
                  key={event.id}
                  event={event}
                  onToggleNotetaker={handleToggleNotetaker}
                  recallBot={assignments[event.id]}
                  schedulingError={failures[event.id]}
                  isScheduling={isScheduling(event.id)}
                  isRefreshing={isRefreshing(event.id)}
                  onRetry={
                    event.meetingLink
                      ? () => {
                          clearFailure(event.id);
                          void scheduleBot(
                            {
                              id: event.id,
                              title: event.title,
                              meetingLink: event.meetingLink!,
                              startTime: event.startTime,
                              accountEmail: event.accountEmail
                            },
                            botJoinMinutes
                          );
                        }
                      : undefined
                  }
                  onRefreshBot={() => refreshBot(event.id)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {meetingsLoading ? (
              <div className="text-center py-12 bg-white rounded-lg border">
                <History className="w-12 h-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
                <h3 className="text-lg font-semibold mb-2">Loading your past meetings...</h3>
                <p className="text-muted-foreground">Fetching meeting history from the server.</p>
              </div>
            ) : pastMeetings.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border">
                <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No past meetings</h3>
                <p className="text-muted-foreground">Completed meetings will appear here</p>
              </div>
            ) : (
              pastMeetings.map(meeting => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
