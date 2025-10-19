const CATEGORIES_SERVICE_URL = process.env.NEXT_PUBLIC_CATEGORIES_SERVICE_URL || 'http://localhost:3015';

export async function getCategoryTree() {
  const response = await fetch(`${CATEGORIES_SERVICE_URL}/api/v1/categories`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }

  const data = await response.json();
  return data.data || [];
}

export async function getPopularCategories(limit = 6) {
  const response = await fetch(`${CATEGORIES_SERVICE_URL}/api/v1/categories/popular?limit=${limit}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch popular categories');
  }

  const data = await response.json();
  return data.data || [];
}

export async function getCategoryById(id: number) {
  const response = await fetch(`${CATEGORIES_SERVICE_URL}/api/v1/categories/${id}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch category');
  }

  const data = await response.json();
  return data.data;
}

