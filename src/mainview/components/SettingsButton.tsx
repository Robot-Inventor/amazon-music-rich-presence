import type { LaunchAtStartupStatus, UpdateCheckResult } from "../../shared/rpc";
import { type ReactNode, useId, useState } from "react";
import { Settings, X } from "lucide-react";
import {
    backdropStyles,
    headerStyles,
    itemStyles,
    openButtonStyles,
    popupStyles,
    titleStyles,
    updateStatusMessageStyles,
    viewportStyles
} from "./SettingsButton.css";
import { Dialog } from "@base-ui/react/dialog";
import { IconButton } from "./IconButton";
import { Switch } from "./Switch";
import { TextButton } from "./TextButton";

interface SettingsButtonProps {
    autoUpdateEnabled: boolean;
    launchAtStartupStatus: LaunchAtStartupStatus;
    isUpdating: boolean;
    onAutoUpdateEnabledChange: (enabled: boolean) => void;
    onLaunchAtStartupChange: (enabled: boolean) => void;
    onOpen: () => void;
    onCheckForUpdates: () => Promise<UpdateCheckResult>;
    onUpdate: () => void;
}

type UpdateCheckState = { readonly status: "idle" } | { readonly status: "checking" } | UpdateCheckResult;

const getUpdateStatusMessage = (state: UpdateCheckState): string | null => {
    if (state.status === "available") return `Update available: ${state.version}`;
    if (state.status === "error") return "Could not check for updates.";
    if (state.status === "not-available") return "No updates available";
    return null;
};

interface UpdateCheckControlProps {
    isUpdating: boolean;
    onCheckForUpdates: () => void;
    onUpdate: () => void;
    updateCheckState: UpdateCheckState;
}

interface UpdateCheck {
    readonly checkForUpdates: () => void;
    readonly updateCheckState: UpdateCheckState;
}

const useUpdateCheck = (onCheckForUpdates: () => Promise<UpdateCheckResult>): UpdateCheck => {
    const [updateCheckState, setUpdateCheckState] = useState<UpdateCheckState>({ status: "idle" });

    const checkForUpdates = (): void => {
        setUpdateCheckState({ status: "checking" });
        void onCheckForUpdates().then((result) => {
            setUpdateCheckState(result);
        });
    };

    return { checkForUpdates, updateCheckState };
};

const UpdateCheckControl = ({
    isUpdating,
    onCheckForUpdates,
    onUpdate,
    updateCheckState
}: UpdateCheckControlProps): ReactNode => {
    const updateButtonId = useId();

    const isChecking = updateCheckState.status === "checking";
    const updateAvailable = updateCheckState.status === "available";
    const updateStatusMessage = getUpdateStatusMessage(updateCheckState);

    const handleUpdateButtonClick = (): void => {
        if (updateAvailable) {
            onUpdate();
            return;
        }

        onCheckForUpdates();
    };

    let updateButtonLabel = "Check Now";
    if (isChecking) updateButtonLabel = "Checking...";
    if (updateAvailable) updateButtonLabel = "Update Now";
    if (isUpdating) updateButtonLabel = "Updating...";

    return (
        <label className={itemStyles} htmlFor={updateButtonId}>
            <div>
                <div>Check for updates manually</div>
                {updateStatusMessage && (
                    <div aria-live="polite" className={updateStatusMessageStyles}>
                        {updateStatusMessage}
                    </div>
                )}
            </div>
            <TextButton disabled={isChecking || isUpdating} id={updateButtonId} onClick={handleUpdateButtonClick}>
                {updateButtonLabel}
            </TextButton>
        </label>
    );
};

interface LaunchAtStartupControlProps {
    readonly onChange: (enabled: boolean) => void;
    readonly status: LaunchAtStartupStatus;
}

const LaunchAtStartupControl = ({ onChange, status }: LaunchAtStartupControlProps): ReactNode => (
    <label className={itemStyles}>
        <div>
            <div>Launch at startup</div>
            {!status.available && (
                <div aria-live="polite" className={updateStatusMessageStyles}>
                    {status.message}
                </div>
            )}
        </div>
        <Switch checked={status.available && status.enabled} disabled={!status.available} onCheckedChange={onChange} />
    </label>
);

const SettingsHeader = (): ReactNode => (
    <div className={headerStyles}>
        <Dialog.Title className={titleStyles}>Settings</Dialog.Title>
        <Dialog.Close
            render={
                <IconButton>
                    <X />
                </IconButton>
            }
        />
    </div>
);

const SettingsButton = ({
    onCheckForUpdates,
    onOpen,
    autoUpdateEnabled,
    onAutoUpdateEnabledChange,
    onLaunchAtStartupChange,
    launchAtStartupStatus,
    isUpdating,
    onUpdate
}: SettingsButtonProps): ReactNode => {
    const { checkForUpdates, updateCheckState } = useUpdateCheck(onCheckForUpdates);

    return (
        <Dialog.Root
            onOpenChange={(open) => {
                if (open) onOpen();
            }}
        >
            <Dialog.Trigger
                render={
                    <IconButton className={openButtonStyles}>
                        <Settings />
                    </IconButton>
                }
            />
            <Dialog.Portal>
                <Dialog.Backdrop className={backdropStyles} />
                <Dialog.Viewport className={viewportStyles}>
                    <Dialog.Popup className={popupStyles}>
                        <SettingsHeader />
                        <label className={itemStyles}>
                            Automatically check for updates
                            <Switch checked={autoUpdateEnabled} onCheckedChange={onAutoUpdateEnabledChange} />
                        </label>
                        <UpdateCheckControl
                            isUpdating={isUpdating}
                            onCheckForUpdates={checkForUpdates}
                            onUpdate={onUpdate}
                            updateCheckState={updateCheckState}
                        />
                        <LaunchAtStartupControl onChange={onLaunchAtStartupChange} status={launchAtStartupStatus} />
                    </Dialog.Popup>
                </Dialog.Viewport>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export { SettingsButton };
