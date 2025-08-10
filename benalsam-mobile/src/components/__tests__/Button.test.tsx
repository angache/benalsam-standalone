import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button Component', () => {
  it('renders correctly with title', () => {
    render(
      <Button title="Test Button" onPress={() => {}} />
    );
    
    expect(screen.getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    render(
      <Button title="Test Button" onPress={mockOnPress} />
    );
    
    fireEvent.press(screen.getByText('Test Button'));
    
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('renders with variant styles', () => {
    render(
      <Button title="Primary Button" variant="primary" onPress={() => {}} />
    );
    
    expect(screen.getByText('Primary Button')).toBeTruthy();
  });

  it('renders different sizes', () => {
    render(
      <Button title="Large Button" size="lg" onPress={() => {}} />
    );
    
    expect(screen.getByText('Large Button')).toBeTruthy();
  });

  it('renders full width button', () => {
    render(
      <Button title="Full Width" fullWidth onPress={() => {}} />
    );
    
    expect(screen.getByText('Full Width')).toBeTruthy();
  });
}); 