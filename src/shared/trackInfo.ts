import { type } from "arktype";

const parseTrackInfo = type({
    album: "string | null",
    albumId: "string | null",
    artist: "string | null",
    coverImage: "string | null",
    title: "string",
    trackId: "string | null"
});

type TrackInfo = typeof parseTrackInfo.infer;

export { parseTrackInfo, type TrackInfo };
