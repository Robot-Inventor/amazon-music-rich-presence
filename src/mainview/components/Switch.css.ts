import { style } from "@vanilla-extract/css";
import { vars } from "../theme.css";

const switchStyles = style({
    background: vars.color.surfaceContainer,
    borderRadius: 999,
    cursor: "pointer",
    display: "inline-flex",
    height: "1.5rem",
    padding: "0.125rem",
    position: "relative",

    selectors: {
        "&:focus-visible": {
            outline: `0.125rem solid ${vars.color.primary}`,
            outlineOffset: "0.125rem"
        },

        "&[data-checked]": {
            background: vars.color.primary
        }
    },

    width: "3rem"
});

const switchThumbStyles = style({
    background: vars.color.onBackground,
    borderRadius: "50%",
    display: "block",
    height: "1rem",
    left: "0.25rem",
    position: "absolute",

    selectors: {
        "[data-checked] &": {
            transform: "translate(1.5rem, -50%)"
        }
    },

    top: "50%",
    transform: "translateY(-50%)",
    transition: `transform ${vars.animation.duration.fast}`,
    width: "1rem"
});

export { switchStyles, switchThumbStyles };
