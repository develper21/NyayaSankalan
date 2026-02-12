import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse">
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-4">
            <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-24" />
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="h-5 bg-gray-200 rounded w-40 mb-4" />
          <div className="h-48 bg-gray-100 rounded" />
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="h-5 bg-gray-200 rounded w-40 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="h-3 bg-gray-200 rounded w-32 mb-1" />
                <div className="h-4 bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cases List Skeleton */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="h-5 bg-gray-200 rounded w-40 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="flex justify-between">
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-48 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-24" />
                </div>
                <div className="h-6 bg-gray-200 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const StatCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
    <div className="h-4 bg-gray-100 rounded w-24" />
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
    <div className="h-5 bg-gray-200 rounded w-40 mb-4" />
    <div className="h-48 bg-gray-100 rounded flex items-center justify-center">
      <span className="text-gray-400 text-sm">Loading chart...</span>
    </div>
  </div>
);

export const CaseListSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    {[1, 2, 3].map((i) => (
      <div key={i} className="border rounded-lg p-4 bg-white">
        <div className="flex justify-between">
          <div className="flex-1">
            <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-48 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-24" />
          </div>
          <div className="h-6 bg-gray-200 rounded w-20" />
        </div>
      </div>
    ))}
  </div>
);
