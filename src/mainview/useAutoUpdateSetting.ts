import { useEffect, useState } from "react";
import { rpc } from "./rpc";

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

export { useAutoUpdateSetting };
