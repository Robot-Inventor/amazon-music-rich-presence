import type { ComponentProps, ReactNode } from "react";
import { switchStyles, switchThumbStyles } from "./Switch.css";
import { Switch as BaseSwitch } from "@base-ui/react/switch";

const Switch = (props: ComponentProps<typeof BaseSwitch.Root>): ReactNode => (
    <BaseSwitch.Root {...props} className={switchStyles}>
        <BaseSwitch.Thumb className={switchThumbStyles} />
    </BaseSwitch.Root>
);

export { Switch };
