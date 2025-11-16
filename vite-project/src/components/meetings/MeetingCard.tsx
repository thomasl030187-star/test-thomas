
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Meeting } from '@/lib/types';
import { Calendar, Users, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface MeetingCardProps {
  meeting: Meeting;
}

const platformIcons = {
  zoom: '🔵',
  teams: '🟣',
  meet: '🟢'
};

const platformNames = {
  zoom: 'Zoom',
  teams: 'Microsoft Teams',
  meet: 'Google Meet'
};

export default function MeetingCard({ meeting }: MeetingCardProps) {
  const navigate = useNavigate();
  const startDate = new Date(meeting.startTime);
  const socialPosts = meeting.socialPosts ?? [];
  const postedCount = socialPosts.filter((p) => p.posted).length;
  const totalPosts = socialPosts.length;
  const attendees = meeting.attendees ?? [];
  const transcriptSegments = meeting.transcript ?? [];

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/meeting/${meeting.id}`)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-start gap-3">
              <div className="text-2xl mt-1">{platformIcons[meeting.platform]}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{meeting.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(startDate, 'MMM d, yyyy')}
                  </div>
                  <div>
                    {format(startDate, 'h:mm a')}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {platformNames[meeting.platform]}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {attendees.length ? attendees.join(', ') : 'No attendees listed'}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <Badge variant={postedCount > 0 ? "default" : "outline"}>
                {postedCount}/{totalPosts} posts published
              </Badge>
              <span className="text-muted-foreground">
                {transcriptSegments.length} transcript segments
              </span>
            </div>
          </div>

          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
