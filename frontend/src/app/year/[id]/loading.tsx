import { Skeleton } from "@/components/ui/skeleton";

export default function YearLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-12 w-48" />
      <Skeleton className="h-24 w-full" />
      <div className="space-y-4 mt-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
