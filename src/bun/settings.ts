import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Utils } from "electrobun/main";
import { join } from "node:path";
import { type } from "arktype";

const DEFAULT_AUTO_UPDATE_ENABLED = true;
const settingsPath = join(Utils.paths.userData, "settings.json");

let autoUpdateEnabled = DEFAULT_AUTO_UPDATE_ENABLED;

const parseSettings = type("string.json.parse").to({
    autoUpdateEnabled: "boolean = true"
});

const settings = parseSettings(readFileSync(settingsPath, "utf8"));
if (!(settings instanceof type.errors)) {
    // oxlint-disable-next-line prefer-destructuring
    autoUpdateEnabled = settings.autoUpdateEnabled;
}

const getAutoUpdateEnabled = (): boolean => autoUpdateEnabled;

const setAutoUpdateEnabled = (enabled: boolean): boolean => {
    try {
        mkdirSync(Utils.paths.userData, { recursive: true });
        writeFileSync(
            settingsPath,
            JSON.stringify({
                autoUpdateEnabled: enabled
            } as const satisfies typeof parseSettings.infer),
            "utf8"
        );
        autoUpdateEnabled = enabled;
        return true;
    } catch {
        return false;
    }
};

export { getAutoUpdateEnabled, setAutoUpdateEnabled };
