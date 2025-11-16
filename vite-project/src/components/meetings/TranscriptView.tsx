
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TranscriptSegment } from '@/lib/types';
import { User } from 'lucide-react';

interface TranscriptViewProps {
  transcript: TranscriptSegment[];
}

export default function TranscriptView({ transcript }: TranscriptViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Meeting Transcript</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transcript.map((segment, index) => (
            <div key={index} className="flex gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="font-semibold text-sm">{segment.speaker}</span>
                  <span className="text-xs text-muted-foreground">{segment.timestamp}</span>
                </div>
                <p className="text-sm leading-relaxed">{segment.text}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}