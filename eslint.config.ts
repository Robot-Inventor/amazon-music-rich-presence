import { eslintReactConfigNoJSDoc } from "@robot-inventor/eslint-config";

export default [
    ...eslintReactConfigNoJSDoc,
    {
        settings: {
            "import-x/resolver": {
                node: true,
                typescript: {
                    bun: true
                }
            }
        }
    }
];
