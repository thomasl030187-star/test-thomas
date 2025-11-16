import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import OAuthConnection from '@/components/settings/OAuthConnection';
import AutomationCard from '@/components/settings/AutomationCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { authService } from '@/lib/auth';
import { useAuthUser } from '@/hooks/useAuthUser';
import { Automation } from '@/lib/types';
import { Settings as SettingsIcon, Plus, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserSettings } from '@/hooks/useUserSettings';
import { apiClient } from '@/lib/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function Settings() {
  const user = useAuthUser();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [botJoinMinutes, setBotJoinMinutes] = useState(2);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [isAddingGoogle, setIsAddingGoogle] = useState(false);
  const [disconnectingAccountId, setDisconnectingAccountId] = useState<string | null>(null);
  const [isSavingBotSettings, setIsSavingBotSettings] = useState(false);
  const [isSavingAutomations, setIsSavingAutomations] = useState(false);
  const [processingLinkedIn, setProcessingLinkedIn] = useState(false);
  const [processingFacebook, setProcessingFacebook] = useState(false);

  const googleAccounts = user?.connectedAccounts.google ?? [];
  const {
    data: settings,
    isLoading: settingsLoading,
    refetch: refetchSettings
  } = useUserSettings(user?.id);

  useEffect(() => {
    if (settings) {
      setBotJoinMinutes(settings.botJoinMinutes);
      setAutomations(settings.automations);
    }
  }, [settings]);

  useEffect(() => {
    const connectionStatus = searchParams.get('connection');
    if (!connectionStatus) {
      return;
    }
    if (connectionStatus.endsWith('success')) {
      const platform = connectionStatus.replace('-success', '');
      toast.success(`Connected ${platform === 'linkedin' ? 'LinkedIn' : 'Facebook'} account.`);
    } else {
      toast.error('Unable to connect social account.');
    }
    const next = new URLSearchParams(searchParams);
    next.delete('connection');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleSaveBotSettings = async () => {
    if (!settings) {
      return;
    }
    try {
      setIsSavingBotSettings(true);
      await apiClient.settings.update(settings.id, { botJoinMinutes });
      toast.success('Bot settings saved successfully!');
      await refetchSettings();
    } catch (error) {
      console.error(error);
      toast.error('Unable to save bot settings.');
    } finally {
      setIsSavingBotSettings(false);
    }
  };

  async function persistAutomations(nextAutomations: Automation[]) {
    if (!settings) {
      return;
    }
    try {
      setIsSavingAutomations(true);
      await apiClient.settings.update(settings.id, { automations: nextAutomations });
      toast.success('Automation settings updated.');
      await refetchSettings();
    } catch (error) {
      console.error(error);
      toast.error('Unable to update automations.');
      await refetchSettings();
    } finally {
      setIsSavingAutomations(false);
    }
  }

  const handleAddAutomation = () => {
    const newAutomation: Automation = {
      id: crypto.randomUUID ? crypto.randomUUID() : `a${automations.length + 1}`,
      name: 'New Automation',
      type: 'generate_post',
      platform: 'linkedin',
      description: 'Describe the tone, structure, and audience for this post.',
      example: 'Excited to share how we helped a client rethink their retirement plan today!'
    };
    const updated = [...automations, newAutomation];
    setAutomations(updated);
    void persistAutomations(updated);
  };

  const handleUpdateAutomation = (id: string, updates: Partial<Automation>) => {
    const updated = automations.map(a => (a.id === id ? { ...a, ...updates } : a));
    setAutomations(updated);
    void persistAutomations(updated);
  };

  const handleDeleteAutomation = (id: string) => {
    const updated = automations.filter(a => a.id !== id);
    setAutomations(updated);
    void persistAutomations(updated);
  };

  const handleAddGoogleAccount = async () => {
    try {
      setIsAddingGoogle(true);
      const updatedUser = await authService.addGoogleAccount();
      const newAccount = updatedUser.connectedAccounts.google.at(-1);
      if (newAccount) {
        toast.success(`Connected ${newAccount.email}`);
      } else {
        toast.success('Google account connected.');
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'Unable to connect Google account. Please try again.'
      );
    } finally {
      setIsAddingGoogle(false);
    }
  };

  const handleSocialConnect = (platform: 'linkedin' | 'facebook') => {
    if (!user) {
      toast.error('You must be signed in to connect an account.');
      return;
    }
    const setProcessing = platform === 'linkedin' ? setProcessingLinkedIn : setProcessingFacebook;
    setProcessing(true);
    window.location.href = `${API_BASE_URL}/auth/${platform}?userId=${user.id}`;
  };

  const handleSocialDisconnect = async (platform: 'linkedin' | 'facebook') => {
    const label = platform === 'linkedin' ? 'LinkedIn' : 'Facebook';
    const setProcessing = platform === 'linkedin' ? setProcessingLinkedIn : setProcessingFacebook;
    try {
      setProcessing(true);
      await authService.disconnectSocialAccount(platform);
      toast.success(`Disconnected ${label} account.`);
    } catch (error) {
      console.error(error);
      toast.error(`Unable to disconnect ${label} account.`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDisconnectGoogleAccount = async (accountId: string) => {
    try {
      setDisconnectingAccountId(accountId);
      const updatedUser = await authService.removeGoogleAccount(accountId);
      if (!updatedUser) {
        toast.success('Disconnected Google account. You have been signed out.');
        navigate('/login');
      } else {
        toast.success('Disconnected Google account.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Unable to disconnect Google account.');
    } finally {
      setDisconnectingAccountId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 px-0"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <SettingsIcon className="w-8 h-8" />
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your integrations and automation preferences
          </p>
        </div>

        {settingsLoading ? (
          <div className="space-y-6">
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Loading your settings...</p>
              </CardContent>
            </Card>
          </div>
        ) : (
        <div className="space-y-6">
          {/* Connected Accounts */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>
                Manage your calendar and social media integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Google Calendar</h3>
                <div className="space-y-2">
                  {googleAccounts.length === 0 && (
                    <OAuthConnection
                      platform="google"
                      connected={false}
                      isProcessing={isAddingGoogle}
                      onConnect={handleAddGoogleAccount}
                    />
                  )}
                  {googleAccounts.map(account => (
                    <OAuthConnection
                      key={account.id}
                      platform="google"
                      accountName={account.email}
                      connected={true}
                      isProcessing={disconnectingAccountId === account.id}
                      onDisconnect={() => handleDisconnectGoogleAccount(account.id)}
                    />
                  ))}
                  {googleAccounts.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddGoogleAccount}
                      disabled={isAddingGoogle}
                    >
                      {isAddingGoogle ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Another Google Account
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Social Media</h3>
                <div className="space-y-2">
                  <OAuthConnection
                    platform="linkedin"
                    accountName={user?.connectedAccounts.linkedin?.name}
                    connected={!!user?.connectedAccounts.linkedin}
                    isProcessing={processingLinkedIn}
                    onConnect={() => handleSocialConnect('linkedin')}
                    onDisconnect={() => handleSocialDisconnect('linkedin')}
                  />
                  <OAuthConnection
                    platform="facebook"
                    accountName={user?.connectedAccounts.facebook?.name}
                    connected={!!user?.connectedAccounts.facebook}
                    isProcessing={processingFacebook}
                    onConnect={() => handleSocialConnect('facebook')}
                    onDisconnect={() => handleSocialDisconnect('facebook')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bot Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Recall.ai Bot Settings</CardTitle>
              <CardDescription>
                Configure when the notetaker bot joins your meetings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bot-join-time">
                  Join meeting before start (minutes)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="bot-join-time"
                    type="number"
                    min="0"
                    max="15"
                    value={botJoinMinutes}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setBotJoinMinutes(Number.isNaN(value) ? 0 : value);
                    }}
                    className="max-w-xs"
                  />
                  <Button onClick={handleSaveBotSettings} disabled={isSavingBotSettings}>
                    {isSavingBotSettings ? 'Saving...' : 'Save'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  The bot will join {botJoinMinutes} minute{botJoinMinutes !== 1 ? 's' : ''} before the scheduled start time
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Automations */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Content Automations</CardTitle>
                  <CardDescription>
                    Configure how AI generates social media posts from your meetings
                  </CardDescription>
                </div>
                <Button onClick={handleAddAutomation} size="sm" disabled={isSavingAutomations}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Automation
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {automations.map(automation => (
                <AutomationCard
                  key={automation.id}
                  automation={automation}
                  onUpdate={handleUpdateAutomation}
                  onDelete={handleDeleteAutomation}
                />
              ))}
              {isSavingAutomations && (
                <p className="text-xs text-muted-foreground">Saving automation changes...</p>
              )}
            </CardContent>
          </Card>
        </div>
        )}
      </main>
    </div>
  );
}
