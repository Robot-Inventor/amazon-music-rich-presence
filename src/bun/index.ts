import { AMAZON_MUSIC_LAUNCH_ERROR_MESSAGE, type AppRPC, type LaunchAmazonMusicResult } from "../shared/rpc";
import { BrowserView, BrowserWindow, Updater } from "electrobun/main";
import { join } from "node:path";

const DEV_SERVER_URL = "http://localhost:5173";

/**
 * Returns the Vite URL during development and the bundled view otherwise.
 * @returns The URL for the main view.
 */
const getMainViewUrl = async (): Promise<string> => {
    const channel = await Updater.localInfo.channel();

    if (channel === "dev") {
        try {
            await fetch(DEV_SERVER_URL, { method: "HEAD" });
            return DEV_SERVER_URL;
        } catch {
            return "views://mainview/index.html";
        }
    }

    return "views://mainview/index.html";
};

const url = await getMainViewUrl();

const getAmazonMusicExecutablePath = (): string | null => {
    if (process.platform !== "win32") {
        return null;
    }

    const localAppData = process.env["LOCALAPPDATA"];
    return localAppData ? join(localAppData, "Amazon Music", "Amazon Music.exe") : null;
};

const launchAmazonMusic = (): LaunchAmazonMusicResult => {
    const executablePath = getAmazonMusicExecutablePath();
    if (!executablePath) return { message: AMAZON_MUSIC_LAUNCH_ERROR_MESSAGE, ok: false };

    try {
        const subprocess = Bun.spawn([executablePath, "--remote-debugging-port=52856"], {
            detached: true,
            stdio: ["ignore", "ignore", "ignore"]
        });
        subprocess.unref();
        return { ok: true };
    } catch {
        return { message: AMAZON_MUSIC_LAUNCH_ERROR_MESSAGE, ok: false };
    }
};

const rpc = BrowserView.defineRPC<AppRPC>({
    handlers: {
        messages: {},
        requests: {
            launchAmazonMusic
        }
    }
});

new BrowserWindow({
    frame: {
        height: 600,
        width: 800
    },
    rpc,
    title: "Amazon Music Rich Presence",
    url
});
