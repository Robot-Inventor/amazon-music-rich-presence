import { style } from "@vanilla-extract/css";
import { vars } from "../theme.css";

const bannerStyles = style({
    alignItems: "center",
    background: vars.color.surface,
    borderRadius: "0.5rem",
    display: "flex",
    gap: "1rem",
    justifyContent: "space-between",
    padding: "1rem",
    width: "450px"
});

const titleStyles = style({
    fontWeight: "bold"
});

const buttonStyles = style({
    ":disabled": {
        cursor: "wait",
        opacity: 0.6
    },

    ":focus-visible": {
        outline: `0.125rem solid ${vars.color.primary}`,
        outlineOffset: "0.125rem"
    },

    ":hover": {
        background: vars.color.surfaceContainer
    },

    borderRadius: "0.25em",
    cursor: "pointer",
    padding: "0.25rem 0.5rem"
});

export { bannerStyles, buttonStyles, titleStyles };
