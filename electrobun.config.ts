import type { ElectrobunConfig } from "electrobun";
import packageJson from "./package.json";

const config = {
    app: {
        name: "Amazon Music Rich Presence",
        identifier: "io.roboin.amazon-music-rich-presence",
        version: packageJson.version
    },
    runtime: {
        exitOnLastWindowClosed: false
    },

    build: {
        mainProcess: "bun",
        bun: {
            entrypoint: "src/bun/index.ts"
        },
        views: {
            mainview: {
                entrypoint: "src/mainview/index.ts"
            }
        },
        copy: {
            // "src/mainview/index.html": "views/mainview/index.html",
            // "src/mainview/index.css": "views/mainview/index.css",
            // "assets/tray.png": "views/assets/tray.png"
        },
        win: {
            // icon: "assets/icon.ico",
            bundleCEF: false
        }
    }
} as const satisfies ElectrobunConfig;

export default config;
