import { type SetActivity, StatusDisplayType } from "@xhayper/discord-rpc";
import type { PlaybackTimestamps } from "../shared/playback";
import type { TrackInfo } from "./trackInfo";
import { buildAmazonMusicAlbumUrl } from "../utils/amazonMusicUrl";

const DISCORD_ACTIVITY_TYPE_LISTENING = 2;
const DISCORD_BUTTON_LABEL = "Listen on Amazon Music";

const getPresenceKey = (trackInfo: TrackInfo | null, playbackTimestamps: PlaybackTimestamps | null): string =>
    JSON.stringify({ playbackTimestamps, trackInfo });

const createDiscordActivity = (trackInfo: TrackInfo, playbackTimestamps: PlaybackTimestamps | null): SetActivity => {
    const amazonMusicUrl =
        trackInfo.albumId && trackInfo.trackId ? buildAmazonMusicAlbumUrl(trackInfo.albumId, trackInfo.trackId) : null;

    return {
        details: trackInfo.title,
        ...(trackInfo.album ? { largeImageText: trackInfo.album } : {}),
        ...(trackInfo.coverImage ? { largeImageKey: trackInfo.coverImage } : {}),
        ...(trackInfo.artist ? { state: trackInfo.artist } : {}),
        ...(amazonMusicUrl
            ? {
                  buttons: [{ label: DISCORD_BUTTON_LABEL, url: amazonMusicUrl }],
                  largeImageUrl: amazonMusicUrl
              }
            : {}),
        ...(playbackTimestamps
            ? {
                  endTimestamp: playbackTimestamps.endTimestamp,
                  startTimestamp: playbackTimestamps.startTimestamp
              }
            : {}),
        statusDisplayType: StatusDisplayType.DETAILS,
        type: DISCORD_ACTIVITY_TYPE_LISTENING
    };
};

export { createDiscordActivity, getPresenceKey };
