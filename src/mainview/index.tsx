// oxlint-disable-next-line import-x/no-unassigned-import
import "the-new-css-reset/css/reset.css";

import { MainView } from "./MainView";
import { StrictMode } from "react";
import { ToastNotifications } from "./components/ToastNotifications";
import { createRoot } from "react-dom/client";

const rootElement = document.getElementById("root");

if (!rootElement) {
    throw new Error("The React root element is missing.");
}

createRoot(rootElement).render(
    <StrictMode>
        <ToastNotifications>
            <MainView />
        </ToastNotifications>
    </StrictMode>
);
