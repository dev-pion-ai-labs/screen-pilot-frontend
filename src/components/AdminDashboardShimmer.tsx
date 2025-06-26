import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const ShimmerBox = ({ className }: { className?: string }) => (
  <div
    className={`animate-pulse bg-gradient-to-r from-transparent via-gray-200 to-transparent relative overflow-hidden ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
  </div>
);

export const AdminDashboardShimmer = () => {
  const shimmerColors = [
    'bg-gray-100',
    'bg-gray-200',
    'bg-gray-300',
    'bg-zinc-100',
    'bg-zinc-200',
    'bg-neutral-100',
    'bg-neutral-200',
    'bg-slate-100',
    'bg-slate-200'
  ];

  return (
    <div className="space-y-8">
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>

      {/* Hero Section Shimmer */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-200 to-gray-300 p-8">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <ShimmerBox className="h-10 w-96 mb-2 rounded bg-gray-200" />
              <ShimmerBox className="h-6 w-80 mb-6 rounded bg-gray-100" />
              <div className="flex items-center gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <ShimmerBox className="h-5 w-5 rounded bg-zinc-100" />
                    <ShimmerBox className="h-4 w-24 rounded bg-neutral-100" />
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden lg:block">
              <ShimmerBox className="w-32 h-32 rounded-full bg-slate-100" />
            </div>
          </div>

          {/* Period Selection */}
          <div className="mt-8 flex items-center gap-3">
            <ShimmerBox className="h-4 w-20 rounded bg-gray-100" />
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[...Array(3)].map((_, i) => (
                <ShimmerBox key={i} className="h-8 w-16 mx-1 rounded bg-zinc-200" />
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
                  <ShimmerBox className={`h-4 w-20 mb-1 rounded ${shimmerColors[i % shimmerColors.length]}`} />
                  <ShimmerBox className={`h-8 w-12 mb-2 rounded ${shimmerColors[(i + 1) % shimmerColors.length]}`} />
                  <ShimmerBox className={`h-4 w-16 rounded ${shimmerColors[(i + 2) % shimmerColors.length]}`} />
                </div>
                <ShimmerBox className={`h-12 w-12 rounded-xl ${shimmerColors[(i + 3) % shimmerColors.length]}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs Navigation Shimmer */}
      <div className="space-y-6">
        <div className="grid w-full grid-cols-4 lg:w-[600px] bg-gray-100 rounded-lg p-1">
          <div className="flex items-center gap-2 bg-white rounded-md px-3 py-2 shadow-sm">
            <ShimmerBox className="h-4 w-4 rounded bg-gray-200" />
            <ShimmerBox className="h-4 w-16 rounded bg-zinc-100" />
          </div>
          <div className="flex items-center gap-2 px-3 py-2">
            <ShimmerBox className="h-4 w-4 rounded bg-neutral-100" />
            <ShimmerBox className="h-4 w-12 rounded bg-slate-100" />
          </div>
          <div className="flex items-center gap-2 px-3 py-2">
            <ShimmerBox className="h-4 w-4 rounded bg-gray-300" />
            <ShimmerBox className="h-4 w-16 rounded bg-zinc-200" />
          </div>
          <div className="flex items-center gap-2 px-3 py-2">
            <ShimmerBox className="h-4 w-4 rounded bg-neutral-200" />
            <ShimmerBox className="h-4 w-20 rounded bg-slate-200" />
          </div>
        </div>

        {/* Tab Content - Overview Only */}
        <div className="space-y-6">
          {/* System Health Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100">
                <CardContent className="p-6 text-center">
                  <ShimmerBox className={`w-12 h-12 rounded-full mx-auto mb-3 ${shimmerColors[i * 2 % shimmerColors.length]}`} />
                  <ShimmerBox className={`h-5 w-24 mx-auto mb-1 rounded ${shimmerColors[(i * 2 + 1) % shimmerColors.length]}`} />
                  <ShimmerBox className={`h-8 w-16 mx-auto mb-1 rounded ${shimmerColors[(i * 2 + 2) % shimmerColors.length]}`} />
                  <ShimmerBox className={`h-4 w-20 mx-auto rounded ${shimmerColors[(i * 2 + 3) % shimmerColors.length]}`} />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Daily Activity Chart */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShimmerBox className="h-5 w-5 rounded bg-gray-200" />
                <ShimmerBox className="h-6 w-40 rounded bg-zinc-100" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ShimmerBox className="w-full h-full rounded bg-gray-100" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};