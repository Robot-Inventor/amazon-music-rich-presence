import { useCallback, useEffect, useState } from "react";
import type { LaunchAtStartupStatus } from "../shared/rpc";

const DEFAULT_STATUS: LaunchAtStartupStatus = {
    available: false,
    message: "Loading launch at startup setting..."
};

interface LaunchAtStartupRPC {
    readonly getStatus: () => Promise<LaunchAtStartupStatus>;
    readonly setEnabled: (enabled: boolean) => Promise<boolean>;
}

interface LaunchAtStartupSetting {
    readonly onChange: (enabled: boolean) => void;
    readonly onOpen: () => void;
    readonly status: LaunchAtStartupStatus;
}

const useLaunchAtStartupSetting = (
    startupRPC: LaunchAtStartupRPC,
    notifyError: (description: string) => void
): LaunchAtStartupSetting => {
    const [status, setStatus] = useState<LaunchAtStartupStatus>(DEFAULT_STATUS);

    const load = useCallback((): void => {
        void startupRPC
            .getStatus()
            .then(setStatus)
            .catch(() => {
                const failedStatus: LaunchAtStartupStatus = {
                    available: false,
                    message: "Could not read the launch at startup setting."
                };
                setStatus(failedStatus);
                notifyError(failedStatus.message);
            });
    }, [notifyError, startupRPC]);

    const refresh = useCallback((): void => {
        setStatus(DEFAULT_STATUS);
        load();
    }, [load]);

    useEffect(load, [load]);

    const onChange = (enabled: boolean): void => {
        void startupRPC
            .setEnabled(enabled)
            .then((saved) => {
                if (saved) {
                    setStatus({ available: true, enabled });
                    return;
                }
                notifyError("Could not save the launch at startup setting.");
                refresh();
            })
            .catch(() => {
                notifyError("Could not save the launch at startup setting.");
                refresh();
            });
    };

    return { onChange, onOpen: refresh, status };
};

export { useLaunchAtStartupSetting };
