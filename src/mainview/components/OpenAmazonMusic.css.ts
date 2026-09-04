import { style } from "@vanilla-extract/css";

const buttonStyles = style({
    ":focus-visible": {
        outline: "0.125rem solid #fff",
        outlineOffset: "0.125rem"
    },

    background: "#308286",
    borderRadius: "0.5em",
    color: "#fff",
    cursor: "pointer",
    padding: "0.5em 1em"
});

export { buttonStyles };
