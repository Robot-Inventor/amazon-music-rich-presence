import { style } from "@vanilla-extract/css";
import { vars } from "./theme.css";

const mainStyles = style({
    alignItems: "center",
    background: vars.color.background,
    color: vars.color.onBackground,
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    justifyContent: "center",
    width: "100%"
});

const appNameStyles = style({
    fontSize: "1.5rem",
    fontWeight: "bold",
    textAlign: "center"
});

const launcherStyles = style({
    margin: "2rem auto"
});

export { mainStyles, appNameStyles, launcherStyles };
