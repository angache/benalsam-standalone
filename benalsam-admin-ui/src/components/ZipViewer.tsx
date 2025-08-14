import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Folder,
  InsertDriveFile,
  Download,
  Visibility,
  ExpandMore,
  Archive,
  Code,
  Image,
  Description,
  VideoFile,
  AudioFile
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { apiService } from '../services/api';

interface ZipFile {
  name: string;
  size: number;
  date: string;
  isDirectory: boolean;
  path: string;
}

interface ZipViewerProps {
  backupId: string;
  onClose: () => void;
}

const ZipViewer: React.FC<ZipViewerProps> = ({ backupId, onClose }) => {
  const theme = useTheme();
  const [files, setFiles] = useState<ZipFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<ZipFile | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [contentDialogOpen, setContentDialogOpen] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);

  React.useEffect(() => {
    loadZipContents();
  }, [backupId]);

  const loadZipContents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getBackupZipContents(backupId);
      setFiles(response.data.files || []);
    } catch (err) {
      setError('Zip içeriği yüklenemedi');
      console.error('Zip load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const viewFileContent = async (file: ZipFile) => {
    if (file.isDirectory) return;
    
    setSelectedFile(file);
    setContentDialogOpen(true);
    setContentLoading(true);
    
    try {
      const response = await apiService.getBackupFileContent(backupId, file.path);
      setFileContent(response.data.content || '');
    } catch (err) {
      setFileContent('Dosya içeriği yüklenemedi');
      console.error('File content error:', err);
    } finally {
      setContentLoading(false);
    }
  };

  const downloadFile = async (file: ZipFile) => {
    if (file.isDirectory) return;
    
    try {
      const response = await apiService.downloadBackupFile(backupId, file.path);
      
      // Create download link
      const blob = new Blob([response.data], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const getFileIcon = (fileName: string, isDirectory: boolean) => {
    if (isDirectory) return <Folder />;
    
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'js':
      case 'tsx':
      case 'jsx':
        return <Code />;
      case 'json':
        return <Description />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <Image />;
      case 'mp4':
      case 'avi':
      case 'mov':
        return <VideoFile />;
      case 'mp3':
      case 'wav':
        return <AudioFile />;
      default:
        return <InsertDriveFile />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const groupFilesByType = () => {
    const groups: { [key: string]: ZipFile[] } = {
      'Edge Functions': [],
      'Database': [],
      'Migrations': [],
      'Schema': [],
      'Other': []
    };

    files.forEach(file => {
      if (file.path.includes('edge-functions')) {
        groups['Edge Functions'].push(file);
      } else if (file.path.includes('database')) {
        groups['Database'].push(file);
      } else if (file.path.includes('migrations')) {
        groups['Migrations'].push(file);
      } else if (file.path.includes('schema')) {
        groups['Schema'].push(file);
      } else {
        groups['Other'].push(file);
      }
    });

    return groups;
  };

  const fileGroups = groupFilesByType();

  return (
    <Dialog 
      open={true} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: theme.palette.mode === 'light' ? '#ffffff' : '#1e1e1e',
          color: theme.palette.mode === 'light' ? '#212121' : '#ffffff'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: theme.palette.mode === 'light' ? '#f5f5f5' : '#2d2d2d',
        color: theme.palette.mode === 'light' ? '#212121' : '#ffffff'
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Archive />
          <Typography variant="h6">Backup İçeriği: {backupId}</Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
        ) : (
          <Box>
            {Object.entries(fileGroups).map(([groupName, groupFiles]) => {
              if (groupFiles.length === 0) return null;
              
              return (
                <Accordion key={groupName} defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" sx={{ 
                      color: theme.palette.mode === 'light' ? '#212121' : '#ffffff' 
                    }}>
                      {groupName} ({groupFiles.length} dosya)
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <List dense>
                      {groupFiles.map((file, index) => (
                        <React.Fragment key={file.path}>
                          <ListItem
                            sx={{
                              bgcolor: theme.palette.mode === 'light' ? '#fafafa' : '#2a2a2a',
                              '&:hover': {
                                bgcolor: theme.palette.mode === 'light' ? '#f0f0f0' : '#3a3a3a'
                              }
                            }}
                          >
                            <ListItemIcon sx={{ 
                              color: theme.palette.mode === 'light' ? '#666' : '#ccc' 
                            }}>
                              {getFileIcon(file.name, file.isDirectory)}
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography sx={{ 
                                  color: theme.palette.mode === 'light' ? '#212121' : '#ffffff',
                                  fontWeight: file.isDirectory ? 'bold' : 'normal'
                                }}>
                                  {file.name}
                                </Typography>
                              }
                              secondary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography variant="caption" sx={{ 
                                    color: theme.palette.mode === 'light' ? '#666' : '#ccc' 
                                  }}>
                                    {formatFileSize(file.size)}
                                  </Typography>
                                  <Typography variant="caption" sx={{ 
                                    color: theme.palette.mode === 'light' ? '#666' : '#ccc' 
                                  }}>
                                    {new Date(file.date).toLocaleString('tr-TR')}
                                  </Typography>
                                  {file.isDirectory && (
                                    <Chip 
                                      label="Klasör" 
                                      size="small" 
                                      color="primary" 
                                      variant="outlined"
                                    />
                                  )}
                                </Box>
                              }
                            />
                            <Box>
                              {!file.isDirectory && (
                                <>
                                  <Tooltip title="İçeriği Görüntüle">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => viewFileContent(file)}
                                      sx={{ color: theme.palette.primary.main }}
                                    >
                                      <Visibility />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="İndir">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => downloadFile(file)}
                                      sx={{ color: theme.palette.secondary.main }}
                                    >
                                      <Download />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </Box>
                          </ListItem>
                          {index < groupFiles.length - 1 && (
                            <Divider sx={{ 
                              borderColor: theme.palette.mode === 'light' ? '#e0e0e0' : '#404040' 
                            }} />
                          )}
                        </React.Fragment>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        bgcolor: theme.palette.mode === 'light' ? '#f5f5f5' : '#2d2d2d',
        p: 2
      }}>
        <Button onClick={onClose} variant="outlined">
          Kapat
        </Button>
      </DialogActions>

      {/* File Content Dialog */}
      <Dialog 
        open={contentDialogOpen} 
        onClose={() => setContentDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: theme.palette.mode === 'light' ? '#ffffff' : '#1e1e1e',
            color: theme.palette.mode === 'light' ? '#212121' : '#ffffff'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: theme.palette.mode === 'light' ? '#f5f5f5' : '#2d2d2d',
          color: theme.palette.mode === 'light' ? '#212121' : '#ffffff'
        }}>
          {selectedFile?.name}
        </DialogTitle>
        <DialogContent>
          {contentLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <Box
              component="pre"
              sx={{
                bgcolor: theme.palette.mode === 'light' ? '#f8f8f8' : '#2a2a2a',
                color: theme.palette.mode === 'light' ? '#212121' : '#ffffff',
                p: 2,
                borderRadius: 1,
                overflow: 'auto',
                maxHeight: '60vh',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                border: `1px solid ${theme.palette.mode === 'light' ? '#e0e0e0' : '#404040'}`
              }}
            >
              {fileContent}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          bgcolor: theme.palette.mode === 'light' ? '#f5f5f5' : '#2d2d2d',
          p: 2
        }}>
          <Button onClick={() => setContentDialogOpen(false)} variant="outlined">
            Kapat
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default ZipViewer;
