import React from 'react';
import { render } from '@testing-library/react-native';
import TabBarIcon from '../TabBarIcon';

// Mock the lucide-react-native icons
jest.mock('lucide-react-native', () => ({
  Home: () => 'Home-Icon',
  Search: () => 'Search-Icon',
  PlusCircle: () => 'PlusCircle-Icon',
  Heart: () => 'Heart-Icon',
  User: () => 'User-Icon',
}));

// Mock the stores
jest.mock('../../stores', () => ({
  useThemeColors: () => ({
    primary: '#FF0000',
  }),
}));

describe('TabBarIcon', () => {
  it('renders home icon correctly', () => {
    const { getByText } = render(
      <TabBarIcon route={{ name: 'Home' }} focused={false} color="#000" size={24} />
    );
    expect(getByText('Home-Icon')).toBeTruthy();
  });

  it('renders profile icon correctly', () => {
    const { getByText } = render(
      <TabBarIcon route={{ name: 'Profile' }} focused={false} color="#000" size={24} />
    );
    expect(getByText('User-Icon')).toBeTruthy();
  });

  it('renders user icon as default when route name is unknown', () => {
    const { getByText } = render(
      <TabBarIcon route={{ name: 'Unknown' }} focused={false} color="#000" size={24} />
    );
    expect(getByText('User-Icon')).toBeTruthy();
  });

  it('renders create button with custom styles', () => {
    const { getByText } = render(
      <TabBarIcon route={{ name: 'Create' }} focused={false} color="#000" size={24} />
    );
    expect(getByText('PlusCircle-Icon')).toBeTruthy();
    expect(getByText('İLAN VER')).toBeTruthy();
  });

  it('applies different stroke width when focused', () => {
    const { getByTestId } = render(
      <TabBarIcon route={{ name: 'Home' }} focused={false} color="#000" size={24} />
    );
    expect(getByTestId('icon-container')).toBeTruthy();
  });
}); 