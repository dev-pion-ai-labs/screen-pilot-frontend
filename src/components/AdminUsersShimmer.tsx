import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const AdminUsersShimmer = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="space-y-8 p-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-gray-300 to-gray-400 rounded-2xl animate-pulse">
                <Skeleton className="w-6 h-6 bg-white/50" />
              </div>
              <Skeleton className="h-10 w-80 bg-gradient-to-r from-gray-200 to-gray-300" />
            </div>
            <Skeleton className="h-6 w-64 bg-gray-200" />
          </div>

          <Skeleton className="h-12 w-32 rounded bg-blue-200" />
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { bg: 'from-gray-50 to-gray-100', icon: 'bg-gray-300' },
            { bg: 'from-green-50 to-green-100', icon: 'bg-green-300' },
            { bg: 'from-blue-50 to-blue-100', icon: 'bg-blue-300' },
            { bg: 'from-red-50 to-red-100', icon: 'bg-red-300' }
          ].map((style, i) => (
            <Card key={i} className={`relative overflow-hidden border-0 bg-gradient-to-br ${style.bg} shadow-xl`}>
              <div className="absolute inset-0 bg-gradient-to-br from-gray-500/10 to-gray-600/10"></div>
              <CardHeader className="relative pb-2">
                <div className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <div className={`p-2 ${style.icon} rounded-lg animate-pulse`}>
                    <Skeleton className="h-4 w-4 bg-white/50" />
                  </div>
                  <Skeleton className="h-4 w-20 bg-gray-200" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <Skeleton className="h-8 w-8 bg-gray-300" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-6 border-b border-gray-100">
            <Skeleton className="h-8 w-24 mb-6 bg-gray-200" />

            {/* Filters */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Skeleton className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 bg-gray-300" />
                  <Skeleton className="h-12 w-full pl-12 rounded bg-white/80" />
                </div>
              </div>
              <Skeleton className="w-48 h-12 rounded bg-white/80" />
            </div>
          </div>

          <div className="p-6">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-0">
              {/* Table Header */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-0">
                <div className="grid grid-cols-6 gap-4 py-4 px-4">
                  <Skeleton className="h-4 w-16 bg-gray-200" />
                  <Skeleton className="h-4 w-20 bg-gray-200" />
                  <Skeleton className="h-4 w-12 bg-gray-200" />
                  <Skeleton className="h-4 w-20 bg-gray-200" />
                  <Skeleton className="h-4 w-16 bg-gray-200" />
                  <Skeleton className="h-4 w-16 bg-gray-200" />
                </div>
              </div>

              {/* Table Body */}
              <div className="space-y-0">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="grid grid-cols-6 gap-4 py-4 px-4 border-b border-gray-100 last:border-b-0">
                    {/* Name */}
                    <Skeleton className="h-4 w-32 bg-gray-200" />
                    
                    {/* Email */}
                    <Skeleton className="h-4 w-40 bg-gray-200" />
                    
                    {/* Role Badge */}
                    <Skeleton className="h-6 w-16 rounded-full bg-blue-200" />
                    
                    {/* Semester */}
                    <Skeleton className="h-6 w-20 rounded-full bg-green-200" />
                    
                    {/* Created Date */}
                    <Skeleton className="h-4 w-20 bg-gray-200" />
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-8 rounded bg-blue-200" />
                      <Skeleton className="h-8 w-8 rounded bg-red-200" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};