import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  Tooltip,
  Badge,
  Tabs,
  Tab,
} from '@mui/material';
import {
  DataGrid,
  GridToolbar,
} from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import {
  Eye,
  Edit,
  Delete,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  Download,
  Heart,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { Listing } from 'benalsam-shared-types';
import { ListingStatus } from 'benalsam-shared-types';
import { useNavigate } from 'react-router-dom';

console.log('📄 ListingsPage.tsx loaded');
console.log('📄 ListingStatus:', ListingStatus);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`listings-tabpanel-${index}`}
      aria-labelledby={`listings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const statusColors = {
  [ListingStatus.ACTIVE]: 'success',
  [ListingStatus.INACTIVE]: 'default',
  [ListingStatus.PENDING_APPROVAL]: 'warning',
  [ListingStatus.REJECTED]: 'error',
} as const;

const statusLabels = {
  [ListingStatus.ACTIVE]: 'Aktif',
  [ListingStatus.INACTIVE]: 'Pasif',
  [ListingStatus.PENDING_APPROVAL]: 'Onay Bekliyor',
  [ListingStatus.REJECTED]: 'Reddedildi',
} as const;

export const ListingsPage: React.FC = () => {
  console.log('🚀 ListingsPage component rendered');
  
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(ListingStatus.PENDING_APPROVAL); // İlk tab için PENDING_APPROVAL
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [moderationDialog, setModerationDialog] = useState(false);
  const [moderationAction, setModerationAction] = useState<'approve' | 'reject' | 're-evaluate'>('approve');
  const [moderationReason, setModerationReason] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  console.log('🔧 Initial state:', {
    tabValue,
    searchTerm,
    statusFilter,
    ListingStatus: ListingStatus,
    statusLabels,
    statusColors
  });

  // Fetch listings
  const { data: listingsResponse, isLoading } = useQuery({
    queryKey: ['listings', { search: searchTerm, status: statusFilter }],
    queryFn: () => {
      console.log('📡 API call params:', {
        page: 1,
        limit: 100,
        search: searchTerm,
        filters: statusFilter && statusFilter !== 'ALL' ? { status: statusFilter } : undefined,
        statusFilter: statusFilter, // Debug için
      });
      return apiService.getListings({
        page: 1,
        limit: 100,
        search: searchTerm,
        filters: statusFilter && statusFilter !== 'ALL' ? { status: statusFilter } : undefined,
      });
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  console.log('📊 API Response:', {
    listingsResponse,
    isLoading,
    dataLength: listingsResponse?.data?.length || 0
  });

  // Moderation mutation
  const moderationMutation = useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: 'approve' | 'reject' | 're-evaluate'; reason?: string }) => {
      if (action === 're-evaluate') {
        return apiService.reEvaluateListing(id, reason);
      }
      return apiService.moderateListing(id, action as 'approve' | 'reject', reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      setModerationDialog(false);
      setSelectedListing(null);
      setModerationReason('');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });

  const listings = listingsResponse?.data || [];
  
  console.log('🔍 Raw listings:', {
    totalListings: listings.length,
    allStatuses: listings.map(l => l.status),
    uniqueStatuses: [...new Set(listings.map(l => l.status))]
  });
  
  const pendingListings = listings.filter(l => l.status === ListingStatus.PENDING_APPROVAL);
  const activeListings = listings.filter(l => l.status === ListingStatus.ACTIVE);
  const rejectedListings = listings.filter(l => l.status === ListingStatus.REJECTED);
  
  console.log('📋 Filtered listings:', {
    pendingCount: pendingListings.length,
    activeCount: activeListings.length,
    rejectedCount: rejectedListings.length,
    pendingListings: pendingListings.map(l => ({ id: l.id, title: l.title, status: l.status })),
    activeListings: activeListings.map(l => ({ id: l.id, title: l.title, status: l.status })),
    rejectedListings: rejectedListings.map(l => ({ id: l.id, title: l.title, status: l.status }))
  });

  const handleModeration = () => {
    if (selectedListing) {
      moderationMutation.mutate({
        id: selectedListing.id,
        action: moderationAction,
        reason: moderationReason || undefined,
      });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bu ilanı silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
    },
    {
      field: 'title',
      headerName: 'Başlık',
      width: 250,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.category}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'price',
      headerName: 'Fiyat',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold" color="primary">
          ₺{params.value.toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Durum',
      width: 150,
      renderCell: (params) => {
        console.log('🔍 Status chip render:', {
          value: params.value,
          statusLabels: statusLabels,
          statusColors: statusColors,
          label: statusLabels[params.value as keyof typeof statusLabels],
          color: statusColors[params.value as keyof typeof statusColors]
        });
        return (
          <Chip
            label={statusLabels[params.value as keyof typeof statusLabels]}
            color={statusColors[params.value as keyof typeof statusColors]}
            size="small"
          />
        );
      },
    },
    {
      field: 'views',
      headerName: 'Görüntülenme',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Eye size={16} />
          {params.value}
        </Box>
      ),
    },
    {
      field: 'favorites',
      headerName: 'Favori',
      width: 100,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Heart size={16} />
          {params.value}
        </Box>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Oluşturulma',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2">
          {new Date(params.value).toLocaleDateString('tr-TR')}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Görüntüle">
            <IconButton size="small" color="primary" onClick={() => navigate(`/listings/${params.row.id}`)}>
              <Eye size={16} />
            </IconButton>
          </Tooltip>
          
          {params.row.status === ListingStatus.PENDING_APPROVAL && (
            <>
              <Tooltip title="Onayla">
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => {
                    setSelectedListing(params.row);
                    setModerationAction('approve');
                    setModerationDialog(true);
                  }}
                >
                  <CheckCircle size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reddet">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => {
                    setSelectedListing(params.row);
                    setModerationAction('reject');
                    setModerationDialog(true);
                  }}
                >
                  <XCircle size={16} />
                </IconButton>
              </Tooltip>
            </>
          )}
          
          {(params.row.status === ListingStatus.ACTIVE || params.row.status === ListingStatus.INACTIVE) && (
            <Tooltip title="Tekrar Değerlendir">
              <IconButton
                size="small"
                color="warning"
                onClick={() => navigate(`/listings/${params.row.id}`)}
              >
                <AlertTriangle size={16} />
              </IconButton>
            </Tooltip>
          )}
          
          {params.row.status === ListingStatus.REJECTED && (
            <Tooltip title="Yeniden İncele">
              <IconButton
                size="small"
                color="info"
                onClick={() => navigate(`/listings/${params.row.id}`)}
              >
                <RefreshCw size={16} />
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title="Düzenle">
            <IconButton size="small" color="info">
              <Edit size={16} />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Sil">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDelete(params.row.id)}
            >
              <Delete size={16} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          İlan Yönetimi
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => alert('Export özelliği eklenecek')}
          >
            Dışa Aktar
          </Button>
          <Button
            variant="contained"
            startIcon={<RefreshCw />}
            onClick={() => queryClient.invalidateQueries({ queryKey: ['listings'] })}
          >
            Yenile
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Toplam İlan
              </Typography>
              <Typography variant="h4" component="div">
                {listings.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Onay Bekleyen
              </Typography>
              <Typography variant="h4" component="div" color="warning.main">
                <Badge badgeContent={pendingListings.length} color="warning">
                  <AlertTriangle size={24} />
                </Badge>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Aktif İlanlar
              </Typography>
              <Typography variant="h4" component="div" color="success.main">
                {activeListings.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Reddedilen
              </Typography>
              <Typography variant="h4" component="div" color="error.main">
                {rejectedListings.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="İlan Ara"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search size={20} style={{ marginRight: 8 }} />,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Durum Filtresi</InputLabel>
                <Select
                  value={statusFilter}
                  label="Durum Filtresi"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="ALL">Tümü</MenuItem>
                  <MenuItem value="ACTIVE">Aktif</MenuItem>
                  <MenuItem value="PENDING_APPROVAL">Onay Bekleyen</MenuItem>
                  <MenuItem value="INACTIVE">Pasif</MenuItem>
                  <MenuItem value="REJECTED">Reddedilen</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={`Toplam: ${listings.length}`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={`Onay Bekleyen: ${pendingListings.length}`}
                  color="warning"
                  variant="outlined"
                />
                <Chip
                  label={`Aktif: ${activeListings.length}`}
                  color="success"
                  variant="outlined"
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            aria-label="İlan durumları"
          >
            <Tab
              label={
                <Badge badgeContent={pendingListings.length} color="warning">
                  Onay Bekleyen
                </Badge>
              }
            />
            <Tab
              label={
                <Badge badgeContent={activeListings.length} color="success">
                  Aktif İlanlar
                </Badge>
              }
            />
            <Tab
              label={
                <Badge badgeContent={rejectedListings.length} color="error">
                  Reddedilen
                </Badge>
              }
            />
            <Tab label="Tüm İlanlar" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <DataGrid
            rows={pendingListings}
            columns={columns}
            loading={isLoading}
            autoHeight
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <DataGrid
            rows={activeListings}
            columns={columns}
            loading={isLoading}
            autoHeight
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <DataGrid
            rows={rejectedListings}
            columns={columns}
            loading={isLoading}
            autoHeight
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <DataGrid
            rows={listings}
            columns={columns}
            loading={isLoading}
            autoHeight
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
          />
        </TabPanel>
      </Card>

      {/* Moderation Dialog */}
      <Dialog open={moderationDialog} onClose={() => setModerationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          İlan {moderationAction === 'approve' ? 'Onaylama' : moderationAction === 'reject' ? 'Reddetme' : 'Tekrar Değerlendirme'}
        </DialogTitle>
        <DialogContent>
          {selectedListing && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedListing.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Fiyat: ₺{selectedListing.price.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Kategori: {selectedListing.category}
              </Typography>
            </Box>
          )}
          
          {(moderationAction === 'reject' || moderationAction === 're-evaluate') && (
            <TextField
              fullWidth
              label={moderationAction === 'reject' ? 'Red Nedeni' : 'Tekrar Değerlendirme Nedeni'}
              multiline
              rows={3}
              value={moderationReason}
              onChange={(e) => setModerationReason(e.target.value)}
              placeholder={moderationAction === 'reject' ? 'İlanı neden reddettiğinizi belirtin...' : 'İlanı neden tekrar değerlendirmeye aldığınızı belirtin...'}
            />
          )}
          
          {moderationMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              İşlem sırasında bir hata oluştu.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModerationDialog(false)}>
            İptal
          </Button>
          <Button
            onClick={handleModeration}
            variant="contained"
            color={moderationAction === 'approve' ? 'success' : moderationAction === 'reject' ? 'error' : 'warning'}
            disabled={moderationMutation.isPending}
          >
            {moderationMutation.isPending ? 'İşleniyor...' : 
             moderationAction === 'approve' ? 'Onayla' : 
             moderationAction === 'reject' ? 'Reddet' : 'Tekrar Değerlendir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 