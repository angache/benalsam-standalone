import React from 'react';

const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="bg-gray-200 h-48 rounded-t-lg"></div>
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      <div className="flex justify-between items-center pt-2">
        <div className="h-6 bg-gray-200 rounded w-16"></div>
        <div className="h-6 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  </div>
);

const SkeletonHomePage = () => (
  <div className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-6">
    {/* Search Bar Skeleton */}
    <div className="mb-6">
      <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
    </div>

    {/* Filters Skeleton */}
    <div className="mb-6 flex gap-4">
      <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
      <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
      <div className="h-10 bg-gray-200 rounded w-20 animate-pulse"></div>
    </div>

    {/* Grid Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 xl:gap-5 2xl:gap-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border">
          <SkeletonCard />
        </div>
      ))}
    </div>
  </div>
);

export default SkeletonHomePage;
