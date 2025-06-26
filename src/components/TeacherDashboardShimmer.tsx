"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"

const ShimmerBox = ({ className, children }: { className?: string; children?: React.ReactNode }) => (
  <div className={`relative overflow-hidden ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-60"></div>
    {children}
  </div>
)

export const TeacherDashboardShimmer = () => {
  return (
    <div className="space-y-6">
      {/* Hero Section Shimmer */}
      <ShimmerBox className="h-40 rounded-3xl bg-gray-200" />

      {/* Main Grid Shimmer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Stats Cards Shimmer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ShimmerBox className="h-24 rounded-lg bg-gray-100" />
            <ShimmerBox className="h-24 rounded-lg bg-zinc-100" />
            <ShimmerBox className="h-24 rounded-lg bg-neutral-100" />
            <ShimmerBox className="h-24 rounded-lg bg-slate-100" />
          </div>

          {/* AI Quick Actions Shimmer */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <ShimmerBox className="h-6 w-48 rounded bg-gray-200" />
              <ShimmerBox className="h-4 w-32 rounded bg-gray-100" />
            </CardHeader>
            <CardContent className="space-y-4">
              <ShimmerBox className="h-12 rounded-lg bg-zinc-200" />
              <ShimmerBox className="h-12 rounded-lg bg-neutral-200" />
              <ShimmerBox className="h-12 rounded-lg bg-slate-200" />
              <div className="pt-3 space-y-2">
                <ShimmerBox className="h-4 w-24 rounded bg-gray-100" />
                <div className="grid grid-cols-2 gap-2">
                  <ShimmerBox className="h-8 rounded bg-gray-200" />
                  <ShimmerBox className="h-8 rounded bg-zinc-100" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Chart Shimmer */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <ShimmerBox className="h-6 w-40 rounded bg-gray-200" />
            </CardHeader>
            <CardContent>
              <ShimmerBox className="h-[200px] rounded bg-neutral-100" />
            </CardContent>
          </Card>
        </div>

        {/* Middle Column */}
        <div className="space-y-6">
          {/* Recent Assignments Shimmer */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <ShimmerBox className="h-6 w-40 rounded bg-gray-200" />
                <ShimmerBox className="h-9 w-28 rounded bg-slate-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <ShimmerBox className="h-5 w-48 rounded bg-zinc-100" />
                      <ShimmerBox className="h-6 w-16 rounded-full bg-gray-200" />
                    </div>
                    <ShimmerBox className="h-4 w-32 rounded bg-neutral-100 mb-2" />
                    <div className="flex items-center justify-between">
                      <ShimmerBox className="h-4 w-24 rounded bg-gray-100" />
                      <ShimmerBox className="h-8 w-16 rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* My Classes Shimmer */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <ShimmerBox className="h-6 w-32 rounded bg-gray-200" />
                <ShimmerBox className="h-9 w-24 rounded bg-zinc-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <ShimmerBox className="h-5 w-40 rounded bg-neutral-200" />
                      <ShimmerBox className="h-5 w-16 rounded-full bg-slate-200" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <ShimmerBox className="h-4 w-20 rounded bg-gray-100" />
                      <ShimmerBox className="h-4 w-24 rounded bg-zinc-100" />
                      <ShimmerBox className="h-4 w-28 rounded bg-neutral-100" />
                    </div>
                    <ShimmerBox className="h-2 w-full rounded-full bg-gray-200" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Grade Distribution Shimmer */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <ShimmerBox className="h-6 w-36 rounded bg-gray-200" />
            </CardHeader>
            <CardContent>
              <ShimmerBox className="h-[200px] rounded bg-slate-100 mb-4" />
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShimmerBox className="w-3 h-3 rounded-full bg-zinc-200" />
                      <ShimmerBox className="h-3 w-24 rounded bg-neutral-100" />
                    </div>
                    <ShimmerBox className="h-3 w-6 rounded bg-gray-100" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Assignment Difficulty Shimmer */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <ShimmerBox className="h-6 w-44 rounded bg-gray-200" />
            </CardHeader>
            <CardContent>
              <ShimmerBox className="h-[200px] rounded bg-neutral-200 mb-4" />
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShimmerBox className="w-3 h-3 rounded-full bg-slate-200" />
                      <ShimmerBox className="h-3 w-16 rounded bg-zinc-100" />
                    </div>
                    <ShimmerBox className="h-3 w-6 rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Submissions Shimmer */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <ShimmerBox className="h-6 w-40 rounded bg-gray-200" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <ShimmerBox className="h-4 w-36 rounded bg-neutral-100" />
                      <ShimmerBox className="h-5 w-16 rounded-full bg-slate-100" />
                    </div>
                    <ShimmerBox className="h-3 w-28 rounded bg-zinc-100 mb-2" />
                    <div className="flex items-center justify-between">
                      <ShimmerBox className="h-3 w-16 rounded bg-gray-100" />
                      <ShimmerBox className="h-4 w-12 rounded bg-neutral-200" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Class Performance Section Shimmer */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <ShimmerBox className="h-6 w-52 rounded bg-gray-200" />
        </CardHeader>
        <CardContent>
          <ShimmerBox className="h-[300px] rounded bg-zinc-200" />
        </CardContent>
      </Card>

      {/* Student Performance Section Shimmer */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <ShimmerBox className="h-6 w-48 rounded bg-gray-200" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <ShimmerBox className="w-10 h-10 rounded-full bg-neutral-200" />
                  <div className="flex-1">
                    <ShimmerBox className="h-4 w-24 rounded bg-slate-100 mb-1" />
                    <ShimmerBox className="h-3 w-20 rounded bg-zinc-100" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <ShimmerBox className="h-3 w-20 rounded bg-gray-100" />
                    <ShimmerBox className="h-3 w-12 rounded bg-neutral-100" />
                  </div>
                  <div className="flex items-center justify-between">
                    <ShimmerBox className="h-3 w-24 rounded bg-slate-200" />
                    <ShimmerBox className="h-3 w-12 rounded bg-zinc-200" />
                  </div>
                  <div className="flex items-center justify-between">
                    <ShimmerBox className="h-3 w-18 rounded bg-gray-200" />
                    <ShimmerBox className="h-3 w-8 rounded bg-neutral-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assignments Requiring Attention Shimmer */}
      <Card className="border-0 shadow-lg border-amber-200">
        <CardHeader>
          <ShimmerBox className="h-6 w-56 rounded bg-gray-200" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border border-amber-200 rounded-lg p-4 bg-amber-50">
                <div className="flex items-center gap-2 mb-2">
                  <ShimmerBox className="h-4 w-4 rounded bg-amber-200" />
                  <ShimmerBox className="h-4 w-32 rounded bg-amber-100" />
                </div>
                <div className="space-y-1 mb-3">
                  <ShimmerBox className="h-3 w-24 rounded bg-amber-200" />
                  <ShimmerBox className="h-3 w-28 rounded bg-amber-100" />
                </div>
                <div className="flex items-center justify-between">
                  <ShimmerBox className="h-3 w-20 rounded bg-amber-200" />
                  <ShimmerBox className="h-8 w-16 rounded bg-amber-100" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}