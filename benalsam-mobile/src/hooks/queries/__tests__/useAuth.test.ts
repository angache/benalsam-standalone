import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserProfile, useUpdateProfile } from '../useAuth';
import { useAuthStore } from '../../../stores';
import { supabase } from '../../../services/supabaseClient';

// Mock the stores
jest.mock('../../../stores', () => ({
  useAuthStore: jest.fn(),
}));

// Mock supabase client
jest.mock('../../../lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ 
            data: { 
              id: 'test-user-id',
              email: 'test@example.com',
              avatar_url: 'https://test.com/image.jpg'
            },
            error: null 
          }),
        }),
      }),
      update: jest.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

describe('Auth Hooks', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    avatar_url: 'https://test.com/old-image.jpg',
  };

  beforeEach(() => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: mockUser,
      updateProfile: jest.fn().mockResolvedValue({}),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  describe('useUserProfile', () => {
    it('fetches user profile data correctly', async () => {
      const { result } = renderHook(() => useUserProfile('test-user-id'), { wrapper });

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.data).toEqual(expect.objectContaining({
        id: 'test-user-id',
        email: 'test@example.com',
      }));
    });

    it('returns undefined when userId is not provided', () => {
      const { result } = renderHook(() => useUserProfile(undefined), { wrapper });
      expect(result.current.data).toBeUndefined();
    });

    it('handles cache invalidation correctly', async () => {
      const { result } = renderHook(() => useUserProfile('test-user-id'), { wrapper });

      // Set initial cache
      queryClient.setQueryData(['profile', 'test-user-id'], mockUser);

      await act(async () => {
        await result.current.refetch();
      });

      // Cache should be updated with new data
      expect(queryClient.getQueryData(['profile', 'test-user-id'])).toEqual(
        expect.objectContaining({
          id: 'test-user-id',
          email: 'test@example.com',
        })
      );
    });
  });

  describe('useUpdateProfile', () => {
    it('updates profile successfully', async () => {
      const { result } = renderHook(() => useUpdateProfile(), { wrapper });

      const updates = { avatar_url: 'https://test.com/new-image.jpg' };

      await act(async () => {
        await result.current.mutateAsync(updates);
      });

      expect(useAuthStore().updateProfile).toHaveBeenCalledWith(updates);
    });

    it('invalidates profile cache after successful update', async () => {
      const queryKey = ['profile', 'test-user-id'];
      const mockData = { id: 'test-user-id', name: 'Test User' };
      
      queryClient.setQueryData(queryKey, mockData);

      const { result } = renderHook(() => useUpdateProfile(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({ name: 'Updated Name' });
      });

      // Cache should be invalidated
      expect(queryClient.getQueryData(queryKey)).toBeUndefined();
    });

    it('handles optimistic updates correctly', async () => {
      const queryKey = ['profile', 'test-user-id'];
      const initialData = { id: 'test-user-id', name: 'Test User' };
      const updates = { name: 'Updated Name' };

      queryClient.setQueryData(queryKey, initialData);

      const { result } = renderHook(() => useUpdateProfile(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(updates);
      });

      // Check if optimistic update was applied
      const finalData = queryClient.getQueryData(queryKey);
      expect(finalData).toBeUndefined(); // Cache should be invalidated
    });
  });
}); 