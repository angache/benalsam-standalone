import AsyncStorage from '@react-native-async-storage/async-storage';

interface SearchEvent {
  id: string;
  query: string;
  timestamp: number;
  resultCount: number;
  duration: number;
  category?: string;
  filters?: Record<string, any>;
  userId?: string;
}

interface SearchMetrics {
  totalSearches: number;
  averageResultCount: number;
  averageSearchDuration: number;
  popularQueries: Array<{ query: string; count: number }>;
  searchTrends: Array<{ date: string; count: number }>;
  categoryDistribution: Record<string, number>;
}

interface PerformanceMetrics {
  searchDurations: number[];
  resultCounts: number[];
  errorCount: number;
  averageResponseTime: number;
  slowQueries: Array<{ query: string; duration: number }>;
}

class SearchAnalytics {
  private static instance: SearchAnalytics;
  private events: SearchEvent[] = [];
  private performanceMetrics: PerformanceMetrics = {
    searchDurations: [],
    resultCounts: [],
    errorCount: 0,
    averageResponseTime: 0,
    slowQueries: [],
  };

  private constructor() {
    this.loadEvents();
  }

  static getInstance(): SearchAnalytics {
    if (!SearchAnalytics.instance) {
      SearchAnalytics.instance = new SearchAnalytics();
    }
    return SearchAnalytics.instance;
  }

  // Track search event
  async trackSearch(
    query: string,
    resultCount: number,
    duration: number,
    category?: string,
    filters?: Record<string, any>,
    userId?: string
  ): Promise<void> {
    const event: SearchEvent = {
      id: `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      query: query.trim().toLowerCase(),
      timestamp: Date.now(),
      resultCount,
      duration,
      category,
      filters,
      userId,
    };

    this.events.push(event);
    this.updatePerformanceMetrics(event);
    await this.saveEvents();
    
    console.log(`📊 Search Analytics: Tracked search "${query}" (${resultCount} results, ${duration}ms)`);
  }

  // Track search error
  async trackError(query: string, error: string, userId?: string): Promise<void> {
    this.performanceMetrics.errorCount++;
    
    console.log(`📊 Search Analytics: Tracked error for "${query}": ${error}`);
  }

  // Get search metrics
  async getSearchMetrics(days: number = 30): Promise<SearchMetrics> {
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    const recentEvents = this.events.filter(event => event.timestamp > cutoffTime);

    const totalSearches = recentEvents.length;
    const averageResultCount = totalSearches > 0 
      ? recentEvents.reduce((sum, event) => sum + event.resultCount, 0) / totalSearches 
      : 0;
    const averageSearchDuration = totalSearches > 0
      ? recentEvents.reduce((sum, event) => sum + event.duration, 0) / totalSearches
      : 0;

    // Popular queries
    const queryCounts: Record<string, number> = {};
    recentEvents.forEach(event => {
      queryCounts[event.query] = (queryCounts[event.query] || 0) + 1;
    });
    const popularQueries = Object.entries(queryCounts)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Search trends (daily)
    const dailyCounts: Record<string, number> = {};
    recentEvents.forEach(event => {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    const searchTrends = Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Category distribution
    const categoryCounts: Record<string, number> = {};
    recentEvents.forEach(event => {
      if (event.category) {
        categoryCounts[event.category] = (categoryCounts[event.category] || 0) + 1;
      }
    });

    return {
      totalSearches,
      averageResultCount,
      averageSearchDuration,
      popularQueries,
      searchTrends,
      categoryDistribution: categoryCounts,
    };
  }

  // Get performance metrics
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  // Get slow queries
  getSlowQueries(threshold: number = 1000): Array<{ query: string; duration: number }> {
    return this.events
      .filter(event => event.duration > threshold)
      .map(event => ({ query: event.query, duration: event.duration }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
  }

  // Get search suggestions based on analytics
  async getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
    const similarQueries = this.events
      .filter(event => 
        event.query.includes(query.toLowerCase()) || 
        query.toLowerCase().includes(event.query)
      )
      .map(event => event.query);

    const queryCounts: Record<string, number> = {};
    similarQueries.forEach(q => {
      queryCounts[q] = (queryCounts[q] || 0) + 1;
    });

    return Object.entries(queryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query]) => query);
  }

  // Clear analytics data
  async clearAnalytics(): Promise<void> {
    this.events = [];
    this.performanceMetrics = {
      searchDurations: [],
      resultCounts: [],
      errorCount: 0,
      averageResponseTime: 0,
      slowQueries: [],
    };
    await AsyncStorage.removeItem('searchAnalytics');
    console.log('📊 Search Analytics: Cleared all data');
  }

  // Private methods
  private updatePerformanceMetrics(event: SearchEvent): void {
    this.performanceMetrics.searchDurations.push(event.duration);
    this.performanceMetrics.resultCounts.push(event.resultCount);
    
    // Keep only last 1000 metrics for memory management
    if (this.performanceMetrics.searchDurations.length > 1000) {
      this.performanceMetrics.searchDurations.shift();
      this.performanceMetrics.resultCounts.shift();
    }

    // Update average response time
    const totalDuration = this.performanceMetrics.searchDurations.reduce((sum, d) => sum + d, 0);
    this.performanceMetrics.averageResponseTime = totalDuration / this.performanceMetrics.searchDurations.length;

    // Track slow queries
    if (event.duration > 1000) {
      this.performanceMetrics.slowQueries.push({
        query: event.query,
        duration: event.duration,
      });
      
      // Keep only top 20 slow queries
      this.performanceMetrics.slowQueries.sort((a, b) => b.duration - a.duration);
      this.performanceMetrics.slowQueries = this.performanceMetrics.slowQueries.slice(0, 20);
    }
  }

  private async loadEvents(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('searchAnalytics');
      if (stored) {
        const data = JSON.parse(stored);
        this.events = data.events || [];
        this.performanceMetrics = data.performanceMetrics || {
          searchDurations: [],
          resultCounts: [],
          errorCount: 0,
          averageResponseTime: 0,
          slowQueries: [],
        };
      }
    } catch (error) {
      console.error('Failed to load search analytics:', error);
    }
  }

  private async saveEvents(): Promise<void> {
    try {
      const data = {
        events: this.events.slice(-1000), // Keep only last 1000 events
        performanceMetrics: this.performanceMetrics,
      };
      await AsyncStorage.setItem('searchAnalytics', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save search analytics:', error);
    }
  }
}

export default SearchAnalytics; 