import { type SetActivity, StatusDisplayType } from "@xhayper/discord-rpc";
import type { PlaybackTimestamps } from "../shared/playback";
import type { TrackInfo } from "../shared/trackInfo";
import { buildRegionNeutralAmazonMusicAlbumUrl } from "../utils/amazonMusicUrl";

const DISCORD_ACTIVITY_TYPE_LISTENING = 2;
const DISCORD_BUTTON_LABEL = "Listen on Amazon Music";

const getPresenceKey = (
    amazonMusicHostname: string | null,
    trackInfo: TrackInfo | null,
    playbackTimestamps: PlaybackTimestamps | null
): string => JSON.stringify({ amazonMusicHostname, playbackTimestamps, trackInfo });

const createDiscordActivity = (trackInfo: TrackInfo, playbackTimestamps: PlaybackTimestamps | null): SetActivity => {
    const amazonMusicUrls = trackInfo.trackId ? buildRegionNeutralAmazonMusicAlbumUrl(trackInfo.trackId) : null;

    return {
        details: trackInfo.title,
        ...(trackInfo.album ? { largeImageText: trackInfo.album } : {}),
        ...(trackInfo.coverImage ? { largeImageKey: trackInfo.coverImage } : {}),
        ...(trackInfo.artist ? { state: trackInfo.artist } : {}),
        ...(amazonMusicUrls
            ? {
                  buttons: [{ label: DISCORD_BUTTON_LABEL, url: amazonMusicUrls.long }],
                  largeImageUrl: amazonMusicUrls.short
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
