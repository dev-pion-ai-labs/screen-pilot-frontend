import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const TeacherClassesShimmer = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="space-y-8 p-8">
        {/* Header Shimmer */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 p-8 animate-pulse">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                <Skeleton className="h-6 w-6 bg-white/30" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-8 w-32 bg-white/30" />
                <Skeleton className="h-5 w-64 bg-white/20" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 bg-white/30" />
                  <Skeleton className="h-4 w-24 bg-white/20" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Classes Grid Shimmer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card
              key={i}
              className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50 animate-pulse"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Skeleton className="h-5 w-5 bg-blue-200" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32 bg-blue-200" />
                      <Skeleton className="h-4 w-20 rounded-full bg-gray-200" />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Student count and created date */}
                  {[...Array(2)].map((_, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 bg-gray-200" />
                      <Skeleton className="h-4 w-28 bg-gray-200" />
                    </div>
                  ))}
                  
                  {/* Manage class section */}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-36 bg-gray-200" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Class Detail Dialog Shimmer (Hidden but present for completeness) */}
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center opacity-0 pointer-events-none">
          <div className="max-w-4xl max-h-[80vh] w-full mx-4 bg-white rounded-lg shadow-2xl">
            {/* Dialog Header */}
            <div className="p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Skeleton className="h-5 w-5 bg-blue-200" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48 bg-gray-200" />
                  <Skeleton className="h-4 w-32 bg-gray-200" />
                </div>
              </div>
            </div>

            {/* Dialog Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Enrolled Students Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5 bg-gray-200" />
                      <Skeleton className="h-5 w-32 bg-gray-200" />
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-8 h-8 rounded-full bg-blue-100" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-24 bg-gray-200" />
                            <Skeleton className="h-3 w-32 bg-gray-200" />
                            <Skeleton className="h-3 w-20 bg-gray-200" />
                          </div>
                        </div>
                        <Skeleton className="h-8 w-8 rounded bg-red-100" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Students Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5 bg-gray-200" />
                      <Skeleton className="h-5 w-24 bg-gray-200" />
                    </div>
                  </div>
                  
                  {/* Search Input */}
                  <div className="relative">
                    <Skeleton className="h-10 w-full bg-gray-100" />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <Skeleton className="h-4 w-4 bg-gray-200" />
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-8 h-8 rounded-full bg-green-100" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-28 bg-gray-200" />
                            <Skeleton className="h-3 w-36 bg-gray-200" />
                            <Skeleton className="h-3 w-24 bg-gray-200" />
                          </div>
                        </div>
                        <Skeleton className="h-8 w-8 rounded bg-green-100" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State Shimmer (Alternative layout) */}
        <div className="hidden flex-col items-center justify-center py-20 opacity-50">
          <div className="p-6 bg-white/50 backdrop-blur-sm rounded-full mb-6 animate-pulse">
            <Skeleton className="h-16 w-16 bg-gray-300" />
          </div>
          <Skeleton className="h-8 w-48 mb-2 bg-gray-200" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-64 bg-gray-200" />
            <Skeleton className="h-4 w-56 bg-gray-200" />
          </div>
        </div>

        {/* Floating shimmer elements for visual appeal */}
        <div className="fixed top-16 right-16 w-2 h-2 bg-blue-200 rounded-full animate-pulse opacity-40"></div>
        <div className="fixed top-32 right-32 w-3 h-3 bg-teal-200 rounded-full animate-pulse opacity-30 animation-delay-500"></div>
        <div className="fixed top-24 right-48 w-1 h-1 bg-indigo-200 rounded-full animate-pulse opacity-50 animation-delay-1000"></div>
        
        {/* Additional shimmer cards that appear/disappear to simulate dynamic loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-30">
          {[...Array(3)].map((_, i) => (
            <Card
              key={`extra-${i}`}
              className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50 animate-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Skeleton className="h-5 w-5 bg-blue-200" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-40 bg-blue-200" />
                      <Skeleton className="h-4 w-24 rounded-full bg-gray-200" />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 bg-gray-200" />
                    <Skeleton className="h-4 w-32 bg-gray-200" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 bg-gray-200" />
                    <Skeleton className="h-4 w-24 bg-gray-200" />
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32 bg-gray-200" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};