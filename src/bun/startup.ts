import { dirname, join } from "node:path";
import AutoLaunch from "auto-launch";
import { BuildConfig } from "electrobun/main";
import Winreg from "winreg";
import { existsSync } from "node:fs";

const STARTUP_APP_NAME = "Amazon Music Rich Presence";
const STARTUP_REGISTRY_VALUE_NAME = "launcher";
const REGISTRY_VALUE_NOT_FOUND = 1;
const startupLauncherPath = join(dirname(process.execPath), "launcher.exe");
const startupAvailable = BuildConfig.getSync().isPackaged && existsSync(startupLauncherPath);
const autoLaunch = startupAvailable
    ? new AutoLaunch({ isHidden: false, name: STARTUP_APP_NAME, path: startupLauncherPath })
    : null;
const startupRegistry = new Winreg({
    hive: Winreg.HKCU,
    key: "\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
});

const isMissingRegistryValueError = (error: Error): boolean =>
    "code" in error && error.code === REGISTRY_VALUE_NOT_FOUND;

const readLaunchAtStartup = (): Promise<boolean> =>
    new Promise((resolve, reject) => {
        startupRegistry.get(STARTUP_REGISTRY_VALUE_NAME, (error: Error | null, item: unknown) => {
            if (!error) {
                resolve(Boolean(item));
                return;
            }
            if (isMissingRegistryValueError(error)) {
                resolve(false);
                return;
            }
            reject(error);
        });
    });

const getLaunchAtStartupEnabled = async (): Promise<boolean> => {
    if (!autoLaunch) throw new Error("Launch at startup is unavailable.");
    return readLaunchAtStartup();
};

const setLaunchAtStartupEnabled = async (enabled: boolean): Promise<boolean> => {
    if (!autoLaunch) return false;

    try {
        if (enabled) await autoLaunch.enable();
        else await autoLaunch.disable();
        return true;
    } catch {
        return false;
    }
};

const isLaunchAtStartupAvailable = (): boolean => startupAvailable;

export { getLaunchAtStartupEnabled, isLaunchAtStartupAvailable, setLaunchAtStartupEnabled };
