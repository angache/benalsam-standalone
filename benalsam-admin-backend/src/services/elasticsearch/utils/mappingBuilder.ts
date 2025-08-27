// ===========================
// MAPPING BUILDER UTILITY
// ===========================

import { IndexMapping } from '../types';

export function getListingsIndexMapping(): IndexMapping {
  return {
    settings: {
      analysis: {
        analyzer: {
          turkish_analyzer: {
            type: 'turkish'
          }
        }
      },
      number_of_shards: 1,
      number_of_replicas: 0
    },
    mappings: {
      properties: {
        id: { type: 'keyword' },
        user_id: { type: 'keyword' },
        title: { type: 'text', analyzer: 'turkish_analyzer' },
        description: { type: 'text', analyzer: 'turkish_analyzer' },
        category: { type: 'keyword' },
        category_id: { type: 'integer' },
        category_path: { type: 'integer' },
        subcategory: { type: 'keyword' },
        
        // Temel alanlar
        budget: { type: 'integer' },
        location: {
          type: 'object',
          properties: {
            province: { type: 'keyword' },
            district: { type: 'keyword' },
            neighborhood: { type: 'keyword' },
            coordinates: { type: 'geo_point' }
          }
        },
        condition: { type: 'keyword' },
        urgency: { type: 'keyword' },
        main_image_url: { type: 'keyword' },
        additional_image_urls: { type: 'keyword' },
        status: { type: 'keyword' },
        created_at: { type: 'date' },
        updated_at: { type: 'date' },
        
        // Esnek attributes
        attributes: {
          type: 'object',
          dynamic: true,
          properties: {
            // Sık kullanılan attribute'lar için özel mapping
            brand: { type: 'keyword' },
            model: { type: 'keyword' },
            ram: { type: 'keyword' },
            storage: { type: 'keyword' },
            color: { type: 'keyword' },
            size: { type: 'keyword' },
            year: { type: 'integer' },
            rooms: { type: 'integer' },
            square_meters: { type: 'float' },
            mileage: { type: 'integer' },
            fuel_type: { type: 'keyword' },
            transmission: { type: 'keyword' },
            material: { type: 'keyword' },
            warranty: { type: 'keyword' },
            original_box: { type: 'boolean' },
            furnished: { type: 'boolean' },
            parking: { type: 'boolean' },
            balcony: { type: 'boolean' },
            elevator: { type: 'boolean' },
            air_conditioning: { type: 'boolean' },
            energy_class: { type: 'keyword' },
            engine_size: { type: 'keyword' },
            body_type: { type: 'keyword' },
            doors: { type: 'integer' },
            seats: { type: 'integer' },
            bathrooms: { type: 'integer' },
            floor: { type: 'integer' },
            total_floors: { type: 'integer' },
            heating: { type: 'keyword' },
            building_type: { type: 'keyword' },
            view: { type: 'keyword' },
            floor_heating: { type: 'boolean' },
            security_system: { type: 'boolean' },
            garden: { type: 'boolean' },
            land_type: { type: 'keyword' },
            zoning: { type: 'keyword' },
            utilities: { type: 'keyword' },
            road_access: { type: 'boolean' },
            clothing_type: { type: 'keyword' },
            fit: { type: 'keyword' },
            original_price: { type: 'float' },
            sport_type: { type: 'keyword' },
            rarity: { type: 'keyword' },
            autographed: { type: 'boolean' },
            limited_edition: { type: 'boolean' },
            author: { type: 'text', analyzer: 'turkish_analyzer' },
            publisher: { type: 'keyword' },
            isbn: { type: 'keyword' },
            language: { type: 'keyword' },
            format: { type: 'keyword' },
            genre: { type: 'keyword' },
            pages: { type: 'integer' },
            subject: { type: 'keyword' },
            edition: { type: 'keyword' },
            service_type: { type: 'keyword' },
            experience_years: { type: 'integer' },
            certification: { type: 'keyword' },
            availability: { type: 'keyword' },
            location_type: { type: 'keyword' },
            languages: { type: 'keyword' },
            portfolio_url: { type: 'keyword' },
            references: { type: 'boolean' },
            insurance: { type: 'boolean' },
            payment_methods: { type: 'keyword' },
            hourly_rate: { type: 'float' },
            instrument_type: { type: 'keyword' },
            case_included: { type: 'boolean' },
            equipment_type: { type: 'keyword' },
            power_output: { type: 'keyword' },
            connectivity: { type: 'keyword' },
            artist: { type: 'text', analyzer: 'turkish_analyzer' },
            style: { type: 'keyword' },
            medium: { type: 'keyword' },
            dimensions: { type: 'object' },
            framed: { type: 'boolean' },
            year_created: { type: 'integer' },
            weight: { type: 'float' },
            craft_type: { type: 'keyword' },
            handmade: { type: 'boolean' },
            techniques: { type: 'keyword' },
            period: { type: 'keyword' },
            provenance: { type: 'text' },
            age: { type: 'integer' },
            toy_type: { type: 'keyword' },
            age_range: { type: 'keyword' },
            educational: { type: 'boolean' },
            safety_certified: { type: 'boolean' },
            platform: { type: 'keyword' },
            manual: { type: 'boolean' },
            region: { type: 'keyword' },
            player_count: { type: 'keyword' },
            aid_type: { type: 'keyword' },
            weight_capacity: { type: 'keyword' },
            adjustable: { type: 'boolean' }
          }
        },
        
        // Search optimization
        search_keywords: { type: 'keyword' },
        popularity_score: { type: 'float' },
        user_trust_score: { type: 'float' }
      }
    }
  };
}

export function getUserBehaviorsIndexMapping(): IndexMapping {
  return {
    settings: {
      analysis: {
        analyzer: {
          turkish_analyzer: {
            type: 'turkish'
          }
        }
      },
      number_of_shards: 1,
      number_of_replicas: 0
    },
    mappings: {
      properties: {
        event_id: { type: 'keyword' },
        event_name: { type: 'keyword' },
        event_timestamp: { type: 'date' },
        event_properties: { type: 'object', dynamic: true },
        
        user: {
          type: 'object',
          properties: {
            id: { type: 'keyword' },
            email: { type: 'keyword' },
            name: { type: 'text', analyzer: 'turkish_analyzer' },
            avatar: { type: 'keyword' },
            properties: {
              type: 'object',
              properties: {
                registration_date: { type: 'date' },
                subscription_type: { type: 'keyword' },
                last_login: { type: 'date' },
                trust_score: { type: 'float' },
                verification_status: { type: 'keyword' }
              }
            }
          }
        },
        
        session: {
          type: 'object',
          properties: {
            id: { type: 'keyword' },
            start_time: { type: 'date' },
            duration: { type: 'long' },
            page_views: { type: 'integer' },
            events_count: { type: 'integer' }
          }
        },
        
        device: {
          type: 'object',
          properties: {
            platform: { type: 'keyword' },
            version: { type: 'keyword' },
            model: { type: 'keyword' },
            screen_resolution: { type: 'keyword' },
            app_version: { type: 'keyword' },
            os_version: { type: 'keyword' },
            browser: { type: 'keyword' },
            user_agent: { type: 'text' }
          }
        },
        
        context: {
          type: 'object',
          properties: {
            ip_address: { type: 'keyword' },
            user_agent: { type: 'text' },
            referrer: { type: 'keyword' },
            utm_source: { type: 'keyword' },
            utm_medium: { type: 'keyword' },
            utm_campaign: { type: 'keyword' },
            utm_term: { type: 'keyword' },
            utm_content: { type: 'keyword' },
            language: { type: 'keyword' },
            timezone: { type: 'keyword' }
          }
        }
      }
    }
  };
}

export function getAISuggestionsIndexMapping(): IndexMapping {
  return {
    settings: {
      analysis: {
        analyzer: {
          turkish_analyzer: {
            type: 'turkish'
          }
        }
      },
      number_of_shards: 1,
      number_of_replicas: 0
    },
    mappings: {
      properties: {
        id: { type: 'integer' },
        category_id: { type: 'integer' },
        category_name: { type: 'keyword' },
        suggestion_type: { type: 'keyword' },
        suggestion_data: {
          type: 'object',
          properties: {
            keywords: { type: 'keyword' },
            brand: { type: 'keyword' },
            model: { type: 'keyword' },
            description: { type: 'text', analyzer: 'turkish_analyzer' },
            suggestions: { type: 'text', analyzer: 'turkish_analyzer' }
          }
        },
        confidence_score: { type: 'float' },
        is_approved: { type: 'boolean' },
        created_at: { type: 'date' },
        updated_at: { type: 'date' }
      }
    }
  };
}

export function getCustomIndexMapping(
  analyzer: string = 'turkish_analyzer',
  shards: number = 1,
  replicas: number = 0
): IndexMapping {
  return {
    settings: {
      analysis: {
        analyzer: {
          [analyzer]: {
            type: 'turkish'
          }
        }
      },
      number_of_shards: shards,
      number_of_replicas: replicas
    },
    mappings: {
      properties: {}
    }
  };
}
