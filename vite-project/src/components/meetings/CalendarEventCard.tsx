import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarEvent, RecallBotTracker } from '@/lib/types';
import { Calendar, Users, Video } from 'lucide-react';
import { format } from 'date-fns';
import { hasZoomMeetingLink } from '@/lib/calendar';

interface CalendarEventCardProps {
  event: CalendarEvent;
  onToggleNotetaker: (eventId: string) => void;
  recallBot?: RecallBotTracker;
  schedulingError?: string;
  isScheduling?: boolean;
  isRefreshing?: boolean;
  onRetry?: () => void;
  onRefreshBot?: () => void;
}

const platformIcons = {
  zoom: 'dY"�',
  teams: 'dYY�',
  meet: 'dYY�'
};

const platformNames = {
  zoom: 'Zoom',
  teams: 'Microsoft Teams',
  meet: 'Google Meet'
};

const statusLabels: Record<string, string> = {
  scheduled: 'Scheduled',
  joining_meeting: 'Joining shortly',
  in_call: 'In meeting',
  processing: 'Processing',
  done: 'Completed',
  failed: 'Failed'
};

function getStatusBadge(
  status?: string,
  isScheduling?: boolean
): { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' } {
  if (isScheduling) {
    return { label: 'Scheduling...', variant: 'secondary' };
  }

  if (!status) {
    return { label: 'Not scheduled', variant: 'outline' };
  }

  const normalized = status.toLowerCase();
  if (normalized === 'failed') {
    return { label: statusLabels.failed, variant: 'destructive' };
  }

  return {
    label: statusLabels[normalized] ?? status,
    variant: normalized === 'done' ? 'default' : 'secondary'
  };
}

export default function CalendarEventCard({
  event,
  onToggleNotetaker,
  recallBot,
  schedulingError,
  isScheduling,
  isRefreshing,
  onRetry,
  onRefreshBot
}: CalendarEventCardProps) {
  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);
  const eventHasZoomLink = hasZoomMeetingLink(event);
  const showRecallStatus = event.notetakerEnabled;
  const statusBadge = getStatusBadge(recallBot?.status, isScheduling);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-start gap-3">
              <div className="text-2xl mt-1">{platformIcons[event.platform]}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(startDate, 'MMM d, yyyy')}
                  </div>
                  <div>
                    {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {platformNames[event.platform]}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{event.attendees.join(', ')}</span>
            </div>

            <div className="text-xs text-muted-foreground">Account: {event.accountEmail}</div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <div className="flex items-center gap-2">
              <Switch
                id={`notetaker-${event.id}`}
                checked={event.notetakerEnabled}
                onCheckedChange={() => onToggleNotetaker(event.id)}
              />
              <Label
                htmlFor={`notetaker-${event.id}`}
                className="text-sm font-medium cursor-pointer flex items-center gap-1"
              >
                <Video className="w-4 h-4" />
                Notetaker
              </Label>
            </div>
          </div>
        </div>

        {showRecallStatus && (
          <div className="mt-4 border-t pt-4 text-sm space-y-2">
            {!eventHasZoomLink ? (
              <p className="text-muted-foreground">
                Add a Zoom link to this event to automatically schedule the Recall bot.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Recall bot:</span>
                    <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {recallBot && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onRefreshBot}
                        disabled={isRefreshing}
                      >
                        {isRefreshing ? 'Checking…' : 'Refresh'}
                      </Button>
                    )}
                    {recallBot?.media?.videoUrl && (
                      <Button asChild variant="link" size="sm" className="px-0">
                        <a href={recallBot.media.videoUrl} target="_blank" rel="noopener noreferrer">
                          Watch recording
                        </a>
                      </Button>
                    )}
                    {recallBot?.media?.transcriptUrl && (
                      <Button asChild variant="link" size="sm" className="px-0">
                        <a
                          href={recallBot.media.transcriptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View transcript
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                {schedulingError && (
                  <div className="text-xs text-destructive flex items-center gap-2">
                    {schedulingError}
                    {onRetry && (
                      <Button variant="link" size="sm" className="h-auto p-0" onClick={onRetry}>
                        Try again
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
