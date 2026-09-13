import { style } from "@vanilla-extract/css";
import { vars } from "../theme.css";

const buttonStyles = style({
    ":focus-visible": {
        outline: `0.125rem solid ${vars.color.primary}`,
        outlineOffset: "0.125rem"
    },

    ":hover": {
        background: `rgb(from ${vars.color.onBackground} r g b / 0.1)`
    },

    alignItems: "center",
    borderRadius: 999,
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    padding: "0.5em"
});

export { buttonStyles };
