// Separate from vite.config.ts on purpose: the app config loads the
// tanstackStart plugin (route generation, server-entry rewriting, import
// protection) and, at build, nitro. None of that is wanted — or safe — in a
// unit-test run, which only needs the React transform and the @ alias.
import { defineConfig } from "vitest/config";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [viteReact()],
  resolve: {
    alias: { "@": `${process.cwd()}/src` },
  },
  test: {
    // jsdom, not node: useDebouncedValue and anything using localStorage
    // (api-client's token store) need browser globals.
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    restoreMocks: true,
  },
});
