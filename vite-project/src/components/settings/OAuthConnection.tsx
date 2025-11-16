import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Link2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface OAuthConnectionProps {
  platform: 'google' | 'linkedin' | 'facebook';
  accountName?: string;
  connected: boolean;
  isProcessing?: boolean;
  onConnect?: () => void | Promise<void>;
  onDisconnect?: () => void | Promise<void>;
}

const platformConfig = {
  google: {
    name: 'Google',
    icon: '🗓️'
  },
  linkedin: {
    name: 'LinkedIn',
    icon: '💼'
  },
  facebook: {
    name: 'Facebook',
    icon: '📘'
  }
} satisfies Record<OAuthConnectionProps['platform'], { name: string; icon: string }>;

export default function OAuthConnection({
  platform,
  accountName,
  connected,
  isProcessing,
  onConnect,
  onDisconnect
}: OAuthConnectionProps) {
  const config = platformConfig[platform];

  const handleConnect = () => {
    if (onConnect) {
      onConnect();
      return;
    }
    toast.success(`${config.name} account connected successfully!`);
  };

  const handleDisconnect = () => {
    if (onDisconnect) {
      onDisconnect();
      return;
    }
    toast.success(`${config.name} account disconnected.`);
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{config.icon}</span>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{config.name}</span>
            {connected && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Connected
              </Badge>
            )}
          </div>
          {connected && accountName && (
            <p className="text-sm text-muted-foreground">{accountName}</p>
          )}
        </div>
      </div>

      {connected ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          disabled={isProcessing}
          aria-busy={isProcessing}
        >
          {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Disconnect
        </Button>
      ) : (
        <Button size="sm" onClick={handleConnect} disabled={isProcessing} aria-busy={isProcessing}>
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Link2 className="w-4 h-4 mr-2" />
              Connect
            </>
          )}
        </Button>
      )}
    </div>
  );
}
