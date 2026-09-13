import { Settings, X } from "lucide-react";
import {
    backdropStyles,
    headerStyles,
    itemStyles,
    openButtonStyles,
    popupStyles,
    titleStyles,
    viewportStyles
} from "./SettingsButton.css";
import { Dialog } from "@base-ui/react/dialog";
import { IconButton } from "./IconButton";
import type { ReactNode } from "react";
import { Switch } from "./Switch";

interface SettingsButtonProps {
    autoUpdateEnabled: boolean;
    onAutoUpdateEnabledChange: (enabled: boolean) => void;
}

const SettingsButton = ({ autoUpdateEnabled, onAutoUpdateEnabledChange }: SettingsButtonProps): ReactNode => (
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
                </Dialog.Popup>
            </Dialog.Viewport>
        </Dialog.Portal>
    </Dialog.Root>
);

export { SettingsButton };
