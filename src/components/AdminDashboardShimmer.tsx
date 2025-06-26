import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const AdminDashboardShimmer = () => {
  return (
    <div className="space-y-8">
      {/* Hero Section Shimmer */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-200 to-gray-300 p-8 animate-pulse">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-10 w-96 mb-2 bg-white/30" />
              <Skeleton className="h-6 w-80 mb-6 bg-white/20" />
              <div className="flex items-center gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded bg-white/30" />
                    <Skeleton className="h-4 w-24 bg-white/20" />
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden lg:block">
              <Skeleton className="w-32 h-32 rounded-full bg-white/20" />
            </div>
          </div>

          {/* Period Selection */}
          <div className="mt-8 flex items-center gap-3">
            <Skeleton className="h-4 w-20 bg-white/20" />
            <div className="flex bg-white/20 rounded-lg p-1">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-16 mx-1 rounded bg-white/30" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Shimmer */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-4 w-20 mb-1 bg-gray-200" />
                  <Skeleton className="h-8 w-12 mb-2 bg-gray-300" />
                  <Skeleton className="h-4 w-16 bg-gray-200" />
                </div>
                <Skeleton className="h-12 w-12 rounded-xl bg-gray-300" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs Navigation Shimmer */}
      <div className="space-y-6">
        <div className="grid w-full grid-cols-4 lg:w-[600px] bg-gray-100 rounded-lg p-1">
          <div className="flex items-center gap-2 bg-white rounded-md px-3 py-2 shadow-sm">
            <Skeleton className="h-4 w-4 bg-gray-300" />
            <Skeleton className="h-4 w-16 bg-gray-300" />
          </div>
          <div className="flex items-center gap-2 px-3 py-2">
            <Skeleton className="h-4 w-4 bg-gray-200" />
            <Skeleton className="h-4 w-12 bg-gray-200" />
          </div>
          <div className="flex items-center gap-2 px-3 py-2">
            <Skeleton className="h-4 w-4 bg-gray-200" />
            <Skeleton className="h-4 w-16 bg-gray-200" />
          </div>
          <div className="flex items-center gap-2 px-3 py-2">
            <Skeleton className="h-4 w-4 bg-gray-200" />
            <Skeleton className="h-4 w-20 bg-gray-200" />
          </div>
        </div>

        {/* Tab Content - Overview Only */}
        <div className="space-y-6">
          {/* System Health Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100">
                <CardContent className="p-6 text-center">
                  <Skeleton className="w-12 h-12 rounded-full mx-auto mb-3 bg-gray-300" />
                  <Skeleton className="h-5 w-24 mx-auto mb-1 bg-gray-200" />
                  <Skeleton className="h-8 w-16 mx-auto mb-1 bg-gray-300" />
                  <Skeleton className="h-4 w-20 mx-auto bg-gray-200" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Daily Activity Chart */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 bg-gray-300" />
                <Skeleton className="h-6 w-40 bg-gray-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <Skeleton className="w-full h-full bg-gray-200 rounded" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};