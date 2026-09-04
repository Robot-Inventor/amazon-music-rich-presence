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
            "dist/assets": "views/mainview/assets",
            "dist/index.html": "views/mainview/index.html"
        },
        mainProcess: "bun",
        watchIgnore: ["dist/**"],
        win: {
            bundleCEF: false
        }
    },
    runtime: {
        exitOnLastWindowClosed: false
    }
} as const satisfies ElectrobunConfig;

export default config;
