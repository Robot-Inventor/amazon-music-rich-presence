import { assignVars, createGlobalTheme, createGlobalThemeContract, globalStyle } from "@vanilla-extract/css";

const vars = createGlobalThemeContract(
    {
        animation: {
            duration: {
                fast: null
            }
        },

        color: {
            background: null,
            onBackground: null,
            onBackgroundVariant: null,
            onPrimary: null,
            primary: null,
            primaryVariant: null,
            surface: null,
            surfaceContainer: null
        }
    },
    (_value, path) => path.map((segment) => segment.toLowerCase()).join("-")
);

createGlobalTheme(":root", vars, {
    animation: {
        duration: {
            fast: "0.2s"
        }
    },

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

globalStyle(":root", {
    "@media": {
        "(prefers-reduced-motion: reduce)": {
            vars: assignVars(vars.animation.duration, {
                fast: "0s"
            })
        }
    }
});

export { vars };
