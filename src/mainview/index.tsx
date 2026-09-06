// eslint-disable-next-line import-x/no-unassigned-import
import "the-new-css-reset/css/reset.css";

import type { AppRPC, CurrentTrackUpdate } from "../shared/rpc";
import { type ReactNode, StrictMode, useSyncExternalStore } from "react";
import { appNameStyles, launcherStyles } from "./index.css";
import { Electroview } from "electrobun/view";
import { LaunchAmazonMusic } from "./components/LaunchAmazonMusic";
import type { PlaybackTimestamps } from "../shared/playback";
import { RichPresencePlayer } from "./components/RichPresencePlayer";
import type { TrackInfo } from "../shared/trackInfo";
import { createRoot } from "react-dom/client";

interface CurrentTrackState {
    readonly amazonMusicHostname: string | null;
    readonly playbackTimestamps: PlaybackTimestamps | null;
    readonly trackInfo: TrackInfo | null;
}

let currentTrackState: CurrentTrackState = { amazonMusicHostname: null, playbackTimestamps: null, trackInfo: null };
const currentTrackSubscribers = new Set<() => void>();

const getCurrentTrackState = (): CurrentTrackState => currentTrackState;

const subscribeToCurrentTrack = (subscriber: () => void): (() => void) => {
    currentTrackSubscribers.add(subscriber);
    return (): void => {
        currentTrackSubscribers.delete(subscriber);
    };
};

const updateCurrentTrackState = (update: CurrentTrackUpdate): void => {
    currentTrackState =
        update.kind === "no-track"
            ? { amazonMusicHostname: null, playbackTimestamps: null, trackInfo: null }
            : {
                  amazonMusicHostname: update.amazonMusicHostname,
                  playbackTimestamps: update.playbackTimestamps,
                  trackInfo: update.trackInfo
              };

    currentTrackSubscribers.forEach((subscriber) => {
        subscriber();
    });
};

const rpc = Electroview.defineRPC<AppRPC>({
    handlers: {
        messages: {
            currentTrack: updateCurrentTrackState
        },
        requests: {}
    }
});

new Electroview({ rpc });

const rootElement = document.getElementById("root");

if (!rootElement) {
    throw new Error("The React root element is missing.");
}

const MainView = (): ReactNode => {
    const {
        amazonMusicHostname,
        playbackTimestamps,
        trackInfo: currentTrack
    } = useSyncExternalStore(subscribeToCurrentTrack, getCurrentTrackState);

    return (
        <main>
            <h1 className={appNameStyles}>Amazon Music Rich Presence</h1>
            <LaunchAmazonMusic className={launcherStyles} onLaunch={() => rpc.request.launchAmazonMusic({})} />
            <RichPresencePlayer
                amazonMusicHostname={amazonMusicHostname}
                openAmazonMusic={(params) => rpc.request.openAmazonMusic(params)}
                playbackTimestamps={playbackTimestamps}
                trackInfo={currentTrack}
            />
        </main>
    );
};

createRoot(rootElement).render(
    <StrictMode>
        <MainView />
    </StrictMode>
);
