import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link, useLocation } from "react-router";

import { Button } from "@/components/ui/button";

/**
 * Browsers word a failed dynamic import differently:
 * Chrome — "Failed to fetch dynamically imported module",
 * Firefox — "error loading dynamically imported module",
 * Safari — "Importing a module script failed".
 * The regex lives in module scope so it is not rebuilt on every render.
 */
const CHUNK_ERROR_RE =
  /dynamically imported module|Importing a module script failed|Loading chunk/i;

// Vite dispatches this event when it fails to load a chunk (in production).
// A more reliable signal than parsing the error message.
let vitePreloadFailed = false;
if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", () => {
    vitePreloadFailed = true;
  });
}

/**
 * Reads and RESETS the flag: otherwise a single failed speculative load
 * (a hover prefetch, say) would stick for the whole lifetime of the tab and
 * every later error would be reported as "a new version was released".
 */
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
    // Classify here rather than in render(): reading mutable module state
    // during render is an impurity that StrictMode and the React Compiler are
    // free to run twice.
    this.setState({ isChunkError: consumeChunkErrorFlag(error) });
    console.error("Route error:", error, info.componentStack);
  }

  componentDidUpdate(prevProps: Props) {
    // Clear the error on a route change, otherwise one page that threw keeps
    // the error screen up until the tab is reloaded.
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
        {/* Error details in dev only — in production this leaks internals. */}
        {import.meta.env.DEV ? (
          <pre className="text-muted-foreground max-w-xl overflow-x-auto text-left text-xs">
            {error.message}
          </pre>
        ) : null}
        <div className="flex gap-2">
          <Button onClick={() => window.location.reload()}>Reload</Button>
          {/* "Go home" is always shown: a reload helps with a chunk error
              too, but the user must not be locked into a single button. */}
          <Button asChild variant="outline">
            <Link to="/">Go home</Link>
          </Button>
        </div>
      </div>
    );
  }
}

/**
 * In declarative mode (<BrowserRouter> + <Routes>) routes have no
 * `errorElement` — that only exists on data routers. So render errors and
 * failed lazy-chunk loads are caught by a plain React error boundary.
 */
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  // location.key, not pathname: react-router hands out a new key on every
  // push/replace, including a navigation to the same path. With pathname the
  // "Go home" button would not clear an error that happened on "/".
  const { key } = useLocation();
  return <ErrorBoundary resetKey={key}>{children}</ErrorBoundary>;
}
