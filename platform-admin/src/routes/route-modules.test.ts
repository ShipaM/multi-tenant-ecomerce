import { describe, expect, it } from "vitest";

import { routeModules } from "./route-modules";

describe("routeModules", () => {
  it.each(Object.entries(routeModules))(
    "%s loads a page module with a default component",
    async (_key, load) => {
      const module = await load();

      expect(typeof module.default).toBe("function");
    },
  );
});
