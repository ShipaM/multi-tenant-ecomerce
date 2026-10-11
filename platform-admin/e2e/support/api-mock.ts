import type { Page } from "@playwright/test";
import { adminUser, currentSession, otherSession } from "./test-data";

export type ApiRequest = {
  method: string;
  path: string;
  body: unknown;
  headers: Record<string, string>;
};

export type ApiReply = { status?: number; json?: unknown };

export type ApiHandler =
  | ApiReply
  | ((req: ApiRequest) => ApiReply | Promise<ApiReply>);

// Replaces the entire backend: every request to /api/* is handled here, and nothing is sent to the network.
export class ApiMock {
  private handlers = new Map<string, ApiHandler>();
  readonly calls: ApiRequest[] = [];
  constructor(private readonly page: Page) {}
  async start() {
    // Filter by pathname, not by the "**/api/**" glob: otherwise it will also match
    // the Vite source file /src/api/auth.ts, and the app will stop loading.
    await this.page.route(
      (url) => url.pathname.startsWith("/api/"),
      async (route) => {
        const request = route.request();
        const path = new URL(request.url()).pathname.replace(/^\/api/, "");
        let body: unknown;
        try {
          body = request.postDataJSON();
        } catch {
          body = undefined;
        }
        const call: ApiRequest = {
          method: request.method(),
          path,
          body,
          headers: request.headers(),
        };
        this.calls.push(call);
        const handler = this.handlers.get(`${call.method} ${call.path}`);
        if (!handler) {
          // Fail loudly if the test forgot to mock the request.
          return route.fulfill({
            status: 501,
            json: { message: `E2E: no mock data ${call.method} ${call.path}` },
          });
        }
        const reply =
          typeof handler === "function" ? await handler(call) : handler;
        await route.fulfill({
          status: reply.status ?? 200,
          json: reply.json ?? {},
        });
      },
    );
  }

  // Default responses for an authenticated user.
  withSignedInDefaults() {
    return this.on("GET", "/auth/me", { json: adminUser }).on(
      "GET",
      "/auth/sessions",
      {
        json: [currentSession, otherSession],
      },
    );
  }
  on(method: string, path: string, handler: ApiHandler) {
    this.handlers.set(`${method} ${path}`, handler);
    return this;
  }
  callsTo(method: string, path: string) {
    return this.calls.filter((c) => c.method === method && c.path === path);
  }
}
