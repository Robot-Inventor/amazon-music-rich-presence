import { style } from "@vanilla-extract/css";

const appNameStyles = style({
    fontSize: "1.5rem",
    fontWeight: "bold",
    textAlign: "center"
});

const launcherStyles = style({
    margin: "2rem auto"
});

export { appNameStyles, launcherStyles };
