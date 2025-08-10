import React from 'react';
import { render, waitFor, screen } from '@testing-library/react-native';
import MyListingsScreen from '../MyListingsScreen';

// Mock the service functions
jest.mock('../../services/listingService', () => ({
  fetchMyListings: jest.fn(),
}));

jest.mock('../../services/listingService/mutations', () => ({
  updateListingStatus: jest.fn(),
  deleteListing: jest.fn(),
}));

// Mock the stores
jest.mock('../../stores', () => ({
  useAuthStore: jest.fn(),
  useThemeColors: jest.fn(),
}));

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
};

const mockColors = {
  background: '#ffffff',
  text: '#000000',
  textSecondary: '#666666',
  surface: '#f5f5f5',
  border: '#e0e0e0',
  primary: '#007AFF',
  error: '#FF3B30',
  warning: '#FF9500',
  success: '#34C759',
  white: '#ffffff',
  black: '#000000',
  gray: {
    100: '#f3f4f6',
    200: '#e5e7eb',
  },
};

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

describe('MyListingsScreen', () => {
  const { fetchMyListings } = require('../../services/listingService');
  const { useAuthStore, useThemeColors } = require('../../stores');

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as jest.MockedFunction<typeof useAuthStore>).mockReturnValue({ user: mockUser });
    (useThemeColors as jest.MockedFunction<typeof useThemeColors>).mockReturnValue(mockColors);
    (fetchMyListings as jest.MockedFunction<typeof fetchMyListings>).mockResolvedValue([]);
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      expect(() => {
        render(<MyListingsScreen navigation={mockNavigation} />);
      }).not.toThrow();
    });

    it('shows loading state initially', () => {
      render(<MyListingsScreen navigation={mockNavigation} />);
      
      expect(screen.getByTestId('loading-spinner')).toBeTruthy();
    });

    it('renders without user', () => {
      (useAuthStore as jest.MockedFunction<typeof useAuthStore>).mockReturnValue({ user: null });
      
      expect(() => {
        render(<MyListingsScreen navigation={mockNavigation} />);
      }).not.toThrow();
    });
  });

  describe('Data Fetching', () => {
    it('calls fetchMyListings with user ID', async () => {
      render(<MyListingsScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        expect(fetchMyListings).toHaveBeenCalledWith('user-123');
      });
    });

    it('does not call fetchMyListings when user is null', () => {
      (useAuthStore as jest.MockedFunction<typeof useAuthStore>).mockReturnValue({ user: null });
      
      render(<MyListingsScreen navigation={mockNavigation} />);
      
      expect(fetchMyListings).not.toHaveBeenCalled();
    });

    it('handles empty listings', async () => {
      (fetchMyListings as jest.MockedFunction<typeof fetchMyListings>).mockResolvedValue([]);
      
      render(<MyListingsScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        expect(fetchMyListings).toHaveBeenCalled();
      });
    });

    it('handles error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (fetchMyListings as jest.MockedFunction<typeof fetchMyListings>).mockRejectedValue(new Error('Network error'));
      
      render(<MyListingsScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading my listings:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });
  });
}); 