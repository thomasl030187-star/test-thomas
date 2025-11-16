
import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SocialPost } from '@/lib/types';
import { Copy, CheckCircle2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface SocialPostCardProps {
  post: SocialPost;
}

const platformConfig = {
  linkedin: {
    name: 'LinkedIn',
    icon: '💼',
    color: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-700'
  },
  facebook: {
    name: 'Facebook',
    icon: '👥',
    color: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-600'
  }
};

export default function SocialPostCard({ post }: SocialPostCardProps) {
  const [isPosted, setIsPosted] = useState(post.posted);
  const [isDraftOpen, setIsDraftOpen] = useState(false);
  const [draftContent, setDraftContent] = useState(post.content);
  const config = platformConfig[post.platform];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draftContent);
      toast.success('Post copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleSave = () => {
    toast.success('Draft saved!');
    setIsDraftOpen(false);
  };

  return (
    <Dialog open={isDraftOpen} onOpenChange={setIsDraftOpen}>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{config.icon}</span>
              <div>
                <h3 className="font-semibold">{config.name} Post</h3>
                <p className="text-xs text-muted-foreground">
                  Generated {format(new Date(post.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isPosted && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Posted
                  {post.postedAt && ` ${format(new Date(post.postedAt), 'MMM d')}`}
                </Badge>
              )}
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View Draft
                </Button>
              </DialogTrigger>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3">{draftContent}</p>
        </CardContent>
      </Card>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Draft post</DialogTitle>
          <DialogDescription>
            Generate a post based on insights from this meeting
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={draftContent}
          onChange={(event) => setDraftContent(event.target.value)}
          rows={6}
          className="min-h-[160px] resize-none"
        />
        <DialogFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <Button variant="outline" onClick={handleCopy} className="flex-1 sm:flex-none">
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          <div className="flex w-full sm:w-auto gap-2 justify-end">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave} className={`${config.color} ${config.hoverColor} text-white`}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
