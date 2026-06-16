import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { Notification } from '../types';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get<{ notifications: Notification[]; unreadCount: number }>('/notifications');
      return data;
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
