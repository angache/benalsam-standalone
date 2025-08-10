/**
 * User Management Component
 * Admin panel for user management
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Users, 
  Search, 
  Filter,
  RefreshCw,
  AlertTriangle,
  User,
  Mail,
  Calendar,
  Shield,
  Activity,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { AdminManagementService } from '@/services/adminManagementService';
import { errorHandler } from '@/lib/errorHandler';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  avatar_url?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  department?: string;
  phone?: string;
  notes?: string;
}

interface AdminRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

interface UserFilters {
  search?: string;
  role?: string;
  department?: string;
  is_active?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filters, setFilters] = useState<UserFilters>({});
  const [stats, setStats] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: '',
    password: '',
    department: '',
    phone: '',
    notes: '',
    is_active: true
  });

  useEffect(() => {
    loadUsers();
    loadRoles();
    loadStats();
  }, [filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await AdminManagementService.getAdminUsers(filters);
      
      if (response.success && response.data) {
        setUsers(response.data.users || []);
      } else {
        errorHandler.handleApiError(response.error, 'loadUsers');
      }
    } catch (error) {
      errorHandler.handleApiError(error, 'loadUsers');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await AdminManagementService.getAdminRoles();
      if (response.success && response.data) {
        setRoles(response.data);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await AdminManagementService.getAdminUserStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreateUser = async () => {
    try {
      const response = await AdminManagementService.createAdminUser(formData);
      
      if (response.success) {
        loadUsers();
        loadStats();
        setShowCreateModal(false);
        setFormData({
          email: '',
          name: '',
          role: '',
          password: '',
          department: '',
          phone: '',
          notes: '',
          is_active: true
        });
      }
    } catch (error) {
      errorHandler.handleApiError(error, 'createUser');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const updateData = {
        name: formData.name,
        role: formData.role,
        department: formData.department,
        phone: formData.phone,
        notes: formData.notes,
        is_active: formData.is_active
      };

      const response = await AdminManagementService.updateAdminUser(selectedUser.id, updateData);
      
      if (response.success) {
        loadUsers();
        setShowEditModal(false);
        setSelectedUser(null);
        setFormData({
          email: '',
          name: '',
          role: '',
          password: '',
          department: '',
          phone: '',
          notes: '',
          is_active: true
        });
      }
    } catch (error) {
      errorHandler.handleApiError(error, 'updateUser');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await AdminManagementService.deleteAdminUser(userId);
      
      if (response.success) {
        loadUsers();
        loadStats();
      }
    } catch (error) {
      errorHandler.handleApiError(error, 'deleteUser');
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      password: '',
      department: user.department || '',
      phone: user.phone || '',
      notes: user.notes || '',
      is_active: user.is_active
    });
    setShowEditModal(true);
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      super_admin: { color: 'bg-red-100 text-red-800', text: 'Süper Admin' },
      admin: { color: 'bg-blue-100 text-blue-800', text: 'Admin' },
      moderator: { color: 'bg-green-100 text-green-800', text: 'Moderatör' },
      support: { color: 'bg-purple-100 text-purple-800', text: 'Destek' },
    };

    const config = roleConfig[role as keyof typeof roleConfig] || { color: 'bg-gray-100 text-gray-800', text: role };
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kullanıcı Yönetimi</h1>
          <p className="text-gray-600">Admin kullanıcılarını yönet ve rolleri düzenle</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Kullanıcı
          </Button>
          <Button variant="outline" onClick={loadUsers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Toplam Kullanıcı</p>
                  <p className="text-2xl font-bold">{stats.totalUsers || users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Aktif Kullanıcı</p>
                  <p className="text-2xl font-bold">{users.filter(u => u.is_active).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Son Aktif</p>
                  <p className="text-2xl font-bold">{users.filter(u => u.last_login).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Pasif Kullanıcı</p>
                  <p className="text-2xl font-bold">{users.filter(u => !u.is_active).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtreler</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Arama</label>
              <Input 
                placeholder="İsim veya email ara..."
                value={filters.search || ''}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Rol</label>
              <Select 
                value={filters.role} 
                onValueChange={(value) => setFilters({...filters, role: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Rol seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tümü</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Departman</label>
              <Input 
                placeholder="Departman ara..."
                value={filters.department || ''}
                onChange={(e) => setFilters({...filters, department: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Durum</label>
              <Select 
                value={filters.is_active?.toString()} 
                onValueChange={(value) => setFilters({...filters, is_active: value === 'true'})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tümü</SelectItem>
                  <SelectItem value="true">Aktif</SelectItem>
                  <SelectItem value="false">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users */}
      <Card>
        <CardHeader>
          <CardTitle>Kullanıcılar ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="border rounded-lg p-4">
                <div className="flex items-start space-x-4">
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={(checked) => 
                      handleSelectUser(user.id, checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{user.name}</h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getRoleBadge(user.role)}
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? 'Aktif' : 'Pasif'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Shield className="h-4 w-4" />
                        <span>Rol: {user.role}</span>
                      </div>
                      {user.department && (
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>Departman: {user.department}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Kayıt: {formatDate(user.created_at)}</span>
                      </div>
                    </div>
                    
                    {user.last_login && (
                      <div className="flex items-center space-x-1 text-xs text-gray-500 mt-2">
                        <Activity className="h-3 w-3" />
                        <span>Son giriş: {formatDate(user.last_login)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {users.length === 0 && (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Bu kriterlere uygun kullanıcı bulunamadı</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Yeni Kullanıcı Oluştur</h2>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Kapat
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="kullanici@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">İsim</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Kullanıcı adı"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Rol</label>
                <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Rol seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Şifre</label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Şifre"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Departman</label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  placeholder="Departman"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Telefon</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="Telefon"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notlar</label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Notlar"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked as boolean})}
                />
                <label className="text-sm">Aktif kullanıcı</label>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={handleCreateUser} className="flex-1">
                  Oluştur
                </Button>
                <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                  İptal
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Kullanıcı Düzenle</h2>
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Kapat
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium">İsim</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Rol</label>
                <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Rol seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Departman</label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Telefon</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notlar</label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked as boolean})}
                />
                <label className="text-sm">Aktif kullanıcı</label>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={handleUpdateUser} className="flex-1">
                  Güncelle
                </Button>
                <Button variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">
                  İptal
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 