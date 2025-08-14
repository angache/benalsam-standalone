import React from 'react';
import { Box, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ActionButton from './ActionButton';

interface ActionButtonConfig {
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

interface ActionButtonGroupProps {
  primaryActions?: ActionButtonConfig[];
  secondaryActions?: ActionButtonConfig[];
  destructiveActions?: ActionButtonConfig[];
  size?: 'small' | 'medium' | 'large';
  showDividers?: boolean;
  justifyContent?: 'flex-start' | 'center' | 'flex-end';
  flexWrap?: 'wrap' | 'nowrap';
}

const ActionButtonGroup: React.FC<ActionButtonGroupProps> = ({
  primaryActions = [],
  secondaryActions = [],
  destructiveActions = [],
  size = 'small',
  showDividers = true,
  justifyContent = 'flex-end',
  flexWrap = 'wrap'
}) => {
  const theme = useTheme();

  const renderActionGroup = (actions: ActionButtonConfig[], groupName: string) => {
    if (actions.length === 0) return null;

    return (
      <Box key={groupName} sx={{ display: 'flex', gap: 0.5 }}>
        {actions.map((action, index) => (
          <ActionButton
            key={`${groupName}-${index}`}
            {...action}
            size={action.size || size}
          />
        ))}
      </Box>
    );
  };

  const hasPrimaryActions = primaryActions.length > 0;
  const hasSecondaryActions = secondaryActions.length > 0;
  const hasDestructiveActions = destructiveActions.length > 0;

  return (
    <Box sx={{
      display: 'flex',
      gap: 1,
      alignItems: 'center',
      justifyContent,
      flexWrap
    }}>
      {/* Primary Actions */}
      {hasPrimaryActions && renderActionGroup(primaryActions, 'primary')}

      {/* Divider after primary actions */}
      {showDividers && hasPrimaryActions && (hasSecondaryActions || hasDestructiveActions) && (
        <Divider 
          orientation="vertical" 
          flexItem 
          sx={{ 
            borderColor: theme.palette.mode === 'light' ? '#e0e0e0' : '#404040',
            mx: 0.5 
          }} 
        />
      )}

      {/* Secondary Actions */}
      {hasSecondaryActions && renderActionGroup(secondaryActions, 'secondary')}

      {/* Divider after secondary actions */}
      {showDividers && hasSecondaryActions && hasDestructiveActions && (
        <Divider 
          orientation="vertical" 
          flexItem 
          sx={{ 
            borderColor: theme.palette.mode === 'light' ? '#e0e0e0' : '#404040',
            mx: 0.5 
          }} 
        />
      )}

      {/* Destructive Actions */}
      {hasDestructiveActions && renderActionGroup(destructiveActions, 'destructive')}
    </Box>
  );
};

export default ActionButtonGroup;
