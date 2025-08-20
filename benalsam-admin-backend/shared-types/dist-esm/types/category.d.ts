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
export interface CategoryPath {
    ids: number[];
    names: string[];
    path: string;
}
export interface CategoryFilter {
    category_id?: number;
    category_path?: number[];
    include_subcategories?: boolean;
}
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
export interface CategoryStats {
    subcategoryCount: number;
    totalSubcategories: number;
    attributeCount: number;
    totalAttributes: number;
    listingCount: number;
}
export interface CategoryMapping {
    id_to_name: Record<number, string>;
    name_to_id: Record<string, number>;
    path_to_id: Record<string, number>;
    id_to_path: Record<number, string>;
}
//# sourceMappingURL=category.d.ts.map