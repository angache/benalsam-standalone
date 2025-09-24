/**
 * Listing Service
 * 
 * @fileoverview Core business logic for listing management
 * @author Benalsam Team
 * @version 1.0.0
 */

import { supabase } from '../config/database';
import { logger } from '../config/logger';
import { Listing, ListingStatusType, ListingStatus } from 'benalsam-shared-types';

export interface ListingFilters {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  category?: string;
  userId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ListingResult {
  listings: Listing[];
  total: number;
  hasMore: boolean;
}

export class ListingService {
  private static instance: ListingService;
  private isRunning = false;

  static getInstance(): ListingService {
    if (!ListingService.instance) {
      ListingService.instance = new ListingService();
    }
    return ListingService.instance;
  }

  /**
   * Start the listing service
   */
  async start(): Promise<void> {
    try {
      logger.info('🚀 Starting Listing Service...');
      this.isRunning = true;
      logger.info('✅ Listing Service started');
    } catch (error) {
      logger.error('❌ Failed to start Listing Service:', error);
      throw error;
    }
  }

  /**
   * Stop the listing service
   */
  async stop(): Promise<void> {
    try {
      logger.info('🛑 Stopping Listing Service...');
      this.isRunning = false;
      logger.info('✅ Listing Service stopped');
    } catch (error) {
      logger.error('❌ Error stopping Listing Service:', error);
    }
  }

  /**
   * Get service status
   */
  getStatus(): { running: boolean } {
    return { running: this.isRunning };
  }

  /**
   * Get listings with filters
   */
  async getListings(filters: ListingFilters): Promise<ListingResult> {
    try {
      const { page, limit, search, status, category, userId, sortBy, sortOrder } = filters;
      const offset = (page - 1) * limit;

      logger.info('🔍 Fetching listings', { filters });

      // Build Supabase query
      let query = supabase
        .from('listings')
        .select(`
          *,
          profiles!listings_user_id_fkey (
            id,
            name,
            avatar_url
          )
        `);

      // Apply filters
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }
      
      if (status) {
        query = query.eq('status', status.toLowerCase());
      }
      
      if (category) {
        query = query.eq('category', category);
      }
      
      if (userId) {
        query = query.eq('user_id', userId);
      }

      // Apply sorting
      query = query.order(sortBy || 'created_at', { ascending: sortOrder === 'asc' });

      // Get total count for pagination
      const { count } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data: listings, error } = await query;

      if (error) {
        logger.error('❌ Error fetching listings:', error);
        throw error;
      }

      const total = count || 0;
      const hasMore = offset + limit < total;

      logger.info('✅ Listings fetched successfully', { 
        count: listings?.length || 0, 
        total, 
        hasMore 
      });

      return {
        listings: listings || [],
        total,
        hasMore
      };

    } catch (error) {
      logger.error('❌ Error in getListings:', error);
      throw error;
    }
  }

  /**
   * Get single listing by ID
   */
  async getListingById(id: string, userId?: string): Promise<Listing | null> {
    try {
      logger.info('🔍 Fetching listing by ID', { id, userId });

      let query = supabase
        .from('listings')
        .select(`
          *,
          profiles!listings_user_id_fkey (
            id,
            name,
            avatar_url
          )
        `)
        .eq('id', id);

      // If userId provided, ensure user has access
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: listing, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          logger.warn('⚠️ Listing not found', { id, userId });
          return null;
        }
        logger.error('❌ Error fetching listing:', error);
        throw error;
      }

      logger.info('✅ Listing fetched successfully', { id });
      return listing;

    } catch (error) {
      logger.error('❌ Error in getListingById:', error);
      throw error;
    }
  }

  /**
   * Create new listing
   */
  async createListing(listingData: any): Promise<Listing> {
    try {
      logger.info('🚀 Creating listing', { 
        title: listingData.title, 
        userId: listingData.user_id,
        category_id: listingData.category_id,
        category_path: listingData.category_path,
        attributes: listingData.attributes,
        attributesType: typeof listingData.attributes
      });

      const listingToInsert = {
        user_id: listingData.user_id,
        title: listingData.title,
        description: listingData.description,
        category: listingData.category,
        category_id: listingData.category_id,
        category_path: listingData.category_path,
        budget: listingData.budget,
        location: listingData.location,
        urgency: listingData.urgency || 'medium',
        main_image_url: listingData.mainImageUrl || listingData.main_image_url,
        additional_image_urls: listingData.additionalImageUrls || listingData.additional_image_urls,
        image_url: listingData.mainImageUrl || listingData.main_image_url,
        expires_at: listingData.expires_at,
        auto_republish: listingData.auto_republish || false,
        contact_preference: listingData.contact_preference || 'both',
        accept_terms: listingData.accept_terms || true,
        is_featured: listingData.is_featured || false,
        is_urgent_premium: listingData.is_urgent_premium || false,
        is_showcase: listingData.is_showcase || false,
        geolocation: listingData.geolocation,
        condition: listingData.condition || [],
        attributes: listingData.attributes || null,
        status: ListingStatus.PENDING_APPROVAL,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: listing, error } = await supabase
        .from('listings')
        .insert(listingToInsert)
        .select(`
          *,
          profiles!listings_user_id_fkey (
            id,
            name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        logger.error('❌ Error creating listing:', error);
        throw error;
      }

      logger.info('✅ Listing created successfully', { id: listing.id, title: listing.title });
      return listing;

    } catch (error) {
      logger.error('❌ Error in createListing:', error);
      throw error;
    }
  }

  /**
   * Update existing listing
   */
  async updateListing(id: string, updateData: any, userId: string): Promise<Listing> {
    try {
      logger.info('🔄 Updating listing', { id, userId, updateFields: Object.keys(updateData) });

      // Check if listing exists and user has permission
      const existingListing = await this.getListingById(id, userId);
      if (!existingListing) {
        throw new Error('Listing not found or access denied');
      }

      const listingToUpdate = {
        ...updateData,
        updated_at: new Date().toISOString()
      };

      const { data: listing, error } = await supabase
        .from('listings')
        .update(listingToUpdate)
        .eq('id', id)
        .eq('user_id', userId)
        .select(`
          *,
          profiles!listings_user_id_fkey (
            id,
            name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        logger.error('❌ Error updating listing:', error);
        throw error;
      }

      logger.info('✅ Listing updated successfully', { id, title: listing.title });
      return listing;

    } catch (error) {
      logger.error('❌ Error in updateListing:', error);
      throw error;
    }
  }

  /**
   * Delete listing
   */
  async deleteListing(id: string, userId: string): Promise<boolean> {
    try {
      logger.info('🗑️ Deleting listing', { id, userId });

      // Check if listing exists and user has permission
      const existingListing = await this.getListingById(id, userId);
      if (!existingListing) {
        throw new Error('Listing not found or access denied');
      }

      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        logger.error('❌ Error deleting listing:', error);
        throw error;
      }

      logger.info('✅ Listing deleted successfully', { id });
      return true;

    } catch (error) {
      logger.error('❌ Error in deleteListing:', error);
      throw error;
    }
  }

  /**
   * Moderate listing (Admin only)
   */
  async moderateListing(id: string, action: string, reason?: string, userId?: string): Promise<Listing> {
    try {
      logger.info('⚖️ Moderating listing', { id, action, reason, userId });

      let status: ListingStatusType;
      switch (action) {
        case 'approve':
          status = 'active';
          break;
        case 'reject':
          status = 'rejected';
          break;
        case 're-evaluate':
          status = 'pending_approval';
          break;
        default:
          throw new Error('Invalid moderation action');
      }

      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (reason) {
        updateData.rejection_reason = reason;
      }

      const { data: listing, error } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          profiles!listings_user_id_fkey (
            id,
            name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        logger.error('❌ Error moderating listing:', error);
        throw error;
      }

      logger.info('✅ Listing moderated successfully', { id, action, status });
      return listing;

    } catch (error) {
      logger.error('❌ Error in moderateListing:', error);
      throw error;
    }
  }

  /**
   * Get listing statistics
   */
  async getListingStats(userId?: string): Promise<{
    total: number;
    active: number;
    pending: number;
    rejected: number;
    inactive: number;
  }> {
    try {
      logger.info('📊 Getting listing statistics', { userId });

      let query = supabase
        .from('listings')
        .select('status', { count: 'exact' });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: listings, error } = await query;

      if (error) {
        logger.error('❌ Error fetching listing stats:', error);
        throw error;
      }

      const stats = {
        total: listings?.length || 0,
        active: 0,
        pending: 0,
        rejected: 0,
        inactive: 0
      };

      listings?.forEach(listing => {
        switch (listing.status?.toUpperCase()) {
          case 'ACTIVE':
            stats.active++;
            break;
          case 'PENDING':
            stats.pending++;
            break;
          case 'REJECTED':
            stats.rejected++;
            break;
          case 'INACTIVE':
            stats.inactive++;
            break;
        }
      });

      logger.info('✅ Listing statistics fetched', stats);
      return stats;

    } catch (error) {
      logger.error('❌ Error in getListingStats:', error);
      throw error;
    }
  }
}

export const listingService = ListingService.getInstance();
