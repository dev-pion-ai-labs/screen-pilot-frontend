import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const AdminAssignClassShimmer = () => {
  return (
    <div className="min-h-screen p-6">
      {/* Header + Create Button Row */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-400 rounded-xl shadow-md animate-pulse shrink-0">
            <Skeleton className="w-6 h-6 bg-white/50" />
          </div>
          <div className="flex items-baseline gap-3 min-w-0">
            <Skeleton className="h-7 w-48 bg-gradient-to-r from-gray-200 to-gray-300 shrink-0" />
            <Skeleton className="h-4 w-72 bg-gray-200" />
          </div>
        </div>
        <Skeleton className="h-10 w-44 rounded-xl bg-gray-300 shrink-0" />
      </div>

      {/* Classes Table */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 bg-gray-300" />
            <Skeleton className="h-8 w-48 bg-gray-200" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-0">
              <div className="grid grid-cols-5 gap-4 py-6 px-8">
                <Skeleton className="h-5 w-24 bg-gray-200" />
                <Skeleton className="h-5 w-20 bg-gray-200" />
                <Skeleton className="h-5 w-20 bg-gray-200" />
                <Skeleton className="h-5 w-20 bg-gray-200" />
                <Skeleton className="h-5 w-16 bg-gray-200" />
              </div>
            </div>

            {/* Table Body */}
            <div className="space-y-0">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`grid grid-cols-5 gap-4 py-6 px-8 border-b border-gray-100 last:border-b-0 ${
                  i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                }`}>
                  {/* Class Name */}
                  <Skeleton className="h-5 w-40 bg-gray-200" />
                  
                  {/* Teacher */}
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-24 rounded-full bg-gray-300" />
                  </div>
                  
                  {/* Semester */}
                  <Skeleton className="h-5 w-4 bg-gray-200" />
                  
                  {/* Students Count */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-full">
                      <Skeleton className="w-4 h-4 bg-gray-300" />
                      <Skeleton className="h-4 w-4 bg-gray-300" />
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-3">
                    <Skeleton className="h-8 w-16 rounded-xl bg-gray-200" />
                    <Skeleton className="h-8 w-18 rounded-xl bg-gray-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};