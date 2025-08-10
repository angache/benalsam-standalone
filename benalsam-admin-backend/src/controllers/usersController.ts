import { Response } from 'express';
import { supabase } from '../config/database';
import type { AuthenticatedRequest } from '../types';
import { ApiResponseUtil } from '../utils/response';
import logger from '../config/logger';

export const usersController = {
  // Get all users
  async getUsers(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { page = 1, limit = 20, search, filters } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      // Apply search filter
      if (search) {
        query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      }

      // Apply status filter
      if (filters && typeof filters === 'object' && 'status' in filters) {
        query = query.eq('status', filters.status);
      }

      // Apply pagination
      query = query.range(offset, offset + Number(limit) - 1);

      const { data: users, error, count } = await query;

      if (error) {
        logger.error('Error fetching users:', error);
        return ApiResponseUtil.internalServerError(res, 'Kullanıcılar getirilirken bir hata oluştu');
      }

      const totalPages = Math.ceil((count || 0) / Number(limit));

      res.json({
        success: true,
        data: users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0,
          totalPages
        },
        message: 'Kullanıcılar başarıyla getirildi'
      });
    } catch (error) {
      logger.error('Error in getUsers:', error);
      ApiResponseUtil.internalServerError(res, 'Kullanıcılar getirilirken bir hata oluştu');
    }
  },

  // Get single user
  async getUser(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;

      const { data: user, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        logger.error('Error fetching user:', error);
        return ApiResponseUtil.notFound(res, 'Kullanıcı bulunamadı');
      }

      res.json({
        success: true,
        data: user,
        message: 'Kullanıcı başarıyla getirildi'
      });
    } catch (error) {
      logger.error('Error in getUser:', error);
      ApiResponseUtil.internalServerError(res, 'Kullanıcı getirilirken bir hata oluştu');
    }
  },

  // Update user
  async updateUser(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const admin = req.admin;

      logger.info(`Updating user ${id}`, { admin: admin?.email, updateData });

      const { data: user, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating user:', error);
        return ApiResponseUtil.internalServerError(res, 'Kullanıcı güncellenirken bir hata oluştu');
      }

      res.json({
        success: true,
        data: user,
        message: 'Kullanıcı başarıyla güncellendi'
      });
    } catch (error) {
      logger.error('Error in updateUser:', error);
      ApiResponseUtil.internalServerError(res, 'Kullanıcı güncellenirken bir hata oluştu');
    }
  },

  // Ban user
  async banUser(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const admin = req.admin;

      logger.info(`Banning user ${id}`, { admin: admin?.email, reason });

      const { data: user, error } = await supabase
        .from('profiles')
        .update({ 
          status: 'BANNED',
          banned_at: new Date().toISOString(),
          banned_by: admin?.id,
          ban_reason: reason
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error banning user:', error);
        return ApiResponseUtil.internalServerError(res, 'Kullanıcı yasaklanırken bir hata oluştu');
      }

      res.json({
        success: true,
        data: user,
        message: 'Kullanıcı başarıyla yasaklandı'
      });
    } catch (error) {
      logger.error('Error in banUser:', error);
      ApiResponseUtil.internalServerError(res, 'Kullanıcı yasaklanırken bir hata oluştu');
    }
  },

  // Unban user
  async unbanUser(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;
      const admin = req.admin;

      logger.info(`Unbanning user ${id}`, { admin: admin?.email });

      const { data: user, error } = await supabase
        .from('profiles')
        .update({ 
          status: 'ACTIVE',
          banned_at: null,
          banned_by: null,
          ban_reason: null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error unbanning user:', error);
        return ApiResponseUtil.internalServerError(res, 'Kullanıcı yasağı kaldırılırken bir hata oluştu');
      }

      res.json({
        success: true,
        data: user,
        message: 'Kullanıcı yasağı başarıyla kaldırıldı'
      });
    } catch (error) {
      logger.error('Error in unbanUser:', error);
      ApiResponseUtil.internalServerError(res, 'Kullanıcı yasağı kaldırılırken bir hata oluştu');
    }
  },

  // Delete user
  async deleteUser(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;
      const admin = req.admin;

      logger.info(`Deleting user ${id}`, { admin: admin?.email });

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Error deleting user:', error);
        return ApiResponseUtil.internalServerError(res, 'Kullanıcı silinirken bir hata oluştu');
      }

      res.json({
        success: true,
        message: 'Kullanıcı başarıyla silindi'
      });
    } catch (error) {
      logger.error('Error in deleteUser:', error);
      ApiResponseUtil.internalServerError(res, 'Kullanıcı silinirken bir hata oluştu');
    }
  }
}; 