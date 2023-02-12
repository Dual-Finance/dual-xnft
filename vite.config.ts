import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
// import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    define: {
      __APP_ENV__: env.APP_ENV,
    },
    plugins: [react()],
    // resolve: {
    //   alias: {
    //     path: "rollup-plugin-node-polyfills/polyfills/path",
    //   },
    // },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: "globalThis",
        },
        plugins: [
          NodeGlobalsPolyfillPlugin({ process: true, buffer: true }),
          // NodeModulesPolyfillPlugin(),
        ],
      },
    },
    // build: {
    //   rollupOptions: {
    //     plugins: [rollupNodePolyfill()],
    //   },
    // },
    server: {
      port: 19006,
    },
  };
});
