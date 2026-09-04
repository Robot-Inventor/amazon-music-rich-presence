import { defineConfig } from "vite";
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
    root: "src/mainview",
    server: {
        port: 5173,
        strictPort: true
    }
});
