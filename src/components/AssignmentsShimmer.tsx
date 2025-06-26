import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const AssignmentsShimmer = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto space-y-8 p-8">
        {/* Header Shimmer */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl mb-4 animate-pulse">
            <Skeleton className="w-8 h-8 bg-white/50" />
          </div>
          <Skeleton className="h-12 w-80 mx-auto bg-gradient-to-r from-gray-200 to-gray-300" />
          <Skeleton className="h-6 w-96 mx-auto bg-gray-200" />
        </div>

        {/* Statistics Cards Shimmer */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="relative overflow-hidden border-0 bg-white/70 backdrop-blur-sm shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100/20 to-gray-200/20 animate-pulse"></div>
              <CardHeader className="relative pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg animate-pulse">
                    <Skeleton className="h-4 w-4 bg-white/50" />
                  </div>
                  <Skeleton className="h-4 w-24 bg-gray-200" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <Skeleton className="h-8 w-16 bg-gray-200" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Card Shimmer */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl border-0 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-6 border-b border-gray-100">
            <Skeleton className="h-8 w-48 mb-6 bg-gray-200" />

            {/* Filters Shimmer */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Skeleton className="h-12 w-full rounded-md bg-white/80" />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Skeleton className="h-5 w-5 bg-gray-300" />
                  </div>
                </div>
              </div>
              <Skeleton className="w-48 h-12 rounded-md bg-white/80" />
              <Skeleton className="w-56 h-12 rounded-md bg-white/80" />
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6">
            <div className="grid gap-6">
              {/* Assignment Cards Shimmer */}
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        {/* Title and Badges Row */}
                        <div className="flex items-center gap-3 mb-3">
                          <Skeleton className="h-6 w-64 bg-gray-200" />
                          <Skeleton className="h-6 w-20 rounded-full bg-green-200" />
                          <Skeleton className="h-6 w-16 rounded-full bg-blue-200" />
                        </div>
                        
                        {/* Description */}
                        <div className="space-y-2 mb-4">
                          <Skeleton className="h-4 w-full bg-gray-200" />
                          <Skeleton className="h-4 w-3/4 bg-gray-200" />
                        </div>

                        {/* Assignment Details Row */}
                        <div className="flex items-center gap-6">
                          {[...Array(3)].map((_, j) => (
                            <div key={j} className="flex items-center gap-2">
                              <div className="p-1 bg-gradient-to-r from-gray-300 to-gray-400 rounded animate-pulse">
                                <Skeleton className="h-3 w-3 bg-white/50" />
                              </div>
                              <Skeleton className="h-4 w-20 bg-gray-200" />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 ml-6">
                        <Skeleton className="h-10 w-28 rounded-md bg-gray-200" />
                        <Skeleton className="h-10 w-32 rounded-md bg-blue-200" />
                      </div>
                    </div>

                    {/* Submission Info Shimmer (appears randomly to simulate varied states) */}
                    {Math.random() > 0.6 && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded bg-green-300" />
                            <Skeleton className="h-4 w-20 bg-green-300" />
                          </div>
                          <Skeleton className="h-4 w-32 bg-green-200" />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Assignment Detail Dialog Shimmer */}
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center opacity-0 pointer-events-none">
          <div className="max-w-4xl w-full h-[90vh] flex flex-col bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-lg mx-4">
            {/* Dialog Header */}
            <div className="border-b pb-4 p-6">
              <Skeleton className="h-8 w-96 bg-gradient-to-r from-blue-200 to-purple-200" />
            </div>

            {/* Dialog Content */}
            <div className="flex-1 overflow-y-auto py-4 px-6 space-y-6">
              {/* Assignment Description */}
              <div className="bg-gray-50/50 rounded-xl p-6 border border-gray-100">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-full bg-gray-200" />
                  <Skeleton className="h-4 w-full bg-gray-200" />
                  <Skeleton className="h-4 w-5/6 bg-gray-200" />
                  <Skeleton className="h-4 w-4/5 bg-gray-200" />
                </div>
              </div>

              {/* Due Date and Points */}
              <div className="flex justify-between items-center p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 bg-blue-200" />
                  <Skeleton className="h-4 w-32 bg-gray-200" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 bg-purple-200" />
                  <Skeleton className="h-4 w-24 bg-gray-200" />
                </div>
              </div>

              {/* Assignment Details Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="h-4 w-4 bg-blue-300" />
                    <Skeleton className="h-4 w-16 bg-blue-300" />
                  </div>
                  <Skeleton className="h-6 w-24 bg-blue-200" />
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="h-4 w-4 bg-purple-300" />
                    <Skeleton className="h-4 w-20 bg-purple-300" />
                  </div>
                  <Skeleton className="h-6 w-16 bg-purple-200" />
                </div>
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="h-4 w-4 bg-emerald-300" />
                    <Skeleton className="h-4 w-12 bg-emerald-300" />
                  </div>
                  <Skeleton className="h-6 w-20 bg-emerald-200" />
                </div>
              </div>

              {/* Submission Section */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <Skeleton className="h-5 w-5 bg-blue-300" />
                  <Skeleton className="h-6 w-32 bg-blue-300" />
                </div>

                <div className="space-y-4">
                  {/* File Upload */}
                  <div>
                    <Skeleton className="h-4 w-32 mb-2 bg-gray-300" />
                    <Skeleton className="h-10 w-full bg-blue-200" />
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <Skeleton className="h-4 w-40 mb-2 bg-gray-300" />
                    <Skeleton className="h-20 w-full bg-blue-200" />
                  </div>
                </div>
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="flex gap-3 pt-4 border-t border-gray-100 p-6">
              <Skeleton className="h-10 w-20 bg-gray-200" />
              <Skeleton className="h-10 w-36 bg-blue-200" />
            </div>
          </div>
        </div>

        {/* Floating shimmer elements for extra visual appeal */}
        <div className="fixed top-10 right-10 w-3 h-3 bg-blue-200 rounded-full animate-pulse opacity-30"></div>
        <div className="fixed top-32 right-20 w-2 h-2 bg-purple-200 rounded-full animate-pulse opacity-40 animation-delay-500"></div>
        <div className="fixed top-20 right-40 w-4 h-4 bg-cyan-200 rounded-full animate-pulse opacity-20 animation-delay-1000"></div>
      </div>
    </div>
  );
};