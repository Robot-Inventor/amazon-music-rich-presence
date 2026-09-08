import { style } from "@vanilla-extract/css";
import { vars } from "../theme.css";

const toastViewportStyles = style({
    bottom: "1rem",
    color: vars.color.onBackground,
    display: "flex",
    flexDirection: "column-reverse",
    gap: "0.5rem",
    position: "fixed",
    right: "1rem",
    width: "min(24rem, calc(100vw - 2rem))",
    zIndex: 1000
});

const toastStyles = style({
    ":focus-visible": {
        outline: "0.125rem solid #308286"
    },

    background: vars.color.surface,
    borderRadius: "0.5rem",
    boxShadow: "0 0.5rem 1.5rem rgb(0 0 0 / 30%)",
    padding: "1rem",

    selectors: {
        "&[data-ending-style]": {
            opacity: 0,
            transform: "translateX(0.5rem)"
        },
        "&[data-limited]": {
            display: "none"
        },
        "&[data-starting-style]": {
            opacity: 0,
            transform: "translateX(0.5rem)"
        }
    },

    transition: "opacity 0.2s, transform 0.2s"
});

const toastContentStyles = style({
    alignItems: "center",
    display: "grid",
    gap: "0 1rem",
    gridTemplateColumns: "1fr auto",
    gridTemplateRows: "auto auto",
    justifyContent: "space-between"
});

const toastTitleStyles = style({
    fontWeight: "bold",
    gridColumn: "1 / 2",
    gridRow: "1 / 2"
});

const toastDescriptionStyles = style({
    color: vars.color.onBackgroundVariant,
    gridColumn: "1 / 2",
    gridRow: "2 / 3"
});

const toastCloseStyles = style({
    gridColumn: "2 / 3",
    gridRow: "1 / 3"
});

export {
    toastViewportStyles,
    toastStyles,
    toastContentStyles,
    toastTitleStyles,
    toastDescriptionStyles,
    toastCloseStyles
};
