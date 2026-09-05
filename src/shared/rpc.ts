import type { PlaybackTimestamps } from "./playback";
import type { RPCSchema } from "electrobun/main";
import type { TrackInfo } from "./trackInfo";

type CurrentTrackUpdate =
    | {
          readonly kind: "track";
          readonly playbackTimestamps: PlaybackTimestamps | null;
          readonly trackInfo: TrackInfo;
      }
    | {
          readonly kind: "no-track";
      };

type LaunchAmazonMusicResult =
    | {
          readonly ok: true;
      }
    | {
          readonly message: string;
          readonly ok: false;
      };

interface OpenAmazonMusicParams {
    readonly albumId: string;
    readonly trackId: string;
}

interface AppRPC {
    bun: RPCSchema<{
        requests: {
            launchAmazonMusic: {
                params: Record<string, never>;
                response: LaunchAmazonMusicResult;
            };
            openAmazonMusic: {
                params: OpenAmazonMusicParams;
                response: undefined;
            };
        };
        messages: Record<never, never>;
    }>;
    webview: RPCSchema<{
        requests: Record<never, never>;
        messages: {
            currentTrack: CurrentTrackUpdate;
        };
    }>;
}

const AMAZON_MUSIC_LAUNCH_ERROR_MESSAGE =
    "Could not open Amazon Music. Please make sure it is installed in the default location.";

export {
    AMAZON_MUSIC_LAUNCH_ERROR_MESSAGE,
    type AppRPC,
    type CurrentTrackUpdate,
    type LaunchAmazonMusicResult,
    type OpenAmazonMusicParams
};
