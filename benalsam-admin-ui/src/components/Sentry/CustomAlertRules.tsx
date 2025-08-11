import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
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
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
} from '@mui/material';
import {
  Bell,
  Plus,
  Edit,
  Delete,
  Settings,
  AlertTriangle,
  CheckCircle,
  Pause,
  Play,
} from 'lucide-react';

interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: 'error_rate' | 'error_count' | 'performance' | 'user_impact';
  condition: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  threshold: number;
  timeWindow: number; // minutes
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: string[];
  enabled: boolean;
  lastTriggered?: string;
  triggerCount: number;
}

interface CustomAlertRulesProps {
  rules: AlertRule[];
  onAddRule: (rule: Omit<AlertRule, 'id'>) => void;
  onUpdateRule: (id: string, rule: Partial<AlertRule>) => void;
  onDeleteRule: (id: string) => void;
  onToggleRule: (id: string, enabled: boolean) => void;
}

const CustomAlertRules: React.FC<CustomAlertRulesProps> = ({
  rules,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
  onToggleRule,
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    metric: 'error_rate' as AlertRule['metric'],
    condition: 'gt' as AlertRule['condition'],
    threshold: 0,
    timeWindow: 5,
    severity: 'medium' as AlertRule['severity'],
    channels: [] as string[],
  });

  const handleOpenDialog = (rule?: AlertRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        name: rule.name,
        description: rule.description,
        metric: rule.metric,
        condition: rule.condition,
        threshold: rule.threshold,
        timeWindow: rule.timeWindow,
        severity: rule.severity,
        channels: rule.channels,
      });
    } else {
      setEditingRule(null);
      setFormData({
        name: '',
        description: '',
        metric: 'error_rate',
        condition: 'gt',
        threshold: 0,
        timeWindow: 5,
        severity: 'medium',
        channels: [],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRule(null);
  };

  const handleSubmit = () => {
    if (editingRule) {
      onUpdateRule(editingRule.id, formData);
    } else {
      onAddRule(formData);
    }
    handleCloseDialog();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle size={16} color="#d32f2f" />;
      case 'high': return <AlertTriangle size={16} color="#f44336" />;
      case 'medium': return <AlertTriangle size={16} color="#ff9800" />;
      case 'low': return <CheckCircle size={16} color="#2196f3" />;
      default: return <CheckCircle size={16} color="#757575" />;
    }
  };

  const formatTimeWindow = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hours`;
    return `${Math.floor(minutes / 1440)} days`;
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'error_rate': return 'Error Rate';
      case 'error_count': return 'Error Count';
      case 'performance': return 'Performance';
      case 'user_impact': return 'User Impact';
      default: return metric;
    }
  };

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'gt': return 'Greater than';
      case 'lt': return 'Less than';
      case 'gte': return 'Greater than or equal';
      case 'lte': return 'Less than or equal';
      case 'eq': return 'Equal to';
      default: return condition;
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Bell size={20} />
            <Typography variant="h6">Custom Alert Rules</Typography>
            <Chip label={rules.length} size="small" color="primary" />
          </Box>
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            onClick={() => handleOpenDialog()}
          >
            Add Rule
          </Button>
        </Box>

        {rules.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Settings size={48} color="#757575" />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              No alert rules configured
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Create your first alert rule to get notified about important events
            </Typography>
          </Box>
        ) : (
          <List>
            {rules.map((rule, index) => (
              <React.Fragment key={rule.id}>
                <ListItem>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    {getSeverityIcon(rule.severity)}
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="body1" fontWeight="medium">
                          {rule.name}
                        </Typography>
                        <Chip
                          label={rule.severity.toUpperCase()}
                          size="small"
                          color={getSeverityColor(rule.severity)}
                        />
                        {!rule.enabled && (
                          <Chip label="PAUSED" size="small" color="default" />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {rule.description}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          {getMetricLabel(rule.metric)} {getConditionLabel(rule.condition)} {rule.threshold}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          • {formatTimeWindow(rule.timeWindow)}
                        </Typography>
                        {rule.lastTriggered && (
                          <Typography variant="caption" color="text.secondary">
                            • Last triggered: {new Date(rule.lastTriggered).toLocaleString()}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          • Triggered {rule.triggerCount} times
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => onToggleRule(rule.id, !rule.enabled)}
                        color={rule.enabled ? 'success' : 'default'}
                      >
                        {rule.enabled ? <Play size={16} /> : <Pause size={16} />}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(rule)}
                      >
                        <Edit size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDeleteRule(rule.id)}
                      >
                        <Delete size={16} />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < rules.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingRule ? 'Edit Alert Rule' : 'Create Alert Rule'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Rule Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />
              <FormControl fullWidth>
                <InputLabel>Metric</InputLabel>
                <Select
                  value={formData.metric}
                  label="Metric"
                  onChange={(e) => setFormData({ ...formData, metric: e.target.value as AlertRule['metric'] })}
                >
                  <MenuItem value="error_rate">Error Rate</MenuItem>
                  <MenuItem value="error_count">Error Count</MenuItem>
                  <MenuItem value="performance">Performance</MenuItem>
                  <MenuItem value="user_impact">User Impact</MenuItem>
                </Select>
              </FormControl>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl sx={{ flex: 1 }}>
                  <InputLabel>Condition</InputLabel>
                  <Select
                    value={formData.condition}
                    label="Condition"
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value as AlertRule['condition'] })}
                  >
                    <MenuItem value="gt">Greater than</MenuItem>
                    <MenuItem value="lt">Less than</MenuItem>
                    <MenuItem value="gte">Greater than or equal</MenuItem>
                    <MenuItem value="lte">Less than or equal</MenuItem>
                    <MenuItem value="eq">Equal to</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Threshold"
                  type="number"
                  value={formData.threshold}
                  onChange={(e) => setFormData({ ...formData, threshold: Number(e.target.value) })}
                  sx={{ flex: 1 }}
                />
              </Box>
              <TextField
                label="Time Window (minutes)"
                type="number"
                value={formData.timeWindow}
                onChange={(e) => setFormData({ ...formData, timeWindow: Number(e.target.value) })}
                fullWidth
                helperText={`Alert will trigger if condition is met for ${formatTimeWindow(formData.timeWindow)}`}
              />
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={formData.severity}
                  label="Severity"
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value as AlertRule['severity'] })}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={!formData.name || formData.threshold < 0}
            >
              {editingRule ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CustomAlertRules;
