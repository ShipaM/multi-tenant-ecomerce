import { Spinner } from "@/components/ui/spinner";

import { cn } from "@/lib/utils";

/**
 * Fallback for the <Suspense> boundary around routes: shown while a lazy
 * page chunk is still loading.
 *
 * `fullscreen` is for the boundary outside a layout, where the surrounding
 * viewport is empty.
 */
export function RouteFallback({ fullscreen = false }: { fullscreen?: boolean }) {
  return (
    // <Spinner> already carries role/aria-label, a second one here would
    // make a screen reader announce the loading state twice.
    //
    // opacity-0 + animation-delay: the spinner fades in after 200ms, so on a
    // fast navigation the user never sees it at all.
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
