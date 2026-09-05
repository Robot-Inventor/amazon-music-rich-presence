import { type SetActivity, StatusDisplayType } from "@xhayper/discord-rpc";
import type { PlaybackTimestamps } from "./playback";
import type { TrackInfo } from "./trackInfo";

const DISCORD_ACTIVITY_TYPE_LISTENING = 2;
const DISCORD_BUTTON_LABEL = "Listen on Amazon Music";

const getPresenceKey = (trackInfo: TrackInfo | null, playbackTimestamps: PlaybackTimestamps | null): string =>
    JSON.stringify({ playbackTimestamps, trackInfo });

const createDiscordActivity = (trackInfo: TrackInfo, playbackTimestamps: PlaybackTimestamps | null): SetActivity => ({
    details: trackInfo.title,
    ...(trackInfo.album ? { largeImageText: trackInfo.album } : {}),
    ...(trackInfo.coverImage ? { largeImageKey: trackInfo.coverImage } : {}),
    ...(trackInfo.artist ? { state: trackInfo.artist } : {}),
    ...(trackInfo.link
        ? {
              buttons: [{ label: DISCORD_BUTTON_LABEL, url: trackInfo.link }],
              largeImageUrl: trackInfo.link
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
});

export { createDiscordActivity, getPresenceKey };
