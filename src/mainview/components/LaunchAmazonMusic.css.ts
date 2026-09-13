import { style } from "@vanilla-extract/css";
import { vars } from "../theme.css";

const buttonStyles = style({
    ":focus-visible": {
        outline: `0.125rem solid ${vars.color.primary}`,
        outlineOffset: "0.125rem"
    },

    ":hover": {
        background: vars.color.primaryVariant
    },

    alignItems: "center",
    background: vars.color.primary,
    borderRadius: "0.25em",
    color: vars.color.onPrimary,
    cursor: "pointer",
    display: "flex",
    gap: "0.5em",
    padding: "0.5em 1em"
});

export { buttonStyles };
