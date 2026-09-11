import { Button } from "@/components/ui/button";
import { PrefetchLink } from "@/components/PrefetchLink";

const NotFoundPage = () => {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-muted-foreground text-sm font-medium">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <Button asChild variant="outline">
        <PrefetchLink to="/" prefetchModule="login">
          Go home
        </PrefetchLink>
      </Button>
    </main>
  );
};

export default NotFoundPage;
