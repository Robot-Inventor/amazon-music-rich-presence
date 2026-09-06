import { createTheme } from "@vanilla-extract/css";

const [themeClass, vars] = createTheme({
    color: {
        background: "#0a0a0c",
        onBackground: "#d4d5d8",
        onBackgroundVariant: "#727277",
        onPrimary: "#ffffff",
        primary: "#308286",
        primaryVariant: "#246366",
        surface: "#17181b",
        surfaceContainer: "#242427"
    }
});

export { themeClass, vars };
