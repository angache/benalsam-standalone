import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Alert,
} from '@mui/material';
import {
  Bug,
  AlertTriangle,
  Eye,
  Activity,
  CheckCircle,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { ExpandMore, ExpandLess } from '@mui/icons-material';

interface LiveError {
  id: string;
  title: string;
  message: string;
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  timestamp: string;
  user: {
    id: string;
    email?: string;
    username?: string;
  };
  tags: Record<string, string>;
  count: number;
  isNew: boolean;
}

interface LiveErrorStreamProps {
  errors: LiveError[];
  isConnected: boolean;
  onRefresh: () => void;
}

const LiveErrorStream: React.FC<LiveErrorStreamProps> = ({ errors, isConnected, onRefresh }) => {
  const [expanded, setExpanded] = useState(true);
  const [newErrors, setNewErrors] = useState<LiveError[]>([]);

  useEffect(() => {
    // Show real errors only - no simulation
    if (errors.length > 0) {
      setNewErrors(errors.slice(0, 10).map(error => ({
        ...error,
        isNew: false
      })));
    } else {
      setNewErrors([]);
    }
  }, [errors]);

  const getErrorLevelIcon = (level: string) => {
    switch (level) {
      case 'fatal': return <AlertTriangle size={16} color="#d32f2f" />;
      case 'error': return <Bug size={16} color="#f44336" />;
      case 'warning': return <AlertTriangle size={16} color="#ff9800" />;
      case 'info': return <Eye size={16} color="#2196f3" />;
      case 'debug': return <Activity size={16} color="#757575" />;
      default: return <Activity size={16} color="#757575" />;
    }
  };

  const getErrorLevelColor = (level: string) => {
    switch (level) {
      case 'fatal': return 'error';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      case 'debug': return 'default';
      default: return 'default';
    }
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const errorTime = new Date(timestamp);
    const diffMs = now.getTime() - errorTime.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    return `${Math.floor(diffSeconds / 3600)}h ago`;
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">Live Error Stream</Typography>
            <Badge badgeContent={newErrors.filter(e => e.isNew).length} color="error">
              <Bug size={20} />
            </Badge>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {isConnected ? (
                <Wifi size={16} color="#4caf50" />
              ) : (
                <WifiOff size={16} color="#f44336" />
              )}
              <Typography variant="caption" color={isConnected ? 'success.main' : 'error.main'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Typography>
            </Box>
            <IconButton size="small" onClick={onRefresh}>
              <RefreshCw size={16} />
            </IconButton>
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLess size={16} /> : <ExpandMore size={16} />}
            </IconButton>
          </Box>
        </Box>

        <Collapse in={expanded}>
          {!isConnected && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Connection lost. Trying to reconnect...
            </Alert>
          )}

          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {newErrors.map((error) => (
              <ListItem
                key={error.id}
                sx={{
                  border: 1,
                  borderColor: error.isNew ? 'error.main' : 'divider',
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: error.isNew ? 'error.50' : 'transparent',
                  transition: 'all 0.3s ease',
                }}
              >
                <ListItemIcon>
                  {getErrorLevelIcon(error.level)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {error.title}
                      </Typography>
                      {error.isNew && (
                        <Chip label="NEW" size="small" color="error" />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {error.message}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(error.timestamp)}
                        </Typography>
                        {error.user && (
                          <Typography variant="caption" color="text.secondary">
                            User: {error.user.email || error.user.username || error.user.id}
                          </Typography>
                        )}
                        <Chip
                          label={error.level.toUpperCase()}
                          size="small"
                          color={getErrorLevelColor(error.level)}
                        />
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>

          {newErrors.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircle size={48} color="#4caf50" />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                No errors in the last 5 minutes
              </Typography>
            </Box>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default LiveErrorStream;
