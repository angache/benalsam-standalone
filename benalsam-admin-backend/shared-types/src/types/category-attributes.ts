// ===========================
// CATEGORY-SPECIFIC ATTRIBUTES INTERFACES
// ===========================

export interface ElectronicsAttributes {
  brand: string;
  model: string;
  storage?: string;
  color?: string;
  condition: 'new' | 'like_new' | 'excellent' | 'good' | 'fair' | 'poor';
  warranty?: 'active' | 'expired' | 'none';
  original_box?: boolean;
  accessories?: string[];
  year?: number;
  processor?: string;
  ram?: string;
  screen_size?: string;
  battery_health?: number;
}

export interface VehicleAttributes {
  brand: string;
  model: string;
  year: number;
  mileage: number;
  fuel_type: 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'lpg' | 'cng';
  transmission: 'manual' | 'automatic' | 'semi_automatic';
  engine_size?: string;
  color: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  service_history: 'full' | 'partial' | 'none';
  body_type?: 'sedan' | 'suv' | 'hatchback' | 'wagon' | 'coupe' | 'convertible' | 'pickup' | 'van';
  doors?: number;
  seats?: number;
  features?: string[];
}

export interface RealEstateAttributes {
  property_type: 'apartment' | 'house' | 'villa' | 'office' | 'shop' | 'land' | 'warehouse';
  rooms: number;
  bathrooms: number;
  square_meters: number;
  floor?: number;
  total_floors?: number;
  heating: 'central' | 'individual' | 'floor' | 'none';
  furnished: boolean;
  parking: boolean;
  balcony: boolean;
  elevator: boolean;
  age?: number;
  building_type?: 'reinforced_concrete' | 'steel' | 'wood' | 'mixed';
  view?: 'sea' | 'mountain' | 'city' | 'garden' | 'street';
  floor_heating?: boolean;
  air_conditioning?: boolean;
}

export interface FashionAttributes {
  brand: string;
  category: 'clothing' | 'shoes' | 'accessories' | 'jewelry' | 'watches';
  model?: string;
  size: string;
  color: string;
  condition: 'new' | 'like_new' | 'excellent' | 'good' | 'fair' | 'poor';
  original_price?: number;
  tags?: string[];
  material?: string;
  style?: string;
  season?: 'spring' | 'summer' | 'autumn' | 'winter' | 'all_season';
  gender?: 'men' | 'women' | 'unisex' | 'kids';
}

export interface HomeGardenAttributes {
  category: 'furniture' | 'appliances' | 'tools' | 'decor' | 'garden' | 'kitchen';
  brand?: string;
  model?: string;
  condition: 'new' | 'like_new' | 'excellent' | 'good' | 'fair' | 'poor';
  material?: string;
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
  };
  color?: string;
  style?: string;
  warranty?: 'active' | 'expired' | 'none';
  energy_class?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  power?: string;
  capacity?: string;
}

export interface SportsHobbyAttributes {
  category: 'sports_equipment' | 'musical_instruments' | 'games' | 'collectibles' | 'hobbies';
  brand?: string;
  model?: string;
  condition: 'new' | 'like_new' | 'excellent' | 'good' | 'fair' | 'poor';
  sport_type?: string;
  instrument_type?: string;
  game_type?: string;
  collectible_type?: string;
  age?: number;
  rarity?: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary';
  original_box?: boolean;
  accessories?: string[];
  autographed?: boolean;
  limited_edition?: boolean;
}

export interface BooksMediaAttributes {
  category: 'books' | 'movies' | 'games' | 'music' | 'magazines';
  title: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  language: string;
  condition: 'new' | 'like_new' | 'excellent' | 'good' | 'fair' | 'poor';
  format?: 'hardcover' | 'paperback' | 'ebook' | 'audiobook';
  genre?: string;
  year?: number;
  pages?: number;
  platform?: string;
  media_type?: 'cd' | 'dvd' | 'bluray' | 'digital' | 'vinyl';
  region?: string;
  subtitles?: string[];
}

export interface ServicesAttributes {
  category: 'professional' | 'personal' | 'technical' | 'creative' | 'health' | 'education';
  service_type: string;
  experience_years?: number;
  certification?: string[];
  availability: 'immediate' | 'within_week' | 'within_month' | 'flexible';
  location_type: 'on_site' | 'remote' | 'hybrid';
  languages?: string[];
  portfolio_url?: string;
  references?: boolean;
  insurance?: boolean;
  warranty?: boolean;
  payment_methods?: string[];
}

// Category Attributes Union Type
export type CategoryAttributes = 
  | ElectronicsAttributes 
  | VehicleAttributes 
  | RealEstateAttributes 
  | FashionAttributes 
  | HomeGardenAttributes 
  | SportsHobbyAttributes 
  | BooksMediaAttributes 
  | ServicesAttributes; 