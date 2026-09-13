import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Utils } from "electrobun/main";
import { join } from "node:path";
import { type } from "arktype";

const DEFAULT_AUTO_UPDATE_ENABLED = true;
const settingsPath = join(Utils.paths.userData, "settings.json");

const parseSettings = type("string.json.parse").to({
    autoUpdateEnabled: "boolean = true"
});

const writeSettings = (enabled: boolean): boolean => {
    try {
        mkdirSync(Utils.paths.userData, { recursive: true });
        writeFileSync(
            settingsPath,
            JSON.stringify({
                autoUpdateEnabled: enabled
            } as const satisfies typeof parseSettings.infer),
            "utf8"
        );
        return true;
    } catch {
        return false;
    }
};

const readSettings = (): boolean => {
    try {
        const settings = parseSettings(readFileSync(settingsPath, "utf8"));
        if (!(settings instanceof type.errors)) {
            return settings.autoUpdateEnabled;
        }
    } catch {
        // Use the default when the settings file cannot be read.
    }

    writeSettings(DEFAULT_AUTO_UPDATE_ENABLED);
    return DEFAULT_AUTO_UPDATE_ENABLED;
};

let autoUpdateEnabled = readSettings();

const getAutoUpdateEnabled = (): boolean => autoUpdateEnabled;

const setAutoUpdateEnabled = (enabled: boolean): boolean => {
    if (!writeSettings(enabled)) return false;
    autoUpdateEnabled = enabled;
    return true;
};

export { getAutoUpdateEnabled, setAutoUpdateEnabled };
