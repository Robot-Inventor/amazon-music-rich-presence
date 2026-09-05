import { style } from "@vanilla-extract/css";

const buttonStyles = style({
    ":focus-visible": {
        outline: "0.125rem solid #308286",
        outlineOffset: "0.125rem"
    },

    ":hover": {
        background: "#246366"
    },

    background: "#308286",
    borderRadius: "0.25em",
    color: "#fff",
    cursor: "pointer",
    display: "block",
    padding: "0.5em 1em"
});

export { buttonStyles };
