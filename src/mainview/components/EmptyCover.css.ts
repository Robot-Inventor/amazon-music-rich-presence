import { style } from "@vanilla-extract/css";
import { vars } from "../theme.css";

const containerStyles = style({
    background: vars.color.surface,
    borderRadius: "0.5rem"
});

const iconStyles = style({
    aspectRatio: "1 / 1",
    color: vars.color.onBackgroundVariant,
    height: "100%",
    padding: "1.5rem",
    width: "100%"
});

export { containerStyles, iconStyles };
