import type { RPCSchema } from "electrobun/main";

type LaunchAmazonMusicResult =
    | {
          readonly ok: true;
      }
    | {
          readonly message: string;
          readonly ok: false;
      };

interface AppRPC {
    bun: RPCSchema<{
        requests: {
            launchAmazonMusic: {
                params: Record<string, never>;
                response: LaunchAmazonMusicResult;
            };
        };
        messages: Record<never, never>;
    }>;
    webview: RPCSchema<{
        requests: Record<never, never>;
        messages: Record<never, never>;
    }>;
}

const AMAZON_MUSIC_LAUNCH_ERROR_MESSAGE =
    "Could not open Amazon Music. Please make sure it is installed in the default location.";

export { AMAZON_MUSIC_LAUNCH_ERROR_MESSAGE, type AppRPC, type LaunchAmazonMusicResult };
