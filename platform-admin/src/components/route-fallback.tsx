import { Spinner } from "@/components/ui/spinner";

import { cn } from "@/lib/utils";

export function RouteFallback({ fullscreen = false }: { fullscreen?: boolean }) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center",
        "animate-[route-fallback-in_150ms_ease-out_200ms_forwards] opacity-0",
        fullscreen ? "min-h-svh" : "min-h-64",
      )}
    >
      <Spinner className="text-muted-foreground size-6" />
    </div>
  );
}
