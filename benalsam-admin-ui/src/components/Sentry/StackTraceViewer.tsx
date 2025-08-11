import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
} from '@mui/material';
import {
  Code,
  FileText,
  MapPin,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Bug,
  AlertTriangle,
} from 'lucide-react';

interface StackFrame {
  filename: string;
  function: string;
  lineno: number;
  colno: number;
  in_app: boolean;
  context_line?: string;
  pre_context?: string[];
  post_context?: string[];
}

interface StackTrace {
  frames: StackFrame[];
  registers?: Record<string, string>;
  has_system_frames: boolean;
}

interface StackTraceViewerProps {
  stackTrace: StackTrace;
  errorTitle: string;
  errorMessage: string;
  errorLevel: string;
  timestamp: string;
}

const StackTraceViewer: React.FC<StackTraceViewerProps> = ({
  stackTrace,
  errorTitle,
  errorMessage,
  errorLevel,
  timestamp,
}) => {
  const [expandedFrames, setExpandedFrames] = useState<Set<number>>(new Set([0]));
  const [copiedFrame, setCopiedFrame] = useState<number | null>(null);

  const toggleFrame = (index: number) => {
    const newExpanded = new Set(expandedFrames);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedFrames(newExpanded);
  };

  const copyFrameInfo = async (frame: StackFrame, index: number) => {
    const frameInfo = `${frame.filename}:${frame.lineno}:${frame.colno} in ${frame.function}`;
    try {
      await navigator.clipboard.writeText(frameInfo);
      setCopiedFrame(index);
      setTimeout(() => setCopiedFrame(null), 2000);
    } catch (error) {
      console.error('Failed to copy frame info:', error);
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

  const getErrorLevelIcon = (level: string) => {
    switch (level) {
      case 'fatal': return <AlertTriangle size={16} color="#d32f2f" />;
      case 'error': return <Bug size={16} color="#f44336" />;
      case 'warning': return <AlertTriangle size={16} color="#ff9800" />;
      default: return <Bug size={16} color="#757575" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('tr-TR');
  };

  const isInAppFrame = (frame: StackFrame) => {
    return frame.in_app && !frame.filename.includes('node_modules');
  };

  return (
    <Card>
      <CardContent>
        {/* Error Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {getErrorLevelIcon(errorLevel)}
            <Typography variant="h6" component="h2">
              {errorTitle}
            </Typography>
            <Chip
              label={errorLevel.toUpperCase()}
              size="small"
              color={getErrorLevelColor(errorLevel)}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {errorMessage}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatTimestamp(timestamp)}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Stack Trace */}
        <Typography variant="h6" gutterBottom>
          Stack Trace
        </Typography>

        {stackTrace.frames.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Code size={48} color="#757575" />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              No stack trace available
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {stackTrace.frames.map((frame, index) => (
              <ListItem
                key={index}
                sx={{
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  p: 0,
                  mb: 1,
                  border: 1,
                  borderColor: isInAppFrame(frame) ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  backgroundColor: isInAppFrame(frame) ? 'primary.50' : 'transparent',
                }}
              >
                {/* Frame Header */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleFrame(index)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    {expandedFrames.has(index) ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FileText size={16} color="#2196f3" />
                      <Typography variant="body2" fontWeight="medium">
                        {frame.filename}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      :
                    </Typography>
                    <Typography variant="body2" fontWeight="medium" color="error.main">
                      {frame.lineno}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      :
                    </Typography>
                    <Typography variant="body2" fontWeight="medium" color="error.main">
                      {frame.colno}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isInAppFrame(frame) && (
                      <Chip label="APP" size="small" color="primary" />
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {frame.function}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyFrameInfo(frame, index);
                      }}
                    >
                      <Copy size={14} />
                    </IconButton>
                  </Box>
                </Box>

                {/* Frame Details */}
                <Collapse in={expandedFrames.has(index)}>
                  <Box sx={{ p: 2, pt: 0 }}>
                    {frame.context_line && (
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          backgroundColor: 'grey.50',
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          mb: 2,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <MapPin size={14} color="#f44336" />
                          <Typography variant="caption" fontWeight="bold" color="error.main">
                            Line {frame.lineno}
                          </Typography>
                        </Box>
                        <Typography
                          component="pre"
                          sx={{
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {frame.context_line}
                        </Typography>
                      </Paper>
                    )}

                    {/* Context Lines */}
                    {(frame.pre_context || frame.post_context) && (
                      <Box sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {frame.pre_context && frame.pre_context.length > 0 && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Previous lines:
                            </Typography>
                            {frame.pre_context.map((line, lineIndex) => (
                              <Typography
                                key={lineIndex}
                                component="div"
                                sx={{
                                  color: 'text.secondary',
                                  fontFamily: 'monospace',
                                  fontSize: '0.75rem',
                                }}
                              >
                                {line}
                              </Typography>
                            ))}
                          </Box>
                        )}
                        {frame.post_context && frame.post_context.length > 0 && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Next lines:
                            </Typography>
                            {frame.post_context.map((line, lineIndex) => (
                              <Typography
                                key={lineIndex}
                                component="div"
                                sx={{
                                  color: 'text.secondary',
                                  fontFamily: 'monospace',
                                  fontSize: '0.75rem',
                                }}
                              >
                                {line}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* Frame Metadata */}
                    <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary">
                        Function: <strong>{frame.function}</strong>
                      </Typography>
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        File: <strong>{frame.filename}</strong>
                      </Typography>
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        Position: <strong>Line {frame.lineno}, Column {frame.colno}</strong>
                      </Typography>
                      {frame.in_app && (
                        <>
                          <br />
                          <Typography variant="caption" color="success.main">
                            ✓ Application code
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Box>
                </Collapse>
              </ListItem>
            ))}
          </List>
        )}

        {/* Registers (if available) */}
        {stackTrace.registers && Object.keys(stackTrace.registers).length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              CPU Registers
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                {Object.entries(stackTrace.registers).map(([register, value]) => (
                  <Box key={register}>
                    <Typography variant="caption" color="text.secondary">
                      {register.toUpperCase()}
                    </Typography>
                    <Typography variant="body2" fontFamily="monospace">
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StackTraceViewer;
