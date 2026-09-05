import { AMAZON_MUSIC_LAUNCH_ERROR_MESSAGE, type AppRPC, type LaunchAmazonMusicResult } from "../shared/rpc";
import { BrowserView, BrowserWindow, Tray, Updater, Utils } from "electrobun/main";
import { join } from "node:path";
import { startAmazonMusicPolling } from "./amazonMusic";
import { tmpdir } from "node:os";
import { type } from "arktype";

const DEV_SERVER_URL = "http://localhost:5173";
const parseTrayClickedEvent = type({ data: { action: "string" } });
const parseWindowCloseEvent = type({ response: "unknown" });

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
            cwd: tmpdir(),
            detached: true,
            stdio: ["ignore", "ignore", "ignore"]
        });
        subprocess.unref();
        startAmazonMusicPolling();
        return { ok: true };
    } catch {
        return { message: AMAZON_MUSIC_LAUNCH_ERROR_MESSAGE, ok: false };
    }
};

const getTrayAction = (event: unknown): string | null => {
    const parsedEvent = parseTrayClickedEvent(event);
    return parsedEvent instanceof type.errors ? null : parsedEvent.data.action;
};

const rpc = BrowserView.defineRPC<AppRPC>({
    handlers: {
        messages: {},
        requests: {
            launchAmazonMusic
        }
    }
});

const win = new BrowserWindow({
    frame: {
        height: 600,
        width: 800
    },
    rpc,
    title: "Amazon Music Rich Presence",
    url
});

win.on("will-close", (event) => {
    const parsedEvent = parseWindowCloseEvent(event);
    if (parsedEvent instanceof type.errors) return;

    parsedEvent.response = { allow: false };
    win.hide();
});

const tray = new Tray({ title: "Amazon Music Rich Presence" });

tray.setMenu([
    {
        action: "launch-amazon-music",
        label: "Launch Amazon Music",
        type: "normal"
    },
    { type: "separator" },
    {
        action: "quit",
        label: "Quit",
        type: "normal"
    }
]);

tray.on("tray-clicked", (event) => {
    const action = getTrayAction(event);
    if (action === "launch-amazon-music") launchAmazonMusic();
    if (action === "quit") Utils.quit();
});
