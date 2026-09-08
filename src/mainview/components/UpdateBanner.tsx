import { bannerStyles, titleStyles, updatingButtonStyles } from "./UpdateBanner.css";
import type { ReactNode } from "react";
import { TextButton } from "./TextButton";
import { mergeClassNames } from "../../utils/mergeClassNames";

interface UpdateBannerProps {
    isUpdating: boolean;
    onUpdate: () => void;
    version: string;
    className?: string | undefined;
}

const UpdateBanner = ({ isUpdating, onUpdate, version, className }: UpdateBannerProps): ReactNode => (
    <section aria-live="polite" className={mergeClassNames(bannerStyles, className)}>
        <h2 className={titleStyles}>The latest version, {version}, is available.</h2>
        <TextButton className={updatingButtonStyles} disabled={isUpdating} onClick={onUpdate}>
            {isUpdating ? "Updating..." : "Update"}
        </TextButton>
    </section>
);

export { UpdateBanner };
