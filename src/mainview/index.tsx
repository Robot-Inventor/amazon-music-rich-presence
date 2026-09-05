// eslint-disable-next-line import-x/no-unassigned-import
import "the-new-css-reset/css/reset.css";
import type { AppRPC } from "../shared/rpc";
import { Electroview } from "electrobun/view";
import { LaunchAmazonMusic } from "./components/LaunchAmazonMusic";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { mainViewStyles } from "./index.css";

const rpc = Electroview.defineRPC<AppRPC>({
    handlers: {
        messages: {},
        requests: {}
    }
});

new Electroview({ rpc });

const rootElement = document.getElementById("root");

if (!rootElement) {
    throw new Error("The React root element is missing.");
}

createRoot(rootElement).render(
    <StrictMode>
        <main className={mainViewStyles}>
            <h1>Amazon Music Rich Presence</h1>
            <LaunchAmazonMusic onLaunch={() => rpc.request.launchAmazonMusic({})} />
        </main>
    </StrictMode>
);
