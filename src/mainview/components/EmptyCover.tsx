import { containerStyles, iconStyles } from "./EmptyCover.css";
import { MusicIcon } from "lucide-react";
import type { ReactNode } from "react";
import { mergeClassNames } from "../../utils/mergeClassNames";

interface EmptyCoverProps {
    className?: string | undefined;
}

const EmptyCover = ({ className }: EmptyCoverProps): ReactNode => (
    <div className={mergeClassNames(containerStyles, className)}>
        <MusicIcon className={iconStyles} />
    </div>
);

export { EmptyCover };
