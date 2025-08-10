import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';

interface AlertRule {
  id: string;
  name: string;
  description: string;
  type: 'performance' | 'error' | 'business' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  condition: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    threshold: number;
    timeWindow: number;
  };
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  acknowledgedBy?: string;
  metadata?: any;
}

interface AlertMetrics {
  totalAlerts: number;
  activeAlerts: number;
  acknowledgedAlerts: number;
  resolvedAlerts: number;
  alertsBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  averageResponseTime: number;
  falsePositiveRate: number;
  alertCoverage: number;
}

const AlertSystemPage: React.FC = () => {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [metrics, setMetrics] = useState<AlertMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openRuleDialog, setOpenRuleDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    type: 'performance' as const,
    severity: 'medium' as const,
    condition: {
      metric: 'response_time',
      operator: 'gt' as const,
      threshold: 500,
      timeWindow: 5
    },
    enabled: true
  });

  const fetchAlertData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [rulesResponse, alertsResponse, metricsResponse] = await Promise.all([
        apiService.getAlertRules(),
        apiService.getAlerts(),
        apiService.getAlertMetrics()
      ]);

      setRules(rulesResponse.data || []);
      setAlerts(alertsResponse.data || []);
      setMetrics(metricsResponse.data);
    } catch (err) {
      setError('Alert verileri yüklenirken hata oluştu');
      console.error('Alert data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertData();
  }, []);

  const handleCreateRule = async () => {
    try {
      await apiService.createAlertRule(ruleForm);
      setOpenRuleDialog(false);
      setRuleForm({
        name: '',
        description: '',
        type: 'performance',
        severity: 'medium',
        condition: {
          metric: 'response_time',
          operator: 'gt',
          threshold: 500,
          timeWindow: 5
        },
        enabled: true
      });
      fetchAlertData();
    } catch (err) {
      setError('Alert rule oluşturulurken hata oluştu');
    }
  };

  const handleUpdateRule = async () => {
    if (!editingRule) return;
    
    try {
      await apiService.updateAlertRule(editingRule.id, ruleForm);
      setOpenRuleDialog(false);
      setEditingRule(null);
      setRuleForm({
        name: '',
        description: '',
        type: 'performance',
        severity: 'medium',
        condition: {
          metric: 'response_time',
          operator: 'gt',
          threshold: 500,
          timeWindow: 5
        },
        enabled: true
      });
      fetchAlertData();
    } catch (err) {
      setError('Alert rule güncellenirken hata oluştu');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!window.confirm('Bu alert rule\'u silmek istediğinizden emin misiniz?')) return;
    
    try {
      await apiService.deleteAlertRule(id);
      fetchAlertData();
    } catch (err) {
      setError('Alert rule silinirken hata oluştu');
    }
  };

  const handleAcknowledgeAlert = async (id: string) => {
    try {
      await apiService.acknowledgeAlert(id, 'current_user');
      fetchAlertData();
    } catch (err) {
      setError('Alert acknowledge edilirken hata oluştu');
    }
  };

  const handleResolveAlert = async (id: string) => {
    try {
      await apiService.resolveAlert(id);
      fetchAlertData();
    } catch (err) {
      setError('Alert resolve edilirken hata oluştu');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ErrorIcon color="error" />;
      case 'high': return <WarningIcon color="warning" />;
      case 'medium': return <InfoIcon color="info" />;
      case 'low': return <CheckCircleIcon color="success" />;
      default: return <InfoIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'error';
      case 'acknowledged': return 'warning';
      case 'resolved': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Alert verileri yükleniyor...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <NotificationsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Alert System Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenRuleDialog(true)}
          >
            Yeni Alert Rule
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAlertData}
          >
            Yenile
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {metrics && (
        <>
          {/* Alert Metrics */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <NotificationsIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Toplam Alert</Typography>
                  </Box>
                  <Typography variant="h4" color="primary">
                    {metrics.totalAlerts}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ErrorIcon color="error" sx={{ mr: 1 }} />
                    <Typography variant="h6">Aktif Alert</Typography>
                  </Box>
                  <Typography variant="h4" color="error">
                    {metrics.activeAlerts}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <WarningIcon color="warning" sx={{ mr: 1 }} />
                    <Typography variant="h6">Acknowledge</Typography>
                  </Box>
                  <Typography variant="h4" color="warning.main">
                    {metrics.acknowledgedAlerts}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="h6">Çözülen</Typography>
                  </Box>
                  <Typography variant="h4" color="success.main">
                    {metrics.resolvedAlerts}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Performance Metrics */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Ortalama Yanıt Süresi
                  </Typography>
                  <Typography variant="h3" color="primary">
                    {metrics.averageResponseTime.toFixed(1)} dk
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hedef: &lt;5 dakika
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    False Positive Rate
                  </Typography>
                  <Typography variant="h3" color="primary">
                    {metrics.falsePositiveRate.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hedef: &lt;5%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Alert Coverage
                  </Typography>
                  <Typography variant="h3" color="primary">
                    {metrics.alertCoverage.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hedef: &gt;95%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {/* Alert Rules */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Alert Rules
          </Typography>
          <List>
            {rules.map((rule) => (
              <ListItem key={rule.id} divider>
                <ListItemIcon>
                  {getSeverityIcon(rule.severity)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1">{rule.name}</Typography>
                      <Chip
                        label={rule.severity}
                        color={getSeverityColor(rule.severity) as any}
                        size="small"
                      />
                      <Chip
                        label={rule.enabled ? 'Aktif' : 'Pasif'}
                        color={rule.enabled ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2">{rule.description}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {rule.condition.metric} {rule.condition.operator} {rule.condition.threshold}
                        {' '}({rule.condition.timeWindow} dk)
                      </Typography>
                    </Box>
                  }
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Düzenle">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditingRule(rule);
                        setRuleForm({
                          name: rule.name,
                          description: rule.description,
                          type: rule.type,
                          severity: rule.severity,
                          condition: rule.condition,
                          enabled: rule.enabled
                        });
                        setOpenRuleDialog(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Sil">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Aktif Alertler
          </Typography>
          <List>
            {alerts.filter(alert => alert.status === 'active').map((alert) => (
              <ListItem key={alert.id} divider>
                <ListItemIcon>
                  {getSeverityIcon(alert.severity)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1">{alert.ruleName}</Typography>
                      <Chip
                        label={alert.severity}
                        color={getSeverityColor(alert.severity) as any}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2">{alert.message}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(alert.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                  }
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                  >
                    Acknowledge
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    onClick={() => handleResolveAlert(alert.id)}
                  >
                    Resolve
                  </Button>
                </Box>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Alert Rule Dialog */}
      <Dialog open={openRuleDialog} onClose={() => setOpenRuleDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRule ? 'Alert Rule Düzenle' : 'Yeni Alert Rule'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Rule Adı"
                value={ruleForm.name}
                onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Açıklama"
                multiline
                rows={3}
                value={ruleForm.description}
                onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Tip</InputLabel>
                <Select
                  value={ruleForm.type}
                  label="Tip"
                  onChange={(e) => setRuleForm({ ...ruleForm, type: e.target.value as any })}
                >
                  <MenuItem value="performance">Performance</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                  <MenuItem value="business">Business</MenuItem>
                  <MenuItem value="security">Security</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={ruleForm.severity}
                  label="Severity"
                  onChange={(e) => setRuleForm({ ...ruleForm, severity: e.target.value as any })}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Metric</InputLabel>
                <Select
                  value={ruleForm.condition.metric}
                  label="Metric"
                  onChange={(e) => setRuleForm({
                    ...ruleForm,
                    condition: { ...ruleForm.condition, metric: e.target.value }
                  })}
                >
                  <MenuItem value="response_time">Response Time</MenuItem>
                  <MenuItem value="error_rate">Error Rate</MenuItem>
                  <MenuItem value="cpu_usage">CPU Usage</MenuItem>
                  <MenuItem value="memory_usage">Memory Usage</MenuItem>
                  <MenuItem value="conversion_rate">Conversion Rate</MenuItem>
                  <MenuItem value="drop_off_rate">Drop-off Rate</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Operator</InputLabel>
                <Select
                  value={ruleForm.condition.operator}
                  label="Operator"
                  onChange={(e) => setRuleForm({
                    ...ruleForm,
                    condition: { ...ruleForm.condition, operator: e.target.value as any }
                  })}
                >
                  <MenuItem value="gt">&gt;</MenuItem>
                  <MenuItem value="lt">&lt;</MenuItem>
                  <MenuItem value="eq">=</MenuItem>
                  <MenuItem value="gte">&gt;=</MenuItem>
                  <MenuItem value="lte">&lt;=</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Threshold"
                type="number"
                value={ruleForm.condition.threshold}
                onChange={(e) => setRuleForm({
                  ...ruleForm,
                  condition: { ...ruleForm.condition, threshold: parseFloat(e.target.value) }
                })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Time Window (dakika)"
                type="number"
                value={ruleForm.condition.timeWindow}
                onChange={(e) => setRuleForm({
                  ...ruleForm,
                  condition: { ...ruleForm.condition, timeWindow: parseInt(e.target.value) }
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRuleDialog(false)}>İptal</Button>
          <Button
            onClick={editingRule ? handleUpdateRule : handleCreateRule}
            variant="contained"
          >
            {editingRule ? 'Güncelle' : 'Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AlertSystemPage; 