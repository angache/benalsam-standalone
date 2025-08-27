// ===========================
// USER BEHAVIOR TRACKING SERVICE
// ===========================

import { Client } from '@elastic/elasticsearch';
import { UserBehaviorEvent, TrackingResult } from '../types';
import { createIndex, createBehaviorIndexMapping } from '../utils/elasticsearchUtils';

export default class UserBehaviorTrackingService {
  private client: Client;
  private behaviorIndex: string;
  private logger: any;

  constructor(client: Client, behaviorIndex: string, logger: any) {
    this.client = client;
    this.behaviorIndex = behaviorIndex;
    this.logger = logger;
  }

  async initializeIndex(): Promise<boolean> {
    try {
      const mapping = createBehaviorIndexMapping();
      await createIndex(this.client, this.behaviorIndex, mapping);
      this.logger.info('✅ User behavior index created successfully');
      return true;
    } catch (error: any) {
      if (error.message?.includes('resource_already_exists_exception')) {
        this.logger.info('ℹ️ User behavior index already exists');
        return true;
      }
      this.logger.error('❌ Error creating user behavior index:', error);
      return false;
    }
  }

  async trackUserBehavior(event: UserBehaviorEvent): Promise<TrackingResult> {
    try {
      this.logger.info('🔍 trackUserBehavior called');
      this.logger.info('🔍 Event object:', JSON.stringify(event, null, 2));
      this.logger.info('🔍 Event type:', event.event_type);
      this.logger.info('🔍 User ID:', event.user_id);
      
      this.logger.info('🔍 About to index to Elasticsearch');
      this.logger.info('🔍 Index name:', this.behaviorIndex);
      
      const result = await this.client.index({
        index: this.behaviorIndex,
        body: {
          ...event,
          timestamp: event.timestamp || new Date().toISOString()
        }
      });
      
      this.logger.info('🔍 Elasticsearch index result:', JSON.stringify(result, null, 2));
      this.logger.info(`📊 User behavior tracked: ${event.event_type} for user ${event.user_id}`);
      
      return {
        success: true,
        eventId: result._id
      };
    } catch (error) {
      this.logger.error('❌ Error tracking user behavior:', error);
      if (error instanceof Error) {
        this.logger.error('❌ Error message:', error.message);
        this.logger.error('❌ Error stack:', error.stack);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async trackBatchEvents(events: UserBehaviorEvent[]): Promise<TrackingResult[]> {
    try {
      const operations = events.flatMap(event => [
        { index: { _index: this.behaviorIndex } },
        {
          ...event,
          timestamp: event.timestamp || new Date().toISOString()
        }
      ]);

      const result = await this.client.bulk({ body: operations });
      
      const results: TrackingResult[] = [];
      if (result.items) {
        for (let i = 0; i < result.items.length; i++) {
          const item = result.items[i];
          if (item.index?.error) {
            results.push({
              success: false,
              error: item.index.error.reason || 'Bulk operation failed'
            });
          } else {
            results.push({
              success: true,
              eventId: item.index?._id
            });
          }
        }
      }

      this.logger.info(`📊 Batch tracked ${events.length} events`);
      return results;
    } catch (error) {
      this.logger.error('❌ Error tracking batch events:', error);
      return events.map(() => ({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }

  async validateEvent(event: UserBehaviorEvent): Promise<boolean> {
    // Basic validation
    if (!event.event_type) {
      this.logger.error('❌ Event type is required');
      return false;
    }

    if (!event.timestamp) {
      this.logger.error('❌ Event timestamp is required');
      return false;
    }

    if (!event.event_data) {
      this.logger.error('❌ Event data is required');
      return false;
    }

    // Validate timestamp format
    try {
      new Date(event.timestamp);
    } catch (error) {
      this.logger.error('❌ Invalid timestamp format');
      return false;
    }

    return true;
  }

  async getEventById(eventId: string): Promise<UserBehaviorEvent | null> {
    try {
      const result = await this.client.get({
        index: this.behaviorIndex,
        id: eventId
      });

      return result._source as UserBehaviorEvent;
    } catch (error) {
      this.logger.error('❌ Error getting event by ID:', error);
      return null;
    }
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      await this.client.delete({
        index: this.behaviorIndex,
        id: eventId
      });

      this.logger.info(`🗑️ Event deleted: ${eventId}`);
      return true;
    } catch (error) {
      this.logger.error('❌ Error deleting event:', error);
      return false;
    }
  }

  async updateEvent(eventId: string, updates: Partial<UserBehaviorEvent>): Promise<boolean> {
    try {
      await this.client.update({
        index: this.behaviorIndex,
        id: eventId,
        body: {
          doc: updates
        }
      });

      this.logger.info(`✏️ Event updated: ${eventId}`);
      return true;
    } catch (error) {
      this.logger.error('❌ Error updating event:', error);
      return false;
    }
  }
}
