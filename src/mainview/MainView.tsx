import type {
    AppRPC,
    CurrentTrackUpdate,
    LaunchAtStartupStatus,
    UpdateAvailable,
    UpdateCheckResult,
    UpdateError
} from "../shared/rpc";
import { type ReactNode, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { appNameStyles, bannerStyles, launcherStyles, mainStyles } from "./index.css";
import { Electroview } from "electrobun/view";
import { LaunchAmazonMusic } from "./components/LaunchAmazonMusic";
import type { PlaybackTimestamps } from "../shared/playback";
import { RichPresencePlayer } from "./components/RichPresencePlayer";
import { SettingsButton } from "./components/SettingsButton";
import { Toast } from "@base-ui/react/toast";
import type { TrackInfo } from "../shared/trackInfo";
// oxlint-disable-next-line import/max-dependencies
import { UpdateBanner } from "./components/UpdateBanner";
import { useLaunchAtStartupSetting } from "./useLaunchAtStartupSetting";

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

const launchAtStartupRPC = {
    getStatus: (): Promise<LaunchAtStartupStatus> => rpc.request.getLaunchAtStartupStatus({}),
    setEnabled: (enabled: boolean): Promise<boolean> => rpc.request.setLaunchAtStartupEnabled({ enabled })
};

const requestUpdateCheck = (onError: () => void): Promise<UpdateCheckResult> =>
    rpc.request.checkForUpdates({}).catch(() => {
        onError();
        return { status: "error" };
    });

interface AutoUpdateSetting {
    readonly enabled: boolean;
    readonly onChange: (enabled: boolean) => void;
}

const useAutoUpdateSetting = (notifyError: (description: string) => void): AutoUpdateSetting => {
    const [enabled, setEnabled] = useState(true);

    useEffect(() => {
        void rpc.request
            .getAutoUpdateEnabled({})
            .then(setEnabled)
            .catch(() => {
                notifyError("Could not load settings.");
            });
    }, [notifyError]);

    const onChange = (nextEnabled: boolean): void => {
        void rpc.request
            .setAutoUpdateEnabled({ enabled: nextEnabled })
            .then((saved) => {
                if (saved) {
                    setEnabled(nextEnabled);
                    return;
                }
                notifyError("Could not save settings.");
            })
            .catch(() => {
                notifyError("Could not save settings.");
            });
    };

    return { enabled, onChange };
};

const MainView = (): ReactNode => {
    const {
        amazonMusicHostname,
        playbackTimestamps,
        trackInfo: currentTrack
    } = useSyncExternalStore(subscribeToCurrentTrack, getCurrentTrackState);

    const update = useSyncExternalStore(subscribeToUpdates, getUpdateState);
    const [isUpdating, setIsUpdating] = useState(false);

    const toastManager = Toast.useToastManager();

    const notifySettingsError = useCallback(
        (description: string): void => {
            toastManager.add({ description, title: "Settings" });
        },
        [toastManager]
    );

    const { enabled: autoUpdateEnabled, onChange: handleAutoUpdateEnabledChange } =
        useAutoUpdateSetting(notifySettingsError);
    const {
        onChange: handleLaunchAtStartupChange,
        onOpen: refreshLaunchAtStartup,
        status: launchAtStartupStatus
    } = useLaunchAtStartupSetting(launchAtStartupRPC, notifySettingsError);

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
        <main className={mainStyles}>
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
            <SettingsButton
                autoUpdateEnabled={autoUpdateEnabled}
                isUpdating={isUpdating}
                launchAtStartupStatus={launchAtStartupStatus}
                onAutoUpdateEnabledChange={handleAutoUpdateEnabledChange}
                onLaunchAtStartupChange={handleLaunchAtStartupChange}
                onOpen={refreshLaunchAtStartup}
                onCheckForUpdates={() =>
                    requestUpdateCheck(() => {
                        toastManager.add({ description: "Could not check for updates.", title: "Update" });
                    })
                }
                onUpdate={handleUpdate}
            />
        </main>
    );
};

export { MainView };
