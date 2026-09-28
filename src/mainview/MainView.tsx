import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { appNameStyles, bannerStyles, launcherStyles, mainStyles } from "./index.css";
import { requestUpdateCheck, rpc, useCurrentTrack, useUpdateState } from "./rpc";
import { LaunchAmazonMusic } from "./components/LaunchAmazonMusic";
import { RichPresencePlayer } from "./components/RichPresencePlayer";
import { SettingsButton } from "./components/SettingsButton";
import { Toast } from "@base-ui/react/toast";
import { UpdateBanner } from "./components/UpdateBanner";

const MainView = (): ReactNode => {
    const { amazonMusicHostname, playbackTimestamps, trackInfo: currentTrack } = useCurrentTrack();
    const update = useUpdateState();
    const [isUpdating, setIsUpdating] = useState(false);

    const toastManager = Toast.useToastManager();

    const notifySettingsError = useCallback(
        (description: string): void => {
            toastManager.add({ description, title: "Settings" });
        },
        [toastManager]
    );

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
                isUpdating={isUpdating}
                notifyError={notifySettingsError}
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
