import { defineConfig } from "vite";
import { electrobunViteAliases } from "./.hutch/devkit/api/config/electrobun-vite.ts";
import { join } from "node:path";
import react from "@vitejs/plugin-react";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";

export default defineConfig({
    build: {
        emptyOutDir: true,
        outDir: "../../dist"
    },
    optimizeDeps: {
        include: ["react", "react-dom/client"],
        noDiscovery: true
    },
    plugins: [react({ jsxImportSource: "react" }), vanillaExtractPlugin()],
    resolve: {
        alias: electrobunViteAliases(join(process.cwd(), ".hutch", "devkit"))
    },
    root: "src/mainview",
    server: {
        port: 5173,
        strictPort: true
    }
});
