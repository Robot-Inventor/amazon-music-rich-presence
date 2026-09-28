import { useCallback, useEffect, useState } from "react";
import type { LaunchAtStartupStatus } from "../shared/rpc";
import { rpc } from "./rpc";

const DEFAULT_STATUS: LaunchAtStartupStatus = {
    available: false,
    message: "Loading launch at startup setting..."
};

interface LaunchAtStartupSetting {
    readonly onChange: (enabled: boolean) => void;
    readonly onOpen: () => void;
    readonly status: LaunchAtStartupStatus;
}

const useLaunchAtStartupSetting = (notifyError: (description: string) => void): LaunchAtStartupSetting => {
    const [status, setStatus] = useState<LaunchAtStartupStatus>(DEFAULT_STATUS);

    const load = useCallback((): void => {
        void rpc.request
            .getLaunchAtStartupStatus({})
            .then(setStatus)
            .catch(() => {
                const failedStatus: LaunchAtStartupStatus = {
                    available: false,
                    message: "Could not read the launch at startup setting."
                };
                setStatus(failedStatus);
                notifyError(failedStatus.message);
            });
    }, [notifyError]);

    const refresh = useCallback((): void => {
        setStatus(DEFAULT_STATUS);
        load();
    }, [load]);

    useEffect(load, [load]);

    const onChange = (enabled: boolean): void => {
        void rpc.request
            .setLaunchAtStartupEnabled({ enabled })
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
