import { style } from "@vanilla-extract/css";

const containerStyles = style({
    background: "#111",
    borderRadius: "0.5rem"
});

const iconStyles = style({
    aspectRatio: "1 / 1",
    color: "#ccc",
    height: "100%",
    padding: "1.5rem",
    width: "100%"
});

export { containerStyles, iconStyles };
