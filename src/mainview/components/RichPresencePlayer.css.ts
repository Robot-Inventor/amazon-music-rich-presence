import { style } from "@vanilla-extract/css";

const containerStyles = style({
    background: "#222",
    borderRadius: "0.5rem",
    display: "grid",
    gap: "0 1rem",
    gridTemplateColumns: "auto minmax(0, 1fr)",
    gridTemplateRows: "auto auto auto",
    padding: "1rem",
    width: "450px"
});

const coverStyles = style({
    aspectRatio: "1 / 1",
    borderRadius: "0.5rem",
    gridColumn: "1 / 2",
    gridRow: "1 / 4",
    height: 0,
    minHeight: "100%",
    width: "auto"
});

const titleStyles = style({
    fontSize: "1.25rem",
    fontWeight: "bold",
    gridColumn: "2 / 3",
    gridRow: "1 / 2",
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
});

const artistStyles = style({
    color: "#aaa",
    gridColumn: "2 / 3",
    gridRow: "2 / 3",
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
});

const linkStyles = style({
    ":focus-visible": {
        outline: "0.125rem solid #308286",
        outlineOffset: "0.125rem"
    },

    borderRadius: "0.5rem",
    display: "block"
});

const progressStyles = style({
    alignItems: "center",
    display: "grid",
    gap: "0.5em",
    gridColumn: "2 / 3",
    gridRow: "3 / 4",
    gridTemplateColumns: "auto 1fr",
    marginTop: "1rem"
});

const progressLabelStyles = style({
    fontSize: "0.8rem"
});

const progressTrackStyles = style({
    background: "#444",
    borderRadius: "2px",
    height: "2px",
    overflow: "hidden"
});

const progressIndicatorStyles = style({
    background: "#fff",
    height: "100%"
});

export {
    coverStyles,
    titleStyles,
    containerStyles,
    linkStyles,
    artistStyles,
    progressStyles,
    progressLabelStyles,
    progressTrackStyles,
    progressIndicatorStyles
};
