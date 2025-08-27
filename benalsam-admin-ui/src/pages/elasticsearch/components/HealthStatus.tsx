// ===========================
// HEALTH STATUS COMPONENT
// ===========================

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { HealthStatusProps } from '../types';

const HealthStatus: React.FC<HealthStatusProps> = ({
  healthStatus,
  isLoading,
  error
}) => {
  const getStatusIcon = (status: boolean) => {
    return status ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />;
  };

  const getStatusColor = (status: boolean) => {
    return status ? 'success' : 'error';
  };

  const getStatusText = (status: boolean) => {
    return status ? 'Healthy' : 'Unhealthy';
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <AlertTitle>Error</AlertTitle>
        {error}
      </Alert>
    );
  }

  const services = [
    {
      name: 'Elasticsearch',
      status: healthStatus.elasticsearch,
      description: 'Search and analytics engine'
    },
    {
      name: 'Redis',
      status: healthStatus.redis,
      description: 'Caching and session storage'
    },
    {
      name: 'Indexer',
      status: healthStatus.indexer,
      description: 'Data indexing service'
    },
    {
      name: 'Sync Service',
      status: healthStatus.syncService,
      description: 'Data synchronization service'
    }
  ];

  const overallHealth = Object.values(healthStatus).every(status => status);

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        System Health Status
      </Typography>
      
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            {getStatusIcon(overallHealth)}
            <Typography variant="h6" sx={{ ml: 1 }}>
              Overall Status: {getStatusText(overallHealth)}
            </Typography>
            <Chip
              label={overallHealth ? 'All Systems Operational' : 'Issues Detected'}
              color={getStatusColor(overallHealth)}
              size="small"
              sx={{ ml: 2 }}
            />
          </Box>

          <Grid container spacing={2}>
            {services.map((service, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      {service.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {service.description}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center">
                    {getStatusIcon(service.status)}
                    <Chip
                      label={getStatusText(service.status)}
                      color={getStatusColor(service.status)}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>

          {!overallHealth && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <AlertTitle>Warning</AlertTitle>
              Some services are experiencing issues. Please check the individual service statuses above.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default HealthStatus;
