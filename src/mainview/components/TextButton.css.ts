import { style } from "@vanilla-extract/css";
import { vars } from "../theme.css";

const textButtonStyles = style({
    ":disabled": {
        opacity: 0.6
    },

    ":focus-visible": {
        outline: `0.125rem solid ${vars.color.primary}`
    },

    background: vars.color.surfaceContainer,
    borderRadius: "0.25rem",
    cursor: "pointer",
    padding: "0.25rem 0.5rem"
});

export { textButtonStyles };
