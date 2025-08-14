import React from 'react';
import { IconButton, Tooltip, CircularProgress, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface ActionButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  variant?: 'contained' | 'outlined';
  ariaLabel?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  tooltip,
  onClick,
  disabled = false,
  loading = false,
  color = 'primary',
  size = 'small',
  variant = 'contained',
  ariaLabel
}) => {
  const theme = useTheme();
  
  const getColorConfig = () => {
    const colorMap = {
      primary: {
        light: '#1976d2',
        dark: '#42a5f5',
        hoverLight: '#1565c0',
        hoverDark: '#64b5f6'
      },
      secondary: {
        light: '#9c27b0',
        dark: '#ba68c8',
        hoverLight: '#7b1fa2',
        hoverDark: '#ab47bc'
      },
      success: {
        light: '#2e7d32',
        dark: '#66bb6a',
        hoverLight: '#1b5e20',
        hoverDark: '#81c784'
      },
      warning: {
        light: '#ed6c02',
        dark: '#ffb74d',
        hoverLight: '#e65100',
        hoverDark: '#ffcc02'
      },
      error: {
        light: '#d32f2f',
        dark: '#ef5350',
        hoverLight: '#c62828',
        hoverDark: '#f44336'
      },
      info: {
        light: '#0288d1',
        dark: '#29b6f6',
        hoverLight: '#01579b',
        hoverDark: '#4fc3f7'
      }
    };
    
    return colorMap[color];
  };

  const colorConfig = getColorConfig();
  const isDark = theme.palette.mode === 'dark';
  
  const buttonStyles = {
    bgcolor: variant === 'contained' 
      ? (isDark ? colorConfig.dark : colorConfig.light)
      : 'transparent',
    color: variant === 'contained' ? '#ffffff' : (isDark ? colorConfig.dark : colorConfig.light),
    border: variant === 'outlined' 
      ? `2px solid ${isDark ? colorConfig.dark : colorConfig.light}`
      : 'none',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      bgcolor: variant === 'contained'
        ? (isDark ? colorConfig.hoverDark : colorConfig.hoverLight)
        : 'rgba(0,0,0,0.04)',
      transform: 'translateY(-2px) scale(1.05)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    },
    '&:active': {
      transform: 'translateY(0) scale(0.95)'
    },
    '&:disabled': {
      bgcolor: isDark ? '#666' : '#ccc',
      color: isDark ? '#ccc' : '#666',
      border: variant === 'outlined' ? `2px solid ${isDark ? '#666' : '#ccc'}` : 'none',
      transform: 'none',
      boxShadow: 'none'
    }
  };

  return (
    <Tooltip title={tooltip} arrow>
      <IconButton
        size={size}
        onClick={onClick}
        disabled={disabled || loading}
        aria-label={ariaLabel || tooltip}
        sx={buttonStyles}
      >
        {loading ? (
          <CircularProgress size={size === 'small' ? 16 : 20} color="inherit" />
        ) : (
          icon
        )}
      </IconButton>
    </Tooltip>
  );
};

export default ActionButton;
