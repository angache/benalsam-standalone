'use client';

import { useEffect, useState } from 'react';
import { useListings } from '@/hooks/useListings';
import { useCategoryTree } from '@/hooks/useCategories';
import { useAuthStore } from '@/stores/authStore';

export default function TestAPIPage() {
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  
  // Test hooks
  const { data: listingsData, isLoading: listingsLoading, error: listingsError } = useListings({ limit: 5 });
  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useCategoryTree();
  const { user, loading: authLoading } = useAuthStore();

  useEffect(() => {
    setTestResults({
      listings: {
        loading: listingsLoading,
        error: listingsError?.message,
        count: listingsData?.listings?.length || 0,
        data: listingsData
      },
      categories: {
        loading: categoriesLoading,
        error: categoriesError?.message,
        count: categoriesData?.length || 0,
        data: categoriesData
      },
      auth: {
        loading: authLoading,
        user: user ? { id: user.id, email: user.email } : null
      }
    });
  }, [listingsData, listingsLoading, listingsError, categoriesData, categoriesLoading, categoriesError, user, authLoading]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">🧪 API Test Dashboard</h1>
        
        {/* Listings Test */}
        <div className="p-6 rounded-lg border border-border bg-card">
          <h2 className="text-xl font-semibold mb-4">📋 Listings API</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              {listingsLoading ? (
                <span className="text-yellow-500">Loading...</span>
              ) : listingsError ? (
                <span className="text-red-500">❌ Error</span>
              ) : (
                <span className="text-green-500">✅ Success</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Count:</span>
              <span>{testResults.listings?.count || 0} listings</span>
            </div>
            {listingsError && (
              <div className="text-red-500 text-sm mt-2">
                Error: {listingsError.message}
              </div>
            )}
            <pre className="mt-4 p-4 bg-muted rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(testResults.listings?.data, null, 2)}
            </pre>
          </div>
        </div>

        {/* Categories Test */}
        <div className="p-6 rounded-lg border border-border bg-card">
          <h2 className="text-xl font-semibold mb-4">📁 Categories API</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              {categoriesLoading ? (
                <span className="text-yellow-500">Loading...</span>
              ) : categoriesError ? (
                <span className="text-red-500">❌ Error</span>
              ) : (
                <span className="text-green-500">✅ Success</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Count:</span>
              <span>{testResults.categories?.count || 0} categories</span>
            </div>
            {categoriesError && (
              <div className="text-red-500 text-sm mt-2">
                Error: {categoriesError.message}
              </div>
            )}
            <pre className="mt-4 p-4 bg-muted rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(testResults.categories?.data, null, 2)}
            </pre>
          </div>
        </div>

        {/* Auth Test */}
        <div className="p-6 rounded-lg border border-border bg-card">
          <h2 className="text-xl font-semibold mb-4">🔐 Auth Store</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              {authLoading ? (
                <span className="text-yellow-500">Loading...</span>
              ) : user ? (
                <span className="text-green-500">✅ Authenticated</span>
              ) : (
                <span className="text-gray-500">Not authenticated</span>
              )}
            </div>
            {user && (
              <div className="flex items-center gap-2">
                <span className="font-medium">User:</span>
                <span>{user.email}</span>
              </div>
            )}
            <pre className="mt-4 p-4 bg-muted rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(testResults.auth, null, 2)}
            </pre>
          </div>
        </div>

        {/* Environment Test */}
        <div className="p-6 rounded-lg border border-border bg-card">
          <h2 className="text-xl font-semibold mb-4">⚙️ Environment Variables</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Search Service:</strong> {process.env.NEXT_PUBLIC_SEARCH_SERVICE_URL || '❌ Not set'}</div>
            <div><strong>Categories Service:</strong> {process.env.NEXT_PUBLIC_CATEGORIES_SERVICE_URL || '❌ Not set'}</div>
            <div><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ Not set'}</div>
            <div><strong>Node ENV:</strong> {process.env.NODE_ENV}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

