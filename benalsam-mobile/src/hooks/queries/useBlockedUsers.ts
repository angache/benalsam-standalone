import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blockUser, unblockUser, getBlockedUsers, isUserBlocked } from '../../services/blockService';

interface BlockedUserData {
  id: string;
  username: string;
  name?: string;
  avatar_url?: string;
}

interface BlockedUser {
  blocked_user_id: string;
  blocked_at: string;
  blocked_user: BlockedUserData[];
}

export const useBlockedUsers = () => {
  return useQuery<BlockedUser[], Error>({
    queryKey: ['blocked-users'],
    queryFn: async () => {
      const { data, error } = await getBlockedUsers();
      if (error) throw error;
      if (!data) throw new Error('No data returned');
      return data;
    },
  });
};

export const useBlockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await blockUser(userId);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
    },
  });
};

export const useUnblockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await unblockUser(userId);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
    },
  });
};

export const useIsUserBlocked = (userId: string) => {
  return useQuery<boolean, Error>({
    queryKey: ['blocked-users', userId],
    queryFn: async () => {
      const { data, error } = await isUserBlocked(userId);
      if (error) throw error;
      if (data === null) throw new Error('No data returned');
      return data;
    },
  });
}; 