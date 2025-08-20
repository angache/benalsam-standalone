import React from 'react';

const SkeletonCard = () => (
  <div className="animate-pulse bg-card rounded-lg border shadow-sm overflow-hidden">
    <div className="bg-muted h-48 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted/80"></div>
    </div>
    <div className="p-4 space-y-3">
      <div className="h-4 bg-muted rounded w-3/4"></div>
      <div className="h-3 bg-muted rounded w-1/2"></div>
      <div className="h-3 bg-muted rounded w-2/3"></div>
      <div className="flex justify-between items-center pt-2">
        <div className="h-6 bg-muted rounded w-16"></div>
        <div className="h-6 bg-muted rounded w-20"></div>
      </div>
    </div>
  </div>
);

const SkeletonHomePage = () => (
  <div className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-6">
    <div className="flex flex-col lg:flex-row lg:gap-8">
      {/* Sidebar Skeleton */}
      <aside className="hidden lg:block w-full lg:w-1/4 xl:w-1/5 2xl:w-1/6 mb-6 lg:mb-0">
        <div className="p-4 rounded-lg bg-card border shadow-sm animate-pulse">
          <div className="h-6 bg-muted rounded w-24 mb-4"></div>
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between py-2 px-3">
                <div className="h-4 bg-muted rounded w-20"></div>
                <div className="h-5 bg-muted rounded w-8"></div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="w-full lg:w-3/4 xl:w-4/5 2xl:w-5/6">
        {/* Search Bar Skeleton */}
        <div className="mb-6">
          <div className="h-12 bg-muted rounded-lg animate-pulse"></div>
        </div>

        {/* Mobile Category Skeleton */}
        <div className="lg:hidden mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-8 bg-muted rounded-full w-20 flex-shrink-0 animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 xl:gap-5 2xl:gap-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </main>
    </div>
  </div>
);

export default SkeletonHomePage;
