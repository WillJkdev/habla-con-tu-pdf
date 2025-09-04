import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Skeleton */}
        <div className="text-center mb-8">
          <Skeleton className="h-10 w-64 mx-auto mb-2" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Upload Section Skeleton */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full rounded-lg" />
              </CardContent>
            </Card>

            {/* Documents List Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8" />
                      <div>
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Chat Section Skeleton */}
          <div className="xl:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 space-y-4 mb-4">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`flex ${
                        i % 2 === 0 ? "justify-end" : "justify-start"
                      }`}
                    >
                      <Skeleton
                        className={`h-16 ${
                          i % 2 === 0 ? "w-64" : "w-80"
                        } rounded-lg`}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Skeleton className="flex-1 h-10" />
                  <Skeleton className="h-10 w-20" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
