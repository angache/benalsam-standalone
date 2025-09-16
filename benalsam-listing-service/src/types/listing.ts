/**
 * Listing Types
 * 
 * @fileoverview Type definitions for Listing Service
 * @author Benalsam Team
 * @version 1.0.0
 */

import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

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
  listings: any[];
  total: number;
  hasMore: boolean;
}

export interface JobData {
  type: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  userId: string;
  payload: any;
}

export interface JobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}
