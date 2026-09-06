import { Button } from "@/components/ui/button";
import { PrefetchLink } from "@/components/prefetch-link";

const NotFoundPage = () => {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-muted-foreground text-sm font-medium">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <Button asChild variant="outline">
        {/* "/" redirects to /auth/login, so that is the chunk we warm up */}
        <PrefetchLink to="/" prefetchModule="login">
          Go home
        </PrefetchLink>
      </Button>
    </div>
  );
};

export default NotFoundPage;
