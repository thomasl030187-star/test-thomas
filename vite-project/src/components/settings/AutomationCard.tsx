import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Automation, AutomationPlatform, AutomationType } from '@/lib/types';
import { Trash2, Save } from 'lucide-react';

interface AutomationCardProps {
  automation: Automation;
  onUpdate: (id: string, updates: Partial<Automation>) => void;
  onDelete: (id: string) => void;
}

const TYPE_OPTIONS: { value: AutomationType; label: string }[] = [
  { value: 'generate_post', label: 'Generate Post' }
];

const platformIcons: Record<AutomationPlatform, string> = {
  linkedin: 'in',
  facebook: 'f'
};

export default function AutomationCard({ automation, onUpdate, onDelete }: AutomationCardProps) {
  const [name, setName] = useState(automation.name);
  const [type, setType] = useState<AutomationType>(automation.type);
  const [platform, setPlatform] = useState<AutomationPlatform>(automation.platform);
  const [description, setDescription] = useState(automation.description);
  const [example, setExample] = useState(automation.example);

  const handleSave = () => {
    onUpdate(automation.id, { name, type, platform, description, example });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold uppercase text-muted-foreground">
              {platformIcons[platform]}
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-semibold h-10"
              placeholder="Automation name"
            />
          </div>
          <Button variant="ghost" size="icon" onClick={() => onDelete(automation.id)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Automation Type</Label>
            <Select value={type} onValueChange={(value: AutomationType) => setType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Platform</Label>
            <Select value={platform} onValueChange={(value: AutomationPlatform) => setPlatform(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Capture the tone, target audience, and structure you want for this automation."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Example Output</Label>
          <Textarea
            value={example}
            onChange={(e) => setExample(e.target.value)}
            placeholder="Share a sample post so the AI mirrors your style."
            rows={3}
          />
        </div>

        <Button onClick={handleSave} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          Save Automation
        </Button>
      </CardContent>
    </Card>
  );
}
