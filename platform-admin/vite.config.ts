import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    port: 3002,
    strictPort: true,
  },
  plugins: [
    react(),
    // The compiler rewrites components with memo-cache branches that distort test coverage, so tests run the source as written.
    ...(process.env.VITEST
      ? []
      : [babel({ presets: [reactCompilerPreset()] })]),
    tailwindcss(),
  ],
});
