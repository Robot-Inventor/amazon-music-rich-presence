import type { ComponentProps, ReactNode } from "react";
import { disabledSwitchStyles, switchStyles, switchThumbStyles } from "./Switch.css";
import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { mergeClassNames } from "../../utils/mergeClassNames";

const Switch = (props: ComponentProps<typeof BaseSwitch.Root>): ReactNode => (
    <BaseSwitch.Root {...props} className={mergeClassNames(switchStyles, props.disabled && disabledSwitchStyles)}>
        <BaseSwitch.Thumb className={switchThumbStyles} />
    </BaseSwitch.Root>
);

export { Switch };
