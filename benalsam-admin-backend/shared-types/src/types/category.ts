// ===========================
// CATEGORY TYPES - ID BASED SYSTEM
// ===========================

export interface Category {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  path: string;
  parent_id?: number;
  level: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  subcategories?: Category[];
  attributes?: CategoryAttribute[];
}

export interface CategoryAttribute {
  id: number;
  category_id: number;
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'multiselect' | 'select' | 'date';
  required: boolean;
  options?: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Hiyerarşik kategori path'i için
export interface CategoryPath {
  ids: number[];      // [1, 2, 3] - Hiyerarşik ID path
  names: string[];    // ['Elektronik', 'Telefon', 'Akıllı Telefon']
  path: string;       // 'Elektronik > Telefon > Akıllı Telefon'
}

// Kategori filtreleme için
export interface CategoryFilter {
  category_id?: number;
  category_path?: number[];
  include_subcategories?: boolean;
}

// Kategori oluşturma/güncelleme için
export interface CreateCategoryRequest {
  name: string;
  icon?: string;
  color?: string;
  parent_id?: number;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateCategoryRequest {
  name?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
}

// Kategori istatistikleri için
export interface CategoryStats {
  subcategoryCount: number;
  totalSubcategories: number;
  attributeCount: number;
  totalAttributes: number;
  listingCount: number;
}

// Kategori mapping için (geriye uyumluluk)
export interface CategoryMapping {
  id_to_name: Record<number, string>;    // 1 -> "Elektronik"
  name_to_id: Record<string, number>;    // "Elektronik" -> 1
  path_to_id: Record<string, number>;    // "Elektronik > Telefon" -> 2
  id_to_path: Record<number, string>;    // 2 -> "Elektronik > Telefon"
}
