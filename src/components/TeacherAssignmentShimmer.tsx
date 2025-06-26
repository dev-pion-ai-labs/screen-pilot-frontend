import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const TeacherAssignmentShimmer = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto space-y-8 p-8">
        {/* Header Shimmer */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-2xl mb-4 animate-pulse">
            <Skeleton className="w-8 h-8 bg-white/50" />
          </div>
          <Skeleton className="h-12 w-96 mx-auto bg-gradient-to-r from-gray-200 to-gray-300" />
          <Skeleton className="h-6 w-80 mx-auto bg-gray-200" />
        </div>

        {/* Main Content Card Shimmer */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl border-0 overflow-hidden">
          {/* Tabs Header */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4">
            <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-1 w-fit">
              <div className="flex gap-1">
                <Skeleton className="h-10 w-44 rounded-xl bg-blue-200" />
                <Skeleton className="h-10 w-40 rounded-xl bg-gray-200" />
              </div>
            </div>
          </div>

          {/* Tab Content Area */}
          <div className="p-6">
            {/* Filters Section Shimmer */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-0 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-gradient-to-r from-gray-300 to-gray-400 rounded-lg animate-pulse">
                  <Skeleton className="h-4 w-4 bg-white/50" />
                </div>
                <Skeleton className="h-5 w-32 bg-gray-200" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-16 mb-2 bg-gray-200" />
                    <Skeleton className="h-12 w-full rounded-xl bg-gray-100" />
                  </div>
                ))}
              </div>
            </div>

            {/* Assignment Cards Grid Shimmer */}
            <div className="grid gap-6">
              {[...Array(4)].map((_, i) => (
                <Card
                  key={i}
                  className="border-0 bg-white/80 backdrop-blur-sm shadow-lg animate-pulse"
                >
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-6 w-72 bg-gray-200" />
                        <Skeleton className="h-4 w-48 bg-gray-200" />
                      </div>
                      <div className="flex gap-3">
                        <Skeleton className="h-6 w-16 rounded-full bg-purple-200" />
                        <Skeleton className="h-6 w-20 rounded-full bg-green-200" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-4 gap-6">
                      {/* Stats Cards */}
                      {[
                        { bg: 'from-blue-50 to-cyan-50', icon: 'bg-blue-200' },
                        { bg: 'from-green-50 to-emerald-50', icon: 'bg-green-200' },
                        { bg: 'from-purple-50 to-pink-50', icon: 'bg-purple-200' },
                        { bg: 'from-orange-50 to-amber-50', icon: 'bg-orange-200' }
                      ].map((style, j) => (
                        <div key={j} className={`flex items-center gap-3 p-3 bg-gradient-to-r ${style.bg} rounded-xl`}>
                          <div className={`p-2 ${style.icon} rounded-lg animate-pulse`}>
                            <Skeleton className="h-4 w-4 bg-white/50" />
                          </div>
                          <div className="space-y-1">
                            <Skeleton className="h-3 w-12 bg-gray-200" />
                            <Skeleton className="h-4 w-8 bg-gray-200" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Submissions Table Shimmer (Alternative view) */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl border-0 overflow-hidden opacity-50">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-100">
            <Skeleton className="h-8 w-48 mb-2 bg-gray-200" />
            <Skeleton className="h-4 w-64 bg-gray-200" />
          </div>

          {/* Table Content */}
          <div className="p-6">
            {/* Filters */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 mb-4 border border-purple-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-gradient-to-r from-gray-300 to-gray-400 rounded-lg animate-pulse">
                  <Skeleton className="h-3.5 w-3.5 bg-white/50" />
                </div>
                <Skeleton className="h-4 w-32 bg-gray-200" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-20 mb-2 bg-gray-200" />
                    <Skeleton className="h-10 w-full rounded-lg bg-gray-100" />
                  </div>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* Table Header */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-lg p-4">
                  <div className="grid grid-cols-7 gap-4">
                    {['Student', 'Assignment', 'Submitted', 'AI Grade', 'Teacher Grade', 'Status', 'Actions'].map((_, i) => (
                      <Skeleton key={i} className="h-4 w-20 bg-gray-200" />
                    ))}
                  </div>
                </div>

                {/* Table Rows */}
                <div className="space-y-2 p-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="grid grid-cols-7 gap-4 py-3 hover:bg-purple-50/50 rounded-lg">
                      <Skeleton className="h-4 w-24 bg-gray-200" />
                      <Skeleton className="h-4 w-32 bg-gray-200" />
                      <Skeleton className="h-4 w-20 bg-gray-200" />
                      <Skeleton className="h-4 w-12 bg-gray-200" />
                      <Skeleton className="h-4 w-16 bg-gray-200" />
                      <Skeleton className="h-6 w-20 rounded-full bg-blue-200" />
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-8 rounded bg-gray-200" />
                        <Skeleton className="h-8 w-8 rounded bg-purple-200" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submission Review Modal Shimmer (Hidden) */}
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center opacity-0 pointer-events-none">
          <div className="max-w-6xl w-full max-h-[90vh] flex flex-col bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-lg mx-4">
            {/* Modal Header */}
            <div className="p-6 border-b">
              <Skeleton className="h-8 w-96 mb-2 bg-gradient-to-r from-purple-200 to-pink-200" />
              <Skeleton className="h-4 w-80 bg-gray-200" />
            </div>

            {/* Modal Content */}
            <div className="flex-1 min-h-0 overflow-y-auto py-6 px-6 space-y-6">
              {/* Overall Score Section */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-gray-300 to-gray-400 rounded-xl animate-pulse">
                      <Skeleton className="w-6 h-6 bg-white/50" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-48 bg-blue-200" />
                      <Skeleton className="h-4 w-36 bg-blue-200" />
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <Skeleton className="h-10 w-16 bg-blue-200" />
                    <Skeleton className="h-6 w-20 rounded-full bg-blue-200" />
                  </div>
                </div>

                {/* Progress Bars */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-24 bg-blue-200" />
                        <Skeleton className="h-4 w-8 bg-blue-200" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full bg-blue-200" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback Sections */}
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-gradient-to-r from-gray-300 to-gray-400 rounded-xl animate-pulse">
                      <Skeleton className="w-5 h-5 bg-white/50" />
                    </div>
                    <Skeleton className="h-5 w-32 bg-emerald-200" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full bg-emerald-200" />
                    <Skeleton className="h-4 w-5/6 bg-emerald-200" />
                    <Skeleton className="h-4 w-4/5 bg-emerald-200" />
                  </div>
                </div>
              ))}

              {/* Teacher Grading Section */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-r from-gray-300 to-gray-400 rounded-xl animate-pulse">
                    <Skeleton className="w-5 h-5 bg-white/50" />
                  </div>
                  <Skeleton className="h-5 w-36 bg-purple-200" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16 bg-purple-200" />
                    <Skeleton className="h-10 w-full rounded-lg bg-purple-100" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20 bg-purple-200" />
                    <Skeleton className="h-20 w-full rounded-lg bg-purple-100" />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t flex justify-end gap-4">
              <Skeleton className="h-10 w-20 rounded bg-gray-200" />
              <Skeleton className="h-10 w-28 rounded bg-purple-200" />
            </div>
          </div>
        </div>

        {/* Floating shimmer elements */}
        <div className="fixed top-20 right-20 w-2 h-2 bg-blue-200 rounded-full animate-pulse opacity-40"></div>
        <div className="fixed top-40 right-32 w-3 h-3 bg-purple-200 rounded-full animate-pulse opacity-30 animation-delay-500"></div>
        <div className="fixed top-60 right-16 w-1 h-1 bg-pink-200 rounded-full animate-pulse opacity-50 animation-delay-1000"></div>
      </div>
    </div>
  );
};