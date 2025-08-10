import { Request, Response } from 'express';

export const monitoringController = {
  // Get system health metrics
  getSystemHealth: async (req: Request, res: Response) => {
    try {
      res.status(200).json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
        },
        message: 'System health metrics retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get system health metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  // Get application metrics
  getApplicationMetrics: async (req: Request, res: Response) => {
    try {
      res.status(200).json({
        success: true,
        data: {
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
        },
        message: 'Application metrics retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get application metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  // Get performance metrics
  getPerformanceMetrics: async (req: Request, res: Response) => {
    try {
      res.status(200).json({
        success: true,
        data: {
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
          uptime: process.uptime(),
        },
        message: 'Performance metrics retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get performance metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
}; 