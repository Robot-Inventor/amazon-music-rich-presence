import type { ElectrobunConfig } from "electrobun";
import packageJson from "./package.json";

const config = {
    app: {
        identifier: "io.roboin.amazon-music-rich-presence",
        name: "Amazon Music Rich Presence",
        version: packageJson.version
    },
    build: {
        bun: {
            entrypoint: "src/bun/index.ts"
        },
        copy: {
            "assets/app-icon.ico": "views/assets/app-icon.ico",
            "dist/assets": "views/mainview/assets",
            "dist/index.html": "views/mainview/index.html"
        },
        mainProcess: "bun",
        watchIgnore: ["dist/**"],
        win: {
            bundleCEF: false,
            icon: "assets/app-icon.ico"
        }
    },
    release: {
        baseUrl: "https://github.com/Robot-Inventor/amazon-music-rich-presence/releases/download/updates",
        generatePatch: true
    },
    runtime: {
        exitOnLastWindowClosed: false
    }
} as const satisfies ElectrobunConfig;

export default config;
