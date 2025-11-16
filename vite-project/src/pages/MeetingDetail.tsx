import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import TranscriptView from '@/components/meetings/TranscriptView';
import SocialPostCard from '@/components/meetings/SocialPostCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Mail, Share2, Calendar, Users, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Meeting } from '@/lib/types';

const platformNames = {
  zoom: 'Zoom',
  teams: 'Microsoft Teams',
  meet: 'Google Meet'
};

export default function MeetingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    data: meeting,
    isLoading,
    isError
  } = useQuery({
    queryKey: ['meeting', id],
    enabled: Boolean(id),
    queryFn: async () => apiClient.meetings.get(id!)
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-6 py-8">
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            Loading meeting details...
          </div>
        </main>
      </div>
    );
  }

  if (isError || !meeting) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-6 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Meeting not found</h2>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const startDate = new Date(meeting.startTime);
  const transcript = meeting.transcript ?? [];
  const socialPosts = meeting.socialPosts ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Meetings
        </Button>

        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{meeting.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(startDate, 'MMMM d, yyyy')} at {format(startDate, 'h:mm a')}
                </div>
                <Badge variant="secondary">
                  {platformNames[meeting.platform]}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{(meeting.attendees ?? []).length ? meeting.attendees?.join(', ') : 'No attendees listed'}</span>
          </div>
        </div>

        <Tabs defaultValue="social" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="social" className="gap-2">
              <Share2 className="w-4 h-4" />
              Social Posts
            </TabsTrigger>
            <TabsTrigger value="transcript" className="gap-2">
              <FileText className="w-4 h-4" />
              Transcript
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2">
              <Mail className="w-4 h-4" />
              Follow-up Email
            </TabsTrigger>
          </TabsList>

          <TabsContent value="social" className="space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-1">Generated Social Media Posts</h3>
              <p className="text-sm text-muted-foreground">
                AI-generated content based on your meeting transcript and automation settings
              </p>
            </div>
            {socialPosts.map(post => (
              <SocialPostCard key={post.id} post={post} />
            ))}
            {socialPosts.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                  No social posts generated for this meeting yet.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="transcript">
            <TranscriptView transcript={transcript} />
          </TabsContent>

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Follow-up Email</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-6 font-mono text-sm whitespace-pre-wrap">
                  {meeting.followUpEmail || 'No follow-up email generated for this meeting.'}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={() => {
                      if (!meeting.followUpEmail) return;
                      void navigator.clipboard.writeText(meeting.followUpEmail);
                    }}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!meeting.followUpEmail) return;
                      void navigator.clipboard.writeText(meeting.followUpEmail);
                    }}
                  >
                    Copy to Clipboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
