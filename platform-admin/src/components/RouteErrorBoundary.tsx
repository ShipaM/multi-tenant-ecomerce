import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link, useLocation } from "react-router";

import { Button } from "@/components/ui/button";

const CHUNK_ERROR_RE =
  /dynamically imported module|Importing a module script failed|Loading chunk/i;

let vitePreloadFailed = false;
if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", () => {
    vitePreloadFailed = true;
  });
}

function consumeChunkErrorFlag(error: Error): boolean {
  const isChunkError = vitePreloadFailed || CHUNK_ERROR_RE.test(error.message);
  vitePreloadFailed = false;
  return isChunkError;
}

type Props = { children: ReactNode; resetKey: string };
type State = { error: Error | null; isChunkError: boolean };

class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, isChunkError: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ isChunkError: consumeChunkErrorFlag(error) });
    console.error("Route error:", error, info.componentStack);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null, isChunkError: false });
    }
  }

  render() {
    const { error, isChunkError } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isChunkError ? "A new version is available" : "Something went wrong"}
        </h1>
        <p className="text-muted-foreground max-w-md text-sm">
          {isChunkError
            ? "The app was updated while this tab was open. Reload to continue."
            : "The page failed to render. Try reloading or go back home."}
        </p>
        {import.meta.env.DEV ? (
          <pre className="text-muted-foreground max-w-xl overflow-x-auto text-left text-xs">
            {error.message}
          </pre>
        ) : null}
        <div className="flex gap-2">
          <Button onClick={() => window.location.reload()}>Reload</Button>
          <Button asChild variant="outline">
            <Link to="/">Go home</Link>
          </Button>
        </div>
      </div>
    );
  }
}

export const RouteErrorBoundary = ({ children }: { children: ReactNode }) => {
  const { key } = useLocation();
  return <ErrorBoundary resetKey={key}>{children}</ErrorBoundary>;
};
