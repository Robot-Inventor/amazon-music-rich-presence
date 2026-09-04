import { StrictMode } from "react";
import { appShell } from "./styles.css";
import { createRoot } from "react-dom/client";

const rootElement = document.getElementById("root");

if (!rootElement) {
    throw new Error("The React root element is missing.");
}

createRoot(rootElement).render(
    <StrictMode>
        <div className={appShell} />
    </StrictMode>
);
