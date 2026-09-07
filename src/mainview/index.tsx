// eslint-disable-next-line import-x/no-unassigned-import
import "the-new-css-reset/css/reset.css";

import type { AppRPC, CurrentTrackUpdate, UpdateAvailable, UpdateError } from "../shared/rpc";
import { type ReactNode, StrictMode, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { appNameStyles, bannerStyles, launcherStyles, mainStyles } from "./index.css";
import { Electroview } from "electrobun/view";
import { LaunchAmazonMusic } from "./components/LaunchAmazonMusic";
import type { PlaybackTimestamps } from "../shared/playback";
import { RichPresencePlayer } from "./components/RichPresencePlayer";
import { Toast } from "@base-ui/react/toast";
import { ToastNotifications } from "./components/ToastNotifications";
import type { TrackInfo } from "../shared/trackInfo";
import { UpdateBanner } from "./components/UpdateBanner";
import { createRoot } from "react-dom/client";
import { mergeClassNames } from "../utils/mergeClassNames";
// eslint-disable-next-line import-x/max-dependencies
import { themeClass } from "./theme.css";

interface CurrentTrackState {
    readonly amazonMusicHostname: string | null;
    readonly playbackTimestamps: PlaybackTimestamps | null;
    readonly trackInfo: TrackInfo | null;
}

let currentTrackState: CurrentTrackState = { amazonMusicHostname: null, playbackTimestamps: null, trackInfo: null };
const currentTrackSubscribers = new Set<() => void>();

interface UpdateState {
    readonly error: string | null;
    readonly version: string | null;
}

let updateState: UpdateState = { error: null, version: null };
const updateSubscribers = new Set<() => void>();

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

const getUpdateState = (): UpdateState => updateState;

const subscribeToUpdates = (subscriber: () => void): (() => void) => {
    updateSubscribers.add(subscriber);
    return (): void => {
        updateSubscribers.delete(subscriber);
    };
};

const notifyUpdateSubscribers = (): void => {
    updateSubscribers.forEach((subscriber) => {
        subscriber();
    });
};

const setUpdateAvailable = ({ version }: UpdateAvailable): void => {
    updateState = { ...updateState, error: null, version };
    notifyUpdateSubscribers();
};

const setUpdateError = ({ message }: UpdateError): void => {
    updateState = { ...updateState, error: message };
    notifyUpdateSubscribers();
};

const rpc = Electroview.defineRPC<AppRPC>({
    handlers: {
        messages: {
            currentTrack: updateCurrentTrackState,
            updateAvailable: setUpdateAvailable,
            updateError: setUpdateError
        },
        requests: {}
    }
});

new Electroview({ rpc });

const rootElement = document.getElementById("root");

if (!rootElement) {
    throw new Error("The React root element is missing.");
}

// eslint-disable-next-line max-lines-per-function
const MainView = (): ReactNode => {
    const {
        amazonMusicHostname,
        playbackTimestamps,
        trackInfo: currentTrack
    } = useSyncExternalStore(subscribeToCurrentTrack, getCurrentTrackState);
    const update = useSyncExternalStore(subscribeToUpdates, getUpdateState);
    const [isUpdating, setIsUpdating] = useState(false);
    const toastManager = Toast.useToastManager();
    const notifiedUpdateErrorRef = useRef<string | null>(null);

    useEffect(() => {
        if (!update.error || update.error === notifiedUpdateErrorRef.current) return;
        notifiedUpdateErrorRef.current = update.error;
        toastManager.add({ description: update.error, title: "Update" });
    }, [toastManager, update.error]);

    const handleUpdate = (): void => {
        setIsUpdating(true);
        void rpc.request
            .updateApplication({})
            .then((updated) => {
                setIsUpdating(false);
                if (!updated) {
                    toastManager.add({ description: "Could not update the application.", title: "Update" });
                }
            })
            .catch(() => {
                setIsUpdating(false);
                toastManager.add({ description: "Could not update the application.", title: "Update" });
            });
    };

    return (
        <main className={mergeClassNames(themeClass, mainStyles)}>
            <h1 className={appNameStyles}>Amazon Music Rich Presence</h1>
            <LaunchAmazonMusic className={launcherStyles} onLaunch={() => rpc.request.launchAmazonMusic({})} />
            <RichPresencePlayer
                amazonMusicHostname={amazonMusicHostname}
                openAmazonMusic={(params) => rpc.request.openAmazonMusic(params)}
                playbackTimestamps={playbackTimestamps}
                trackInfo={currentTrack}
            />
            {update.version && (
                <UpdateBanner
                    className={bannerStyles}
                    isUpdating={isUpdating}
                    onUpdate={handleUpdate}
                    version={update.version}
                />
            )}
        </main>
    );
};

createRoot(rootElement).render(
    <StrictMode>
        <ToastNotifications>
            <MainView />
        </ToastNotifications>
    </StrictMode>
);
