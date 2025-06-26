import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const DashboardShimmer = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section Shimmer */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-gray-200 to-gray-300 p-6 md:p-8 shadow-2xl mb-8 animate-pulse">
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-6">
                  <Skeleton className="h-14 w-14 rounded-2xl bg-white/30" />
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-80 bg-white/30" />
                    <Skeleton className="h-6 w-64 bg-white/20" />
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-6 w-6 rounded bg-white/30" />
                        <div className="space-y-2">
                          <Skeleton className="h-6 w-12 bg-white/30" />
                          <Skeleton className="h-4 w-16 bg-white/20" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hidden lg:block">
                <Skeleton className="w-32 h-32 rounded-full bg-white/20" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards Row Shimmer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-8 w-12" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-2xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Tools and Grade Distribution Row Shimmer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* AI Tools Card */}
          <div className="col-span-1 md:col-span-1 lg:col-span-2">
            <Card className="border-0 shadow-lg h-full">
              <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-xl" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-16 ml-auto rounded-full" />
                </div>
                <Skeleton className="h-4 w-48 mt-2" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-6 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-2xl" />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-4 w-4 rounded" />
                          </div>
                          <Skeleton className="h-4 w-64" />
                        </div>
                        <Skeleton className="h-5 w-5 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grade Distribution Card */}
          <div className="col-span-1 md:col-span-1 lg:col-span-2">
            <Card className="border-0 shadow-lg h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-xl" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] mb-4 flex items-center justify-center">
                  <Skeleton className="h-40 w-40 rounded-full" />
                </div>
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-4 h-4 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-4 w-6" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* My Classes Carousel Shimmer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="col-span-1 md:col-span-2 lg:col-span-4">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-xl" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 overflow-hidden">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-80 border border-gray-100 rounded-2xl p-6 bg-white">
                      <div className="flex items-center justify-between mb-4">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                      <div className="flex items-center gap-2 mb-6">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <Skeleton className="w-full h-3 rounded-full" />
                        <div className="text-right">
                          <Skeleton className="h-5 w-12 ml-auto" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Completion Rate and Recent Submissions Row Shimmer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Completion Rate Card */}
          <div className="col-span-1 md:col-span-1 lg:col-span-2">
            <Card className="border-0 shadow-lg h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-xl" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <Skeleton className="h-40 w-40 rounded-full" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Submissions Card */}
          <div className="col-span-1 md:col-span-1 lg:col-span-2">
            <Card className="border-0 shadow-lg h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-xl" />
                  <Skeleton className="h-6 w-36" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl p-4 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-24 mb-3" />
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-6 w-12 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Weekly Activity Chart Shimmer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="col-span-1 md:col-span-2 lg:col-span-4">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-xl" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-end justify-between gap-4 px-4">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 flex-1">
                      <Skeleton 
                        className="w-full rounded-t-lg" 
                        style={{ height: `${Math.random() * 200 + 50}px` }}
                      />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Assignments and Upcoming Deadlines Shimmer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Recent Assignments */}
          <div className="col-span-1 md:col-span-2 lg:col-span-4">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-xl" />
                    <Skeleton className="h-6 w-36" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 overflow-hidden">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-80 border border-gray-100 rounded-2xl p-6 bg-white">
                      <div className="flex items-start justify-between mb-4">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                      <div className="flex items-center gap-2 mb-4">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-8 w-16 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Deadlines */}
          <div className="col-span-1 md:col-span-2 lg:col-span-4">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-xl" />
                    <Skeleton className="h-6 w-36" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="border-2 border-gray-200 rounded-2xl p-6 bg-gradient-to-br from-gray-50 to-gray-100">
                      <div className="flex items-start gap-3 mb-4">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-4 w-28" />
                        </div>
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-10 w-full rounded" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};