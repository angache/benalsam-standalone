import { Response } from 'express';
import { supabase } from '../config/database';
import type { AuthenticatedRequest } from '../types';
import logger from '../config/logger';

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

      // Get user emails from auth.users
      const userEmails = new Map();
      for (const userId of userIds) {
        try {
          const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
          if (!authError && authUser?.user) {
            userEmails.set(userId, authUser.user.email || 'Bilinmiyor');
          } else {
            userEmails.set(userId, 'Bilinmiyor');
          }
        } catch (error) {
          userEmails.set(userId, 'Bilinmiyor');
        }
      }

      // Get profile info for all users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Transform data for frontend
      const transformedListings = (listings || []).map(listing => ({
        id: listing.id,
        title: listing.title,
        description: listing.description,
        price: listing.budget || 0,
        category: listing.category,
        status: listing.status?.toUpperCase() || 'PENDING',
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
        status: listing.status?.toUpperCase() || 'PENDING',
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
        status: listing.status?.toUpperCase() || 'PENDING',
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
          status: 'pending',
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