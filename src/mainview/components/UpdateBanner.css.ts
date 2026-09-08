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

const updatingButtonStyles = style({
    ":disabled": {
        cursor: "wait"
    }
});

export { bannerStyles, titleStyles, updatingButtonStyles };
