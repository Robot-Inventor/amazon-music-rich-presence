import {
    AMAZON_MUSIC_LAUNCH_ERROR_MESSAGE,
    type AppRPC,
    type CurrentTrackUpdate,
    type LaunchAmazonMusicResult,
    type OpenAmazonMusicParams
} from "../shared/rpc";
import { BrowserView, BrowserWindow, PATHS, Tray, Updater, Utils } from "electrobun/main";
import { buildAmazonMusicAlbumUrl } from "../utils/amazonMusicUrl";
import { join } from "node:path";
import { setWindowsWindowIcon } from "./windowsIcon";
import { startAmazonMusicPolling } from "./amazonMusic";
import { tmpdir } from "node:os";
import { type } from "arktype";

const DEV_SERVER_URL = "http://localhost:5173";
const STARTUP_TARGET_WAIT_TIMEOUT_MS = 5_000;
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

let publishCurrentTrackToView: (update: CurrentTrackUpdate) => void = (): void => {
    throw new Error("The current track publisher is not initialized.");
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
        startAmazonMusicPolling(publishCurrentTrackToView);
        return { ok: true };
    } catch {
        return { message: AMAZON_MUSIC_LAUNCH_ERROR_MESSAGE, ok: false };
    }
};

const openAmazonMusic = ({ albumId, amazonMusicHostname, trackId }: OpenAmazonMusicParams): boolean => {
    const albumUrl = buildAmazonMusicAlbumUrl(amazonMusicHostname, albumId, trackId);
    return albumUrl ? Utils.openExternal(albumUrl) : false;
};

const rpc = BrowserView.defineRPC<AppRPC>({
    handlers: {
        messages: {},
        requests: {
            launchAmazonMusic,
            openAmazonMusic
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

const windowPointer = win.ptr;
const windowIconPath = join(PATHS.VIEWS_FOLDER, "assets", "app-icon.ico");
const windowIconSet = Boolean(windowPointer && setWindowsWindowIcon(windowPointer, windowIconPath));
if (!windowIconSet) {
    process.stderr.write(`Failed to set the Windows window icon from ${windowIconPath}\n`);
}

publishCurrentTrackToView = (update: CurrentTrackUpdate): void => {
    win.webview.rpc?.send.currentTrack(update);
};

startAmazonMusicPolling(publishCurrentTrackToView, {
    shouldLogStartupFailure: false,
    startDiscordBeforeTargetSearch: false,
    targetWaitTimeoutMs: STARTUP_TARGET_WAIT_TIMEOUT_MS
});

win.on("will-close", (event) => {
    const parsedEvent = parseWindowCloseEvent(event);
    if (parsedEvent instanceof type.errors) return;

    parsedEvent.response = { allow: false };
    win.hide();
});

const tray = new Tray({
    height: 32,
    image: "views://assets/app-icon.ico",
    template: false,
    title: "Amazon Music Rich Presence",
    width: 32
});

tray.setMenu([
    {
        action: "show-window",
        label: "Show Amazon Music Rich Presence",
        type: "normal"
    },
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
    const parsedEvent = parseTrayClickedEvent(event);
    if (parsedEvent instanceof type.errors) return;

    const { action } = parsedEvent.data;
    if (action === "show-window") win.show();
    if (action === "launch-amazon-music") launchAmazonMusic();
    if (action === "quit") Utils.quit();
});
