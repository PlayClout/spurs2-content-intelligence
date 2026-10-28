import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-screen flex-col">
      <div className="flex h-14 items-center gap-4 border-b border-border px-4">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="ml-auto h-6 w-40" />
      </div>
      <div className="flex min-h-0 flex-1">
        <aside className="w-[380px] shrink-0 space-y-2 border-r border-border p-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </aside>
        <main className="flex-1 space-y-4 p-4">
          <Skeleton className="h-8 w-96" />
          <Skeleton className="aspect-video w-[420px] rounded-lg" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-48 rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
          </div>
        </main>
      </div>
    </div>
  );
}
