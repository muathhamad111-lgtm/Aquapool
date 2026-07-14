// Standard TanStack Start + React + Tailwind Vite config.
// (Previously this wrapped @lovable.dev/vite-tanstack-config; that dependency has
// been removed. The plugins/behaviour below reproduce what the wrapper set up:
// tailwindcss, tsConfigPaths, tanstackStart, nitro node-server build, viteReact,
// the @ path alias, React/TanStack dedupe, and the Lightning CSS transformer.)
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";

export default defineConfig(({ command }) => {
  const plugins = [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
      // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR
      // error wrapper). nitro/vite builds from this.
      server: { entry: "server" },
    }),
  ];

  // Nitro is a build-only plugin. Self-hosted deploy target: the node-server
  // preset ships the standalone server (`node .output/server/index.mjs`) our
  // systemd units run, with static-asset serving — the cloudflare preset would
  // 404 every /assets/* request when run outside wrangler.
  if (command === "build") {
    plugins.push(nitro({ preset: "node-server" }));
  }

  plugins.push(viteReact());

  return {
    // Vite uses PostCSS in dev and Lightning CSS at build by default; running
    // Lightning CSS in both keeps the dev preview honest with the built output.
    css: { transformer: "lightningcss" as const },
    resolve: {
      alias: { "@": `${process.cwd()}/src` },
      // Avoid duplicate React/TanStack copies breaking hydration.
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
    },
    server: { host: "::", port: 8080 },
    plugins,
  };
});
