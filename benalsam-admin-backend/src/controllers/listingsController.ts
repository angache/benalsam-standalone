import { Response } from 'express';
import { supabase } from '../config/database';
import type { AuthenticatedRequest } from '../types';
import logger from '../config/logger';
import { User } from '@supabase/supabase-js';

export const listingsController = {
  // Get all listings with filters
  async getListings(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        category,
        userId,
        sortBy = 'created_at',
        sortOrder = 'desc',
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      logger.info(`Fetching listings with filters:`, { page: pageNum, limit: limitNum, search, status, category });
      console.log('🔍 Fetching listings from Supabase...');

      // Build Supabase query
      let query = supabase
        .from('listings')
        .select(`*`);

      // Apply filters
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }
      
              if (status && typeof status === 'string') {
          query = query.eq('status', status.toLowerCase());
        }
      
      if (category) {
        query = query.eq('category', category);
      }
      
      if (userId) {
        query = query.eq('user_id', userId);
      }

      // Apply sorting
      query = query.order(sortBy as string, { ascending: sortOrder === 'asc' });

      // Get total count for pagination
      const { count } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true });

      // Apply pagination
      query = query.range(offset, offset + limitNum - 1);

      const { data: listings, error } = await query;

      if (error) {
        logger.error('Error fetching listings:', error);
        console.error('❌ Supabase error:', error);
        res.status(500).json({
          success: false,
          message: 'İlanlar getirilirken bir hata oluştu',
        });
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(listings?.map(l => l.user_id).filter(Boolean) || [])];

      // ✅ OPTIMIZED: Batch user fetching instead of N+1 queries
      const userEmails = new Map();
      const profilesMap = new Map();
      
      if (userIds.length > 0) {
        try {
          // Batch fetch all users from auth.users
          const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
          
          if (!authError && authUsers?.users) {
            // Create email map
            authUsers.users.forEach((user: User) => {
              if (userIds.includes(user.id)) {
                userEmails.set(user.id, user.email || 'Bilinmiyor');
              }
            });
          }
          
          // Batch fetch all profiles
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, avatar_url')
            .in('id', userIds);
          
          if (profiles) {
            profiles.forEach(profile => {
              profilesMap.set(profile.id, profile);
            });
          }
          
        } catch (error) {
          logger.error('Error in batch user fetching:', error);
          // Fallback: set default values
          userIds.forEach(userId => {
            userEmails.set(userId, 'Bilinmiyor');
          });
        }
      }

      // Transform data for frontend
      const transformedListings = (listings || []).map(listing => ({
        id: listing.id,
        title: listing.title,
        description: listing.description,
        price: listing.budget || 0,
        category: listing.category,
        status: listing.status || 'pending_approval',
        views: listing.views_count || 0,
        favorites: listing.favorites_count || 0,
        createdAt: listing.created_at,
        updatedAt: listing.updated_at,
        userId: listing.user_id,
        images: listing.main_image_url ? [listing.main_image_url, ...(listing.additional_image_urls || [])] : [],
        user: {
          id: listing.user_id,
          email: userEmails.get(listing.user_id) || 'Bilinmiyor',
          name: profilesMap.get(listing.user_id)?.name || 'Bilinmiyor'
        },
      }));



      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / limitNum);

      logger.info(`Fetched ${transformedListings.length} listings out of ${totalCount} total`);
      console.log(`✅ Fetched ${transformedListings.length} listings out of ${totalCount} total`);

      res.json({
        success: true,
        data: transformedListings,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages,
        },
      });
    } catch (error) {
      logger.error('Error fetching listings:', error);
      res.status(500).json({
        success: false,
        message: 'İlanlar getirilirken bir hata oluştu',
      });
    }
  },

  // Get single listing
  async getListing(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;

      logger.info(`Fetching listing with ID: ${id}`);

      const { data: listing, error } = await supabase
        .from('listings')
        .select(`*`)
        .eq('id', id)
        .single();

      if (error || !listing) {
        logger.error(`Listing not found: ${id}`, error);
        res.status(404).json({
          success: false,
          message: 'İlan bulunamadı',
        });
        return;
      }

      // Get user email from auth.users
      let userEmail = 'Bilinmiyor';
      if (listing.user_id) {
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(listing.user_id);
        if (!authError && authUser?.user) {
          userEmail = authUser.user.email || 'Bilinmiyor';
        }
      }

      // Get profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', listing.user_id)
        .single();

      const transformedListing = {
        id: listing.id,
        title: listing.title,
        description: listing.description,
        price: listing.budget || 0,
        category: listing.category,
        status: listing.status || 'pending_approval',
        views: listing.views_count || 0,
        favorites: listing.favorites_count || 0,
        createdAt: listing.created_at,
        updatedAt: listing.updated_at,
        userId: listing.user_id,
        images: listing.main_image_url ? [listing.main_image_url, ...(listing.additional_image_urls || [])] : [],
        user: {
          id: listing.user_id,
          email: userEmail,
          name: profile?.name || 'Bilinmiyor'
        },
      };

      res.json({
        success: true,
        data: transformedListing,
      });
    } catch (error) {
      logger.error('Error fetching listing:', error);
      res.status(500).json({
        success: false,
        message: 'İlan getirilirken bir hata oluştu',
      });
    }
  },

  // Update listing
  async updateListing(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      logger.info(`Updating listing with ID: ${id}`, updateData);

      const { data: listing, error } = await supabase
        .from('listings')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`*`)
        .single();

      if (error || !listing) {
        logger.error(`Error updating listing: ${id}`, error);
        res.status(404).json({
          success: false,
          message: 'İlan bulunamadı veya güncellenemedi',
        });
        return;
      }

      // Get user email from auth.users
      let userEmail = 'Bilinmiyor';
      if (listing.user_id) {
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(listing.user_id);
        if (!authError && authUser?.user) {
          userEmail = authUser.user.email || 'Bilinmiyor';
        }
      }

      // Get profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', listing.user_id)
        .single();

      const transformedListing = {
        id: listing.id,
        title: listing.title,
        description: listing.description,
        price: listing.budget || 0,
        category: listing.category,
        status: listing.status || 'pending_approval',
        views: listing.views_count || 0,
        favorites: listing.favorites_count || 0,
        createdAt: listing.created_at,
        updatedAt: listing.updated_at,
        userId: listing.user_id,
        images: listing.main_image_url ? [listing.main_image_url, ...(listing.additional_image_urls || [])] : [],
        user: {
          id: listing.user_id,
          email: userEmail,
          name: profile?.name || 'Bilinmiyor'
        },
      };

      // RabbitMQ mesaj gönder
      try {
        const { rabbitmqService } = await import('../services/rabbitmqService');
        const traceId = `update_${id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Elasticsearch sync mesajı
        const syncRoutingKey = 'listing.update';
        await rabbitmqService.publishToExchange(
          'benalsam.listings',
          syncRoutingKey,
          { 
            listingId: id, 
            operation: 'update',
            data: transformedListing,
            traceId 
          },
          { messageId: `${traceId}_sync` }
        );
        
        // Status change mesajı
        const statusRoutingKey = `listing.status.${listing.status || 'pending_approval'}`;
        await rabbitmqService.publishToExchange(
          'benalsam.listings',
          statusRoutingKey,
          { 
            listingId: id, 
            status: listing.status || 'pending_approval',
            traceId 
          },
          { messageId: `${traceId}_status` }
        );
        
        logger.info('📤 RabbitMQ messages sent for listing update', { 
          listingId: id, 
          status: listing.status,
          traceId 
        });
      } catch (mqError) {
        logger.error('❌ Failed to send RabbitMQ messages for listing update:', mqError);
        // Mesaj gönderme hatası olsa bile response'u döndür
      }

      res.json({
        success: true,
        data: transformedListing,
        message: 'İlan başarıyla güncellendi',
      });
    } catch (error) {
      logger.error('Error updating listing:', error);
      res.status(500).json({
        success: false,
        message: 'İlan güncellenirken bir hata oluştu',
      });
    }
  },

  // Delete listing
  async deleteListing(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;

      logger.info(`Deleting listing with ID: ${id}`);

      // Önce ilanı al (kategori bilgisi için)
      const { data: listing } = await supabase
        .from('listings')
        .select('category_id')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error(`Error deleting listing: ${id}`, error);
        res.status(404).json({
          success: false,
          message: 'İlan bulunamadı veya silinemedi',
        });
        return;
      }

      // RabbitMQ mesaj gönder
      try {
        const { rabbitmqService } = await import('../services/rabbitmqService');
        const traceId = `delete_${id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Elasticsearch sync mesajı
        const syncRoutingKey = 'listing.delete';
        await rabbitmqService.publishToExchange(
          'benalsam.listings',
          syncRoutingKey,
          { 
            recordId: id,  // recordId olarak değiştir
            operation: 'delete',
            traceId 
          },
          { messageId: `${traceId}_sync` }
        );
        
        logger.info('📤 RabbitMQ message sent for listing deletion', { 
          listingId: id, 
          traceId 
        });
      } catch (mqError) {
        logger.error('❌ Failed to send RabbitMQ message for listing deletion:', mqError);
        // Mesaj gönderme hatası olsa bile response'u döndür
      }

      // Kategori sayıları cache'ini temizle
      try {
        const { AdminElasticsearchService } = await import('../services/elasticsearchService');
        const elasticsearchService = new AdminElasticsearchService();
        await elasticsearchService.invalidateCategoryCountsCache();
        logger.info(`✅ Category counts cache invalidated after deleting listing: ${id}`);
      } catch (cacheError) {
        logger.warn(`⚠️ Failed to invalidate category counts cache:`, cacheError);
      }

      res.json({
        success: true,
        message: 'İlan başarıyla silindi',
      });
    } catch (error) {
      logger.error('Error deleting listing:', error);
      res.status(500).json({
        success: false,
        message: 'İlan silinirken bir hata oluştu',
      });
    }
  },

  // Moderate listing (approve/reject)
  async moderateListing(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const admin = req.admin;

      logger.info(`Moderating listing ${id} to status: ${status}`, { admin: admin?.email, reason });

      // Get admin profile ID
      const { data: adminProfile } = await supabase
        .from('admin_profiles')
        .select('id')
        .eq('admin_id', admin?.id)
        .eq('is_active', true)
        .single();

      const { data: listing, error } = await supabase
        .from('listings')
        .update({
          status: status.toLowerCase(),
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminProfile?.id || admin?.id, // Use admin profile ID if available
          rejection_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error || !listing) {
        logger.error(`Error moderating listing: ${id}`, error);
        res.status(404).json({
          success: false,
          message: 'İlan bulunamadı veya moderasyon işlemi başarısız',
        });
        return;
      }

      // Log moderation activity
      await supabase
        .from('admin_activity_logs')
        .insert({
          admin_id: admin?.id,
          admin_profile_id: adminProfile?.id,
          action: 'MODERATE_LISTING',
          resource: 'listings',
          resource_id: id,
          details: { status, reason },
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
        });

      // Get user email from auth.users
      let userEmail = 'Bilinmiyor';
      if (listing.user_id) {
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(listing.user_id);
        if (!authError && authUser?.user) {
          userEmail = authUser.user.email || 'Bilinmiyor';
        }
      }

      // Get profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', listing.user_id)
        .single();

      const transformedListing = {
        id: listing.id,
        title: listing.title,
        description: listing.description,
        price: listing.budget || 0,
        category: listing.category,
        category_id: listing.category_id, // ✅ category_id eklendi
        category_path: listing.category_path, // ✅ category_path eklendi
        status: listing.status?.toUpperCase() || 'PENDING',
        views: listing.views_count || 0,
        favorites: listing.favorites_count || 0,
        createdAt: listing.created_at,
        updatedAt: listing.updated_at,
        userId: listing.user_id,
        images: listing.main_image_url ? [listing.main_image_url, ...(listing.additional_image_urls || [])] : [],
        location: listing.city && listing.district ? {
          city: listing.city,
          district: listing.district,
          neighborhood: listing.neighborhood,
        } : null,
        user: {
          id: listing.user_id,
          email: userEmail,
          name: profile?.name || 'Bilinmiyor'
        },
      };

      // Queue sistemi otomatik olarak Elasticsearch sync'i yapacak
      // Trigger: listings_queue_sync → elasticsearch_sync_queue → QueueProcessor
      logger.info(`📋 İlan moderasyonu tamamlandı, queue sync bekleniyor: ${id}`);

      res.json({
        success: true,
        data: transformedListing,
        message: `İlan başarıyla ${status === 'ACTIVE' ? 'onaylandı' : 'reddedildi'}`,
      });
    } catch (error) {
      logger.error('Error moderating listing:', error);
      res.status(500).json({
        success: false,
        message: 'Moderasyon işlemi sırasında bir hata oluştu',
      });
    }
  },

  // Re-evaluate listing (move active listing back to pending)
  async reEvaluateListing(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const admin = req.admin;

      logger.info(`Re-evaluating listing ${id}`, { admin: admin?.email, reason });

      // Get admin profile ID
      const { data: adminProfile } = await supabase
        .from('admin_profiles')
        .select('id')
        .eq('admin_id', admin?.id)
        .eq('is_active', true)
        .single();

      const { data: listing, error } = await supabase
        .from('listings')
        .update({
          status: 'pending_approval',
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminProfile?.id || admin?.id,
          rejection_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error || !listing) {
        logger.error(`Error re-evaluating listing: ${id}`, error);
        res.status(404).json({
          success: false,
          message: 'İlan bulunamadı veya tekrar değerlendirme işlemi başarısız',
        });
        return;
      }

      // Log re-evaluation activity
      await supabase
        .from('admin_activity_logs')
        .insert({
          admin_id: admin?.id,
          admin_profile_id: adminProfile?.id,
          action: 'RE_EVALUATE_LISTING',
          resource: 'listings',
          resource_id: id,
          details: { reason },
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
        });

      // Get user email from auth.users
      let userEmail = 'Bilinmiyor';
      if (listing.user_id) {
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(listing.user_id);
        if (!authError && authUser?.user) {
          userEmail = authUser.user.email || 'Bilinmiyor';
        }
      }

      // Get profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', listing.user_id)
        .single();

      const transformedListing = {
        id: listing.id,
        title: listing.title,
        description: listing.description,
        price: listing.budget || 0,
        category: listing.category,
        status: listing.status || 'pending_approval',
        views: listing.views_count || 0,
        favorites: listing.favorites_count || 0,
        createdAt: listing.created_at,
        updatedAt: listing.updated_at,
        userId: listing.user_id,
        images: listing.main_image_url ? [listing.main_image_url, ...(listing.additional_image_urls || [])] : [],
        location: listing.city && listing.district ? {
          city: listing.city,
          district: listing.district,
          neighborhood: listing.neighborhood,
        } : null,
        user: {
          id: listing.user_id,
          email: userEmail,
          name: profile?.name || 'Bilinmiyor'
        },
      };

      res.json({
        success: true,
        data: transformedListing,
        message: 'İlan başarıyla tekrar değerlendirme sürecine alındı',
      });
    } catch (error) {
      logger.error('Error re-evaluating listing:', error);
      res.status(500).json({
        success: false,
        message: 'Tekrar değerlendirme işlemi sırasında bir hata oluştu',
      });
    }
  },
}; 