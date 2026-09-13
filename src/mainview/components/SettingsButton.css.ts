import { keyframes, style } from "@vanilla-extract/css";
import { vars } from "../theme.css";

const openButtonStyles = style({
    bottom: "0.5rem",
    left: "0.5rem",
    position: "absolute"
});

const backdropStyles = style({
    backdropFilter: "blur(0.5rem)",
    background: "rgba(0, 0, 0, 0.5)",
    inset: 0,
    position: "fixed"
});

const viewportStyles = style({
    alignItems: "center",
    display: "flex",
    inset: 0,
    justifyContent: "center",
    position: "fixed",
    zIndex: 1
});

/* oxlint-disable sort-keys */
const popupOpen = keyframes({
    "0%": {
        opacity: 0,
        transform: "scale(0.9)"
    },
    "50%": {
        opacity: 1
    },
    "100%": {
        opacity: 1,
        transform: "scale(1)"
    }
});

const popupClose = keyframes({
    "0%": {
        opacity: 1,
        transform: "scale(1)"
    },
    "50%": {
        opacity: 1
    },
    "100%": {
        opacity: 0,
        transform: "scale(0.9)"
    }
});
/* oxlint-enable sort-keys */

const popupStyles = style({
    background: vars.color.surface,
    borderRadius: "0.5rem",
    color: vars.color.onBackground,
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    maxWidth: "calc(100vw - 3rem)",
    opacity: 0,
    padding: "1rem",
    position: "relative",

    selectors: {
        "&[data-closed]": {
            animation: `${popupClose} forwards ${vars.animation.duration.fast} ease-in-out`
        },

        "&[data-open]": {
            animation: `${popupOpen} forwards ${vars.animation.duration.fast} ease-in-out`
        }
    },

    transform: "scale(0.9)",
    width: "min(90vw, 30rem)"
});

const headerStyles = style({
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "1rem"
});

const titleStyles = style({
    fontSize: "1.25rem",
    fontWeight: "bold"
});

const itemStyles = style({
    alignItems: "center",
    cursor: "pointer",
    display: "flex",
    gap: "1rem",
    justifyContent: "space-between"
});

export { openButtonStyles, backdropStyles, popupStyles, headerStyles, titleStyles, viewportStyles, itemStyles };
