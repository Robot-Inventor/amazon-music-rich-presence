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
import type { UpdateCheckResult } from "../../shared/rpc";

interface SettingsButtonProps {
    autoUpdateEnabled: boolean;
    isUpdating: boolean;
    onAutoUpdateEnabledChange: (enabled: boolean) => void;
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

const SettingsButton = ({
    autoUpdateEnabled,
    isUpdating,
    onAutoUpdateEnabledChange,
    onCheckForUpdates,
    onUpdate
}: SettingsButtonProps): ReactNode => {
    const { checkForUpdates, updateCheckState } = useUpdateCheck(onCheckForUpdates);

    return (
        <Dialog.Root>
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
                    </Dialog.Popup>
                </Dialog.Viewport>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export { SettingsButton };
