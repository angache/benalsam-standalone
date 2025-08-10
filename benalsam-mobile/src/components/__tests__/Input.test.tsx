import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Input } from '../Input';

describe('Input Component', () => {
  it('renders correctly with placeholder', () => {
    render(
      <Input placeholder="Enter your name" onChangeText={() => {}} />
    );
    
    expect(screen.getByPlaceholderText('Enter your name')).toBeTruthy();
  });

  it('handles text input correctly', () => {
    const mockOnChangeText = jest.fn();
    render(
      <Input placeholder="Test input" onChangeText={mockOnChangeText} />
    );
    
    const input = screen.getByPlaceholderText('Test input');
    fireEvent.changeText(input, 'Hello World');
    
    expect(mockOnChangeText).toHaveBeenCalledWith('Hello World');
  });

  it('renders with label', () => {
    render(
      <Input 
        label="Email Address" 
        placeholder="Enter email" 
        onChangeText={() => {}} 
      />
    );
    
    expect(screen.getByText('Email Address')).toBeTruthy();
  });

  it('shows error message when provided', () => {
    render(
      <Input 
        placeholder="Test input" 
        error="This field is required"
        onChangeText={() => {}} 
      />
    );
    
    expect(screen.getByText('This field is required')).toBeTruthy();
  });

  it('renders with secure text entry', () => {
    render(
      <Input 
        placeholder="Password" 
        secureTextEntry={true}
        onChangeText={() => {}} 
      />
    );
    
    const input = screen.getByPlaceholderText('Password');
    expect(input.props.secureTextEntry).toBe(true);
  });

  it('handles disabled state', () => {
    render(
      <Input 
        placeholder="Disabled input" 
        disabled={true}
        onChangeText={() => {}} 
      />
    );
    
    const input = screen.getByPlaceholderText('Disabled input');
    expect(input.props.editable).toBe(false);
  });

  it('renders with icon', () => {
    const TestIcon = () => <></>;
    render(
      <Input 
        placeholder="Input with icon" 
        icon={<TestIcon />}
        onChangeText={() => {}} 
      />
    );
    
    expect(screen.getByPlaceholderText('Input with icon')).toBeTruthy();
  });
}); 