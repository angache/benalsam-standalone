import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
  Alert,
  Pagination,
  Stack,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { usePermissions, PERMISSIONS } from '../hooks/usePermissions';
import { apiService } from '../services/api';
import type { User, AdminUser, Role, Permission } from '../services/api';

const AdminManagementPage: React.FC = () => {
  const { hasPermission, getRoleDisplayName, canManageUser } = usePermissions();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'users' | 'roles' | 'permissions'>('users');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadData();
  }, [currentPage, searchTerm, roleFilter, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load admin users
      if (hasPermission(PERMISSIONS.ADMINS_VIEW)) {
        const adminsResponse = await apiService.getAdminUsers({
          page: currentPage,
          limit: 10,
          search: searchTerm,
          filters: {
            role: roleFilter,
            status: statusFilter,
          },
        });
        setAdmins(adminsResponse.data);
        setTotalPages(adminsResponse.pagination?.totalPages || 1);
        setTotalItems(adminsResponse.pagination?.total || 0);
      }

      // Load roles
      console.log('🔍 Roller yükleniyor...');
      const rolesResponse = await apiService.getRoles();
      console.log('✅ Roller yüklendi:', rolesResponse);
      setRoles(rolesResponse.data);

      // Load permissions
      const permissionsResponse = await apiService.getPermissions();
      setPermissions(permissionsResponse.data);
    } catch (err) {
      setError('Veri yüklenirken hata oluştu');
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (adminData: any) => {
    try {
      await apiService.createAdminUser(adminData);
      setShowCreateModal(false);
      loadData();
    } catch (err) {
      console.error('Error creating admin:', err);
    }
  };

  const handleUpdateAdmin = async (id: string, adminData: any) => {
    try {
      await apiService.updateAdminUser(id, adminData);
      setShowEditModal(false);
      setSelectedAdmin(null);
      loadData();
    } catch (err) {
      console.error('Error updating admin:', err);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm('Bu admin kullanıcısını silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await apiService.deleteAdminUser(id);
      loadData();
    } catch (err) {
      console.error('Error deleting admin:', err);
    }
  };

  const handleEditAdmin = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setShowEditModal(true);
  };

  if (!hasPermission(PERMISSIONS.ADMINS_VIEW)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Erişim Reddedildi
          </h2>
          <p className="text-gray-500">
            Admin yönetimi sayfasına erişim yetkiniz bulunmamaktadır.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Yönetimi
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Admin kullanıcıları, rolleri ve yetkileri yönetin
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={(_, newValue) => setSelectedTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Admin Kullanıcıları" value="users" />
          <Tab label="Roller" value="roles" />
          <Tab label="Yetkiler" value="permissions" />
        </Tabs>
      </Box>

      {/* Content */}
      {selectedTab === 'users' && (
        <Box>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                placeholder="Admin ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{ minWidth: 200 }}
              />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  label="Rol"
                >
                  <MenuItem value="">Tüm Roller</MenuItem>
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.name}>
                      {role.display_name || role.displayName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Durum</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Durum"
                >
                  <MenuItem value="">Tüm Durumlar</MenuItem>
                  <MenuItem value="true">Aktif</MenuItem>
                  <MenuItem value="false">Pasif</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            {hasPermission(PERMISSIONS.ADMINS_CREATE) && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowCreateModal(true)}
              >
                Yeni Admin Ekle
              </Button>
            )}
          </Box>

          {/* Admin Users Table */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Alert severity="error">{error}</Alert>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Admin</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Rol</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Durum</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Son Giriş</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            {(admin.first_name || admin.name) ? (admin.first_name || admin.name)?.charAt(0).toUpperCase() : 'A'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {admin.first_name && admin.last_name 
                                ? `${admin.first_name} ${admin.last_name}` 
                                : admin.name || 'İsimsiz Admin'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {admin.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getRoleDisplayName(admin.role)}
                          color="primary"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={admin.is_active ? 'Aktif' : 'Pasif'}
                          color={admin.is_active ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {(admin.last_login || admin.lastLoginAt)
                            ? new Date(admin.last_login || admin.lastLoginAt || '').toLocaleDateString('tr-TR')
                            : 'Hiç giriş yapmamış'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          {hasPermission(PERMISSIONS.ADMINS_EDIT) && canManageUser(admin.role) && (
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEditAdmin(admin)}
                            >
                              <EditIcon />
                            </IconButton>
                          )}
                          {hasPermission(PERMISSIONS.ADMINS_DELETE) && canManageUser(admin.role) && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteAdmin(admin.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Toplam {totalItems} admin kullanıcısı
              </Typography>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </Box>
      )}

      {selectedTab === 'roles' && (
        <div>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Açıklama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seviye
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {roles.map((role) => (
                  <tr key={role.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {role.displayName}
                      </div>
                      <div className="text-sm text-gray-500">{role.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {role.description || 'Açıklama yok'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {role.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          role.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {role.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {hasPermission(PERMISSIONS.ADMINS_ROLES) && (
                        <button className="text-blue-600 hover:text-blue-900">
                          Yetkileri Düzenle
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTab === 'permissions' && (
        <div>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Yetki
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kaynak
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Açıklama
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {permissions.map((permission) => (
                  <tr key={permission.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {permission.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {permission.resource}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {permission.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {permission.description || 'Açıklama yok'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      {showCreateModal && (
        <CreateAdminModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateAdmin}
          roles={roles}
          permissions={permissions}
        />
      )}

      {/* Edit Admin Modal */}
      {showEditModal && selectedAdmin && (
        <EditAdminModal
          admin={selectedAdmin}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAdmin(null);
          }}
          onSubmit={handleUpdateAdmin}
          roles={roles}
          permissions={permissions}
        />
      )}
    </Box>
  );
};

// Create Admin Modal Component
interface CreateAdminModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  roles: Role[];
  permissions: Permission[];
}

const CreateAdminModal: React.FC<CreateAdminModalProps> = ({
  onClose,
  onSubmit,
  roles,
  permissions,
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: '',
    permissions: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'E-posta adresi gereklidir';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz';
    }

    if (!formData.password) {
      newErrors.password = 'Şifre gereklidir';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Şifre en az 8 karakter olmalıdır';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifre tekrarı gereklidir';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }

    if (!formData.firstName) {
      newErrors.firstName = 'Ad gereklidir';
    }

    if (!formData.lastName) {
      newErrors.lastName = 'Soyad gereklidir';
    }

    if (!formData.role) {
      newErrors.role = 'Rol seçimi gereklidir';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        permissions: formData.permissions,
      });
    } catch (error) {
      console.error('Admin oluşturma hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div">
            Yeni Admin Ekle
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Kişisel Bilgiler */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                Kişisel Bilgiler
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ad"
                required
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                error={!!errors.firstName}
                helperText={errors.firstName}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Soyad"
                required
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                error={!!errors.lastName}
                helperText={errors.lastName}
                disabled={loading}
              />
            </Grid>

            {/* Hesap Bilgileri */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', mt: 2 }}>
                Hesap Bilgileri
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="E-posta Adresi"
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                disabled={loading}
                placeholder="admin@benalsam.com"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Şifre"
                type="password"
                required
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                error={!!errors.password}
                helperText={errors.password || 'En az 8 karakter'}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Şifre Tekrarı"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                disabled={loading}
              />
            </Grid>

            {/* Rol ve Yetkiler */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', mt: 2 }}>
                Rol ve Yetkiler
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth required error={!!errors.role}>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  label="Rol"
                  disabled={loading}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.name}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <Typography>{role.display_name || role.displayName}</Typography>
                        <Chip 
                          label={`Seviye ${role.level}`} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.role && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.role}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Seçilen Rol Bilgisi */}
            {formData.role && (
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Seçilen Rol:</strong> {roles.find(r => r.name === formData.role)?.displayName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Açıklama:</strong> {roles.find(r => r.name === formData.role)?.description || 'Açıklama yok'}
                  </Typography>
                </Card>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={onClose} 
            color="inherit"
            disabled={loading}
            sx={{ minWidth: 100 }}
          >
            İptal
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            startIcon={loading ? <CircularProgress size={16} /> : <AddIcon />}
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            {loading ? 'Oluşturuluyor...' : 'Admin Oluştur'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Edit Admin Modal Component
interface EditAdminModalProps {
  admin: AdminUser;
  onClose: () => void;
  onSubmit: (id: string, data: any) => void;
  roles: Role[];
  permissions: Permission[];
}

const EditAdminModal: React.FC<EditAdminModalProps> = ({
  admin,
  onClose,
  onSubmit,
  roles,
  permissions,
}) => {
  const [formData, setFormData] = useState({
    firstName: admin.first_name || admin.name?.split(' ')[0] || '',
    lastName: admin.last_name || admin.name?.split(' ').slice(1).join(' ') || '',
    role: admin.role,
    isActive: admin.is_active !== undefined ? admin.is_active : (admin.status === 'ACTIVE'),
    permissions: admin.permissions?.map((p: any) => p.id) || [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName) {
      newErrors.firstName = 'Ad gereklidir';
    }

    if (!formData.lastName) {
      newErrors.lastName = 'Soyad gereklidir';
    }

    if (!formData.role) {
      newErrors.role = 'Rol seçimi gereklidir';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(admin.id, formData);
    } catch (error) {
      console.error('Admin güncelleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div">
            Admin Düzenle
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Admin Bilgileri */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'info.50' }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Mevcut Admin:</strong> {admin.email}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Son Giriş:</strong> {(admin.last_login || admin.lastLoginAt)
                    ? new Date(admin.last_login || admin.lastLoginAt || '').toLocaleDateString('tr-TR') 
                    : 'Hiç giriş yapmamış'}
                </Typography>
              </Card>
            </Grid>

            {/* Kişisel Bilgiler */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                Kişisel Bilgiler
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ad"
                required
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                error={!!errors.firstName}
                helperText={errors.firstName}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Soyad"
                required
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                error={!!errors.lastName}
                helperText={errors.lastName}
                disabled={loading}
              />
            </Grid>

            {/* Rol ve Durum */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', mt: 2 }}>
                Rol ve Durum
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={8}>
              <FormControl fullWidth required error={!!errors.role}>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  label="Rol"
                  disabled={loading}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.name}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <Typography>{role.displayName}</Typography>
                        <Chip 
                          label={`Seviye ${role.level}`} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.role && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.role}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1, width: '100%' }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    disabled={loading}
                    style={{ marginRight: '8px' }}
                  />
                  <Typography variant="body2">Aktif</Typography>
                </Box>
              </Box>
            </Grid>

            {/* Seçilen Rol Bilgisi */}
            {formData.role && (
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Seçilen Rol:</strong> {roles.find(r => r.name === formData.role)?.displayName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Açıklama:</strong> {roles.find(r => r.name === formData.role)?.description || 'Açıklama yok'}
                  </Typography>
                </Card>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={onClose} 
            color="inherit"
            disabled={loading}
            sx={{ minWidth: 100 }}
          >
            İptal
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            startIcon={loading ? <CircularProgress size={16} /> : <EditIcon />}
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            {loading ? 'Güncelleniyor...' : 'Güncelle'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AdminManagementPage; 