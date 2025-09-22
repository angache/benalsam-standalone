import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Chip,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';

interface IndexInfo {
  index: string;
  health: string;
  status: string;
  docs_count: number;
  store_size: string;
}

interface Document {
  _id: string;
  _source: any;
  _index: string;
}

interface SearchResult {
  hits: {
    total: { value: number };
    hits: Document[];
  };
}

const ElasticsearchUI: React.FC = () => {
  const [indices, setIndices] = useState<IndexInfo[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<string>('indices');

  // Fetch indices on component mount
  useEffect(() => {
    console.log('🔍 ElasticsearchUI component mounted'); // Debug log
    fetchIndices();
  }, []);

  const fetchIndices = async () => {
    console.log('🚀 fetchIndices called'); // Debug log
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Token:', token ? 'exists' : 'missing'); // Debug log
      
      const response = await fetch('http://localhost:3002/api/v1/elasticsearch/indices', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('📡 Response status:', response.status); // Debug log
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries())); // Debug log
      
      const responseText = await response.text();
      console.log('📡 Response text:', responseText); // Debug log
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('📦 Parsed data:', data); // Debug log
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError); // Debug log
        throw new Error('Invalid JSON response');
      }
      
      if (data.success) {
        console.log('Indices data:', data.data); // Debug log
        setIndices(data.data);
      } else {
        setError(data.message || 'Failed to fetch indices');
      }
    } catch (err) {
      console.error('Fetch indices error:', err); // Debug log
      setError('Failed to connect to Elasticsearch');
    } finally {
      setLoading(false);
    }
  };

  const searchDocuments = async () => {
    if (!selectedIndex) return;

    setLoading(true);
    setError('');
    try {
      const query = searchQuery.trim() || '*';
      const data = await apiService.searchElasticsearchIndex(selectedIndex, query, 20);
      
      if (data.success) {
        setSearchResults(data.data);
      } else {
        setError(data.message || 'Failed to search documents');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search documents');
    } finally {
      setLoading(false);
    }
  };

  const deleteIndex = async (indexName: string) => {
    if (!confirm(`Are you sure you want to delete index "${indexName}"?`)) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/v1/elasticsearch/index/${indexName}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchIndices(); // Refresh indices list
        setError('');
      } else {
        setError(data.message || 'Failed to delete index');
      }
    } catch (err) {
      setError('Failed to delete index');
    } finally {
      setLoading(false);
    }
  };

  const reindexIndex = async (indexName: string) => {
    if (!confirm(`Are you sure you want to reindex "${indexName}"?`)) return;

    setLoading(true);
    setError('');
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1';
      const response = await fetch(`${API_BASE_URL}/elasticsearch/reindex/${indexName}`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        setError('');
      } else {
        setError(data.message || 'Failed to reindex');
      }
    } catch (err) {
      setError('Failed to reindex');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Elasticsearch Management
        </Typography>
        <Button
          variant="contained"
          onClick={fetchIndices}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
            <Tab label="Indices" value="indices" />
            <Tab label="Search" value="search" />
          </Tabs>

          {selectedTab === 'indices' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <StorageIcon />
                Elasticsearch Indices
              </Typography>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Index Name</TableCell>
                        <TableCell>Health</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Documents</TableCell>
                        <TableCell>Size</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {indices.map((index) => (
                        <TableRow key={index.index}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {index.index}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={index.health}
                              color={index.health === 'green' ? 'success' : index.health === 'yellow' ? 'warning' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip label={index.status} variant="outlined" size="small" />
                          </TableCell>
                          <TableCell>{index.docs_count}</TableCell>
                          <TableCell>{index.store_size}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="Reindex">
                                <IconButton
                                  size="small"
                                  onClick={() => reindexIndex(index.index)}
                                  disabled={loading}
                                >
                                  <RefreshIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => deleteIndex(index.index)}
                                  disabled={loading}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {selectedTab === 'search' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Search Documents
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Available indices: {indices.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Selected index: {selectedIndex || 'none'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Box sx={{ minWidth: 200 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Index
                  </Typography>
                  <select
                    value={selectedIndex}
                    onChange={(e) => setSelectedIndex(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="">Select an index</option>
                    {indices.map((index) => (
                      <option key={index.index} value={index.index}>
                        {index.index} ({index.docs_count} docs)
                      </option>
                    ))}
                  </select>
                </Box>
                
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Search Query
                  </Typography>
                  <TextField
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter search query (leave empty for all documents)..."
                    onKeyPress={(e) => e.key === 'Enter' && searchDocuments()}
                    size="small"
                    fullWidth
                  />
                </Box>
                
                <Button
                  variant="contained"
                  onClick={searchDocuments}
                  disabled={loading || !selectedIndex}
                  startIcon={<SearchIcon />}
                  sx={{ alignSelf: 'flex-end' }}
                >
                  Search
                </Button>
              </Box>

              {searchResults && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Results ({searchResults.hits.total.value} documents)
                  </Typography>
                  
                  <Box sx={{ spaceY: 2 }}>
                    {searchResults.hits.hits.map((doc) => (
                      <Paper key={doc._id} sx={{ p: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            ID: {doc._id}
                          </Typography>
                          <Chip label={doc._index} variant="outlined" size="small" />
                        </Box>
                                                 <Box
                           component="pre"
                           sx={{
                             fontSize: '0.875rem',
                             bgcolor: '#1e1e1e',
                             color: '#ffffff',
                             p: 2,
                             borderRadius: 1,
                             overflow: 'auto',
                             maxHeight: 200,
                             border: '1px solid #555'
                           }}
                         >
                          {JSON.stringify(doc._source, null, 2)}
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ElasticsearchUI;
