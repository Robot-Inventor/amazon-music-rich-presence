import { BrowserWindow, Updater } from "electrobun/main";

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

new BrowserWindow({
    frame: {
        height: 600,
        width: 800
    },
    title: "Amazon Music Rich Presence",
    url
});
