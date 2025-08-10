/**
 * Moderation Panel Component
 * Admin panel for listing moderation
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
  CheckCircle, 
  XCircle, 
  Eye, 
  Search, 
  Filter,
  RefreshCw,
  AlertTriangle,
  Clock,
  User,
  MapPin,
  DollarSign
} from 'lucide-react';
import { AdminListingFetchers } from '@/services/listingService/adminFetchers';
import { errorHandler } from '@/lib/errorHandler';

interface AdminListing {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  location: string;
  status: 'pending' | 'active' | 'rejected' | 'expired' | 'completed';
  user_id: string;
  user_email: string;
  user_name: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  popularity_score: number;
  view_count: number;
  offer_count: number;
  is_featured: boolean;
  is_urgent_premium: boolean;
  is_showcase: boolean;
  main_image_url?: string;
  additional_image_urls?: string[];
  geolocation?: string;
  contact_preference: string;
  auto_republish: boolean;
  urgency: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
}

interface ModerationFilters {
  status?: string;
  category?: string;
  search?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const ModerationPanel: React.FC = () => {
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListings, setSelectedListings] = useState<string[]>([]);
  const [filters, setFilters] = useState<ModerationFilters>({
    status: 'pending'
  });
  const [stats, setStats] = useState<any>(null);
  const [selectedListing, setSelectedListing] = useState<AdminListing | null>(null);
  const [moderationReason, setModerationReason] = useState('');

  useEffect(() => {
    loadListings();
    loadStats();
  }, [filters]);

  const loadListings = async () => {
    try {
      setLoading(true);
      const response = await AdminListingFetchers.fetchAdminListings(filters);
      
      if (response.success && response.data) {
        setListings(response.data.listings || []);
      } else {
        errorHandler.handleApiError(response.error, 'loadListings');
      }
    } catch (error) {
      errorHandler.handleApiError(error, 'loadListings');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await AdminListingFetchers.getListingStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleModerateListing = async (listingId: string, action: 'approve' | 'reject') => {
    try {
      const response = await AdminListingFetchers.moderateListing(
        listingId, 
        action, 
        moderationReason || undefined
      );
      
      if (response.success) {
        // Refresh listings
        loadListings();
        loadStats();
        setSelectedListing(null);
        setModerationReason('');
        setSelectedListings(selectedListings.filter(id => id !== listingId));
      }
    } catch (error) {
      errorHandler.handleApiError(error, 'moderateListing');
    }
  };

  const handleBulkModerate = async (action: 'approve' | 'reject') => {
    if (selectedListings.length === 0) {
      errorHandler.showWarning('Lütfen en az bir ilan seçin');
      return;
    }

    try {
      const response = await AdminListingFetchers.bulkModerateListings(
        selectedListings,
        action,
        moderationReason || undefined
      );
      
      if (response.success) {
        loadListings();
        loadStats();
        setSelectedListings([]);
        setModerationReason('');
      }
    } catch (error) {
      errorHandler.handleApiError(error, 'bulkModerate');
    }
  };

  const handleSelectListing = (listingId: string, checked: boolean) => {
    if (checked) {
      setSelectedListings([...selectedListings, listingId]);
    } else {
      setSelectedListings(selectedListings.filter(id => id !== listingId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedListings(listings.map(listing => listing.id));
    } else {
      setSelectedListings([]);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Bekliyor' },
      active: { color: 'bg-green-100 text-green-800', text: 'Aktif' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Reddedildi' },
      expired: { color: 'bg-gray-100 text-gray-800', text: 'Süresi Doldu' },
      completed: { color: 'bg-blue-100 text-blue-800', text: 'Tamamlandı' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
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
          <h1 className="text-3xl font-bold">İlan Moderasyonu</h1>
          <p className="text-gray-600">Bekleyen ilanları incele ve onayla</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadListings}>
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
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Bekleyen</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Aktif</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Reddedilen</p>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Toplam</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
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
              <label className="text-sm font-medium">Durum</label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters({...filters, status: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Bekleyen</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="rejected">Reddedilen</SelectItem>
                  <SelectItem value="expired">Süresi Dolan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Kategori</label>
              <Input 
                placeholder="Kategori ara..."
                value={filters.category || ''}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Arama</label>
              <Input 
                placeholder="İlan başlığı ara..."
                value={filters.search || ''}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Kullanıcı</label>
              <Input 
                placeholder="Kullanıcı ID veya email"
                value={filters.userId || ''}
                onChange={(e) => setFilters({...filters, userId: e.target.value})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedListings.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">
                  {selectedListings.length} ilan seçildi
                </span>
                <Textarea
                  placeholder="Moderasyon nedeni (opsiyonel)"
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  className="w-64"
                />
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => handleBulkModerate('approve')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Toplu Onayla
                </Button>
                <Button 
                  onClick={() => handleBulkModerate('reject')}
                  variant="destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Toplu Reddet
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Listings */}
      <Card>
        <CardHeader>
          <CardTitle>İlanlar ({listings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {listings.map((listing) => (
              <div key={listing.id} className="border rounded-lg p-4">
                <div className="flex items-start space-x-4">
                  <Checkbox
                    checked={selectedListings.includes(listing.id)}
                    onCheckedChange={(checked) => 
                      handleSelectListing(listing.id, checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{listing.title}</h3>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(listing.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedListing(listing)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{listing.user_name} ({listing.user_email})</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{listing.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4" />
                        <span>₺{listing.budget.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {listing.description}
                    </p>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Oluşturulma: {formatDate(listing.created_at)}</span>
                        <span>Görüntülenme: {listing.view_count}</span>
                        <span>Teklif: {listing.offer_count}</span>
                      </div>
                      
                      {listing.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleModerateListing(listing.id, 'approve')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Onayla
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleModerateListing(listing.id, 'reject')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reddet
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {listings.length === 0 && (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Bu kriterlere uygun ilan bulunamadı</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Listing Detail Modal */}
      {selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">İlan Detayları</h2>
              <Button variant="outline" onClick={() => setSelectedListing(null)}>
                Kapat
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{selectedListing.title}</h3>
                <p className="text-gray-600">{selectedListing.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Kategori:</span> {selectedListing.category}
                </div>
                <div>
                  <span className="font-medium">Bütçe:</span> ₺{selectedListing.budget.toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Konum:</span> {selectedListing.location}
                </div>
                <div>
                  <span className="font-medium">Kullanıcı:</span> {selectedListing.user_name}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {selectedListing.user_email}
                </div>
                <div>
                  <span className="font-medium">Oluşturulma:</span> {formatDate(selectedListing.created_at)}
                </div>
              </div>
              
              {selectedListing.status === 'pending' && (
                <div className="border-t pt-4">
                  <Textarea
                    placeholder="Moderasyon nedeni (opsiyonel)"
                    value={moderationReason}
                    onChange={(e) => setModerationReason(e.target.value)}
                    className="mb-4"
                  />
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleModerateListing(selectedListing.id, 'approve')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Onayla
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleModerateListing(selectedListing.id, 'reject')}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reddet
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModerationPanel; 