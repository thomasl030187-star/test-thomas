import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { AppSettings } from '@/lib/types';

export function useUserSettings(userId?: string) {
  return useQuery<AppSettings>({
    queryKey: ['user-settings', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) {
        throw new Error('Missing user id');
      }
      try {
        return await apiClient.settings.getByUser(userId);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to fetch settings.';
        if (message.toLowerCase().includes('not found')) {
          return apiClient.settings.create({ userId, botJoinMinutes: 2 });
        }
        throw error;
      }
    }
  });
}
