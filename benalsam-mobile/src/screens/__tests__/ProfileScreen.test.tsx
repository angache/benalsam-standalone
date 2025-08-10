import React from 'react';
import { render, act, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProfileScreen from '../ProfileScreen';
import { useAuthStore } from '../../stores';
import { supabase } from '../../services/supabaseClient';

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{
      uri: 'file://test.jpg',
      fileName: 'test.jpg',
      type: 'image',
      width: 100,
      height: 100,
    }],
  }),
  MediaTypeOptions: {
    Images: 'Images',
  },
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
}));

// Mock the stores
jest.mock('../../stores', () => ({
  useAuthStore: jest.fn(),
  useThemeColors: () => ({
    primary: '#FF0000',
    background: '#FFFFFF',
  }),
}));

// Mock supabase client
jest.mock('../../lib/supabaseClient', () => ({
  supabase: {
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/image.jpg' } }),
      }),
    },
    from: jest.fn().mockReturnValue({
      update: jest.fn().mockResolvedValue({ error: null }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { avatar_url: 'https://test.com/image.jpg' } }),
        }),
      }),
    }),
  },
}));

// Mock ImageUploader component
jest.mock('../../components/ImageUploader', () => {
  return function MockImageUploader({ onImageSelect }: { onImageSelect: (images: any[]) => void }) {
    return (
      <button
        testID="image-uploader"
        onPress={() => onImageSelect([{ 
          uri: 'data:image/jpeg;base64,test', 
          name: 'test.jpg' 
        }])}
      />
    );
  };
});

describe('ProfileScreen', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  });

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    avatar_url: 'https://test.com/old-image.jpg',
  };

  beforeEach(() => {
    (useAuthStore as jest.Mock).mockReturnValue({
      user: mockUser,
      updateProfile: jest.fn().mockResolvedValue({}),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it('renders profile information correctly', async () => {
    const { getByText } = render(<ProfileScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText(mockUser.email)).toBeTruthy();
    });
  });

  it('handles profile photo upload successfully', async () => {
    const { getByTestId } = render(<ProfileScreen />, { wrapper });

    await act(async () => {
      fireEvent.press(getByTestId('upload-photo-button'));
    });

    await waitFor(() => {
      expect(supabase.storage.from).toHaveBeenCalledWith('avatars');
      expect(useAuthStore().updateProfile).toHaveBeenCalled();
    });
  });

  it('handles profile photo removal', async () => {
    const { getByTestId } = render(<ProfileScreen />, { wrapper });

    await act(async () => {
      fireEvent.press(getByTestId('remove-photo-button'));
    });

    await waitFor(() => {
      expect(useAuthStore().updateProfile).toHaveBeenCalledWith({
        avatar_url: null,
      });
    });
  });

  it('handles cache invalidation after photo update', async () => {
    const { getByTestId } = render(<ProfileScreen />, { wrapper });

    // Set initial cache
    queryClient.setQueryData(['profile', mockUser.id], mockUser);

    await act(async () => {
      fireEvent.press(getByTestId('upload-photo-button'));
    });

    await waitFor(() => {
      // Cache should be invalidated
      expect(queryClient.getQueryData(['profile', mockUser.id])).toBeUndefined();
    });
  });
}); 