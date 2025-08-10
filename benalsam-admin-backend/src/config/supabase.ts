import { createClient } from '@supabase/supabase-js';

// Supabase configuration from web project
const supabaseUrl = process.env.SUPABASE_URL || 'https://dnwreckpeenhbdtapmxr.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRud3JlY2twZWVuaGJkdGFwbXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5OTgwNzAsImV4cCI6MjA2NTU3NDA3MH0.2lzsxTj4hoKTcZeoCGMsUC3Cmsm1pgcqXP-3j_GV_Ys';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRud3JlY2twZWVuaGJkdGFwbXhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTk5ODA3MCwiZXhwIjoyMDY1NTc0MDcwfQ.b6UNsncrPKXYB-17oyOEx8xY_hbofAx7ObwzKsyhsm4';

// Create Supabase client with service role key for admin operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Create Supabase client with anon key for public operations
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Mock data for testing
export const mockListings: any[] = [
  {
    id: '1',
    title: 'iPhone 14 Pro Max - Mükemmel Durumda',
    description: '6 ay önce alınmış, kutulu iPhone 14 Pro Max. Hiç kullanılmamış gibi durumda.',
    price: 45000,
    category: 'Elektronik',
    condition: 'Çok İyi',
    status: 'PENDING',
    views: 0,
    favorites: 0,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    user_id: 'user1',
    users: {
      id: 'user1',
      email: 'user1@example.com',
      name: 'Ahmet Yılmaz'
    },
    listing_images: [
      { id: '1', url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400', order: 0 }
    ],
    listing_locations: {
      id: '1',
      city: 'İstanbul',
      district: 'Kadıköy',
      neighborhood: 'Fenerbahçe'
    }
  },
  {
    id: '2',
    title: 'MacBook Air M2 - 2023 Model',
    description: 'Apple MacBook Air M2 çip, 8GB RAM, 256GB SSD. Garantisi devam ediyor.',
    price: 35000,
    category: 'Elektronik',
    condition: 'Yeni Gibi',
    status: 'ACTIVE',
    views: 45,
    favorites: 12,
    created_at: '2024-01-14T15:20:00Z',
    updated_at: '2024-01-14T15:20:00Z',
    user_id: 'user2',
    users: {
      id: 'user2',
      email: 'user2@example.com',
      name: 'Ayşe Demir'
    },
    listing_images: [
      { id: '2', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400', order: 0 }
    ],
    listing_locations: {
      id: '2',
      city: 'İstanbul',
      district: 'Beşiktaş',
      neighborhood: 'Levent'
    }
  },
  {
    id: '3',
    title: 'Samsung Galaxy S23 Ultra',
    description: 'Samsung Galaxy S23 Ultra, 256GB, Phantom Black. 3 ay kullanıldı.',
    price: 28000,
    category: 'Elektronik',
    condition: 'İyi',
    status: 'ACTIVE',
    views: 23,
    favorites: 8,
    created_at: '2024-01-13T09:15:00Z',
    updated_at: '2024-01-13T09:15:00Z',
    user_id: 'user3',
    users: {
      id: 'user3',
      email: 'user3@example.com',
      name: 'Mehmet Kaya'
    },
    listing_images: [
      { id: '3', url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400', order: 0 }
    ],
    listing_locations: {
      id: '3',
      city: 'Ankara',
      district: 'Çankaya',
      neighborhood: 'Kızılay'
    }
  },
  {
    id: '4',
    title: 'PS5 Console + 2 Controller',
    description: 'PlayStation 5 Console, 2 adet DualSense controller ile birlikte.',
    price: 18000,
    category: 'Oyun & Hobi',
    condition: 'Çok İyi',
    status: 'PENDING',
    views: 0,
    favorites: 0,
    created_at: '2024-01-12T14:45:00Z',
    updated_at: '2024-01-12T14:45:00Z',
    user_id: 'user1',
    users: {
      id: 'user1',
      email: 'user1@example.com',
      name: 'Ahmet Yılmaz'
    },
    listing_images: [
      { id: '4', url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400', order: 0 }
    ],
    listing_locations: {
      id: '4',
      city: 'İzmir',
      district: 'Konak',
      neighborhood: 'Alsancak'
    }
  },
  {
    id: '5',
    title: 'Nike Air Jordan 1 Retro High',
    description: 'Nike Air Jordan 1 Retro High OG, US 42, Beyaz/Kırmızı renk.',
    price: 4500,
    category: 'Giyim & Aksesuar',
    condition: 'Yeni',
    status: 'REJECTED',
    views: 67,
    favorites: 15,
    moderation_reason: 'Sahte ürün şüphesi',
    created_at: '2024-01-11T11:30:00Z',
    updated_at: '2024-01-11T11:30:00Z',
    user_id: 'user2',
    users: {
      id: 'user2',
      email: 'user2@example.com',
      name: 'Ayşe Demir'
    },
    listing_images: [
      { id: '5', url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400', order: 0 }
    ],
    listing_locations: {
      id: '5',
      city: 'İstanbul',
      district: 'Şişli',
      neighborhood: 'Nişantaşı'
    }
  }
];

// Types for our database schema
export interface Database {
  public: {
    Tables: {
      listings: {
        Row: {
          id: string;
          title: string;
          description: string;
          price: number;
          category: string;
          condition: string | null;
          status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'REJECTED' | 'SOLD';
          views: number;
          favorites: number;
          user_id: string;
          moderated_at: string | null;
          moderated_by: string | null;
          moderation_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          price: number;
          category: string;
          condition?: string | null;
          status?: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'REJECTED' | 'SOLD';
          views?: number;
          favorites?: number;
          user_id: string;
          moderated_at?: string | null;
          moderated_by?: string | null;
          moderation_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          price?: number;
          category?: string;
          condition?: string | null;
          status?: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'REJECTED' | 'SOLD';
          views?: number;
          favorites?: number;
          user_id?: string;
          moderated_at?: string | null;
          moderated_by?: string | null;
          moderation_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar: string | null;
          status: 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'SUSPENDED';
          trust_score: number;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          avatar?: string | null;
          status?: 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'SUSPENDED';
          trust_score?: number;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar?: string | null;
          status?: 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'SUSPENDED';
          trust_score?: number;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      listing_images: {
        Row: {
          id: string;
          listing_id: string;
          url: string;
          order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          url: string;
          order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          url?: string;
          order?: number;
          created_at?: string;
        };
      };
      listing_locations: {
        Row: {
          id: string;
          listing_id: string;
          city: string;
          district: string;
          neighborhood: string | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          city: string;
          district: string;
          neighborhood?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          city?: string;
          district?: string;
          neighborhood?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
        };
      };
      admin_users: {
        Row: {
          id: string;
          email: string;
          password: string;
          first_name: string;
          last_name: string;
          role: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'SUPPORT';
          permissions: any | null;
          is_active: boolean;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password: string;
          first_name: string;
          last_name: string;
          role?: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'SUPPORT';
          permissions?: any | null;
          is_active?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password?: string;
          first_name?: string;
          last_name?: string;
          role?: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'SUPPORT';
          permissions?: any | null;
          is_active?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
} 