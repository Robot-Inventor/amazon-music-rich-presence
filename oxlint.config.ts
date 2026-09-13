import { defineConfig } from "oxlint";
import { oxlintReactConfigNoJSDoc } from "@robot-inventor/oxlint-config";

export default defineConfig({
    ...oxlintReactConfigNoJSDoc,
    ignorePatterns: [".hutch/**"],
    settings: {
        ...oxlintReactConfigNoJSDoc.settings,
        "import-x/resolver": {
            node: true,
            typescript: {
                bun: true
            }
        }
    }
});
