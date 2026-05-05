import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const AdminUsersShimmer = () => {
  const ShimmerBox = ({ className }: { className?: string }) => (
    <div className={`relative overflow-hidden rounded ${className || ''}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200 to-transparent animate-pulse" />
      <div className="absolute inset-0 -translate-x-full animate-pulse bg-gradient-to-r from-transparent via-white/60 to-transparent" style={{
        animation: 'shimmer 2s infinite'
      }} />
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes shimmer {
            100% {
              transform: translateX(100%);
            }
          }
        `
      }} />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="space-y-8 p-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <ShimmerBox className="w-12 h-12 rounded-2xl bg-gray-200" />
                <ShimmerBox className="h-10 w-80 rounded bg-gray-200" />
              </div>
              <ShimmerBox className="h-6 w-64 rounded bg-neutral-100" />
            </div>

            <ShimmerBox className="h-12 w-32 rounded bg-slate-100" />
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { bg: 'from-gray-50 to-gray-100', shimmer: 'bg-gray-100' },
              { bg: 'from-green-50 to-green-100', shimmer: 'bg-zinc-100' },
              { bg: 'from-blue-50 to-blue-100', shimmer: 'bg-slate-100' },
              { bg: 'from-red-50 to-red-100', shimmer: 'bg-neutral-100' }
            ].map((style, i) => (
              <Card key={i} className={`relative overflow-hidden border-0 bg-gradient-to-br ${style.bg} shadow-xl`}>
                <div className="absolute inset-0 bg-gradient-to-br from-gray-500/10 to-gray-600/10"></div>
                <CardHeader className="relative pb-2">
                  <div className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <ShimmerBox className={`w-8 h-8 rounded-lg ${style.shimmer}`} />
                    <ShimmerBox className={`h-4 w-20 rounded ${style.shimmer}`} />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <ShimmerBox className={`h-8 w-8 rounded ${style.shimmer}`} />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-6 border-b border-gray-100">
              <ShimmerBox className="h-8 w-24 mb-6 rounded bg-gray-200" />

              {/* Filters */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <ShimmerBox className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 rounded bg-gray-300" />
                    <ShimmerBox className="h-12 w-full rounded bg-white" />
                  </div>
                </div>
                <ShimmerBox className="w-48 h-12 rounded bg-white" />
              </div>
            </div>

            <div className="p-6">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-0">
                {/* Table Header */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-0">
                  <div className="grid grid-cols-7 gap-4 py-4 px-4">
                    <ShimmerBox className="h-4 w-16 rounded bg-zinc-200" />
                    <ShimmerBox className="h-4 w-20 rounded bg-neutral-200" />
                    <ShimmerBox className="h-4 w-12 rounded bg-slate-200" />
                    <ShimmerBox className="h-4 w-20 rounded bg-gray-200" />
                    <ShimmerBox className="h-4 w-16 rounded bg-indigo-100" />
                    <ShimmerBox className="h-4 w-16 rounded bg-gray-300" />
                    <ShimmerBox className="h-4 w-16 rounded bg-zinc-100" />
                  </div>
                </div>

                {/* Table Body */}
                <div className="space-y-0">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="grid grid-cols-7 gap-4 py-4 px-4 border-b border-gray-100 last:border-b-0">
                      {/* Name */}
                      <ShimmerBox className="h-4 w-32 rounded bg-gray-200" />

                      {/* Email */}
                      <ShimmerBox className="h-4 w-40 rounded bg-neutral-100" />

                      {/* Role Badge */}
                      <ShimmerBox className="h-6 w-16 rounded-full bg-slate-100" />

                      {/* Semester */}
                      <ShimmerBox className="h-6 w-20 rounded-full bg-zinc-200" />

                      {/* Program */}
                      <ShimmerBox className="h-6 w-12 rounded-full bg-indigo-100" />

                      {/* Created Date */}
                      <ShimmerBox className="h-4 w-20 rounded bg-gray-100" />

                      {/* Actions */}
                      <div className="flex gap-2">
                        <ShimmerBox className="h-8 w-8 rounded bg-slate-200" />
                        <ShimmerBox className="h-8 w-8 rounded bg-neutral-200" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};