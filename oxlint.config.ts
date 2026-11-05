import { defineConfig } from "oxlint";
import { oxlintReactConfig } from "@robot-inventor/oxlint-config";

export default defineConfig({
    ...oxlintReactConfig,
    ignorePatterns: [".hutch/**"],
    settings: {
        ...oxlintReactConfig.settings,
        "import-x/resolver": {
            node: true,
            typescript: {
                bun: true
            }
        }
    }
});
