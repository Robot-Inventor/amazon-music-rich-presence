import { bannerStyles, buttonStyles, titleStyles } from "./UpdateBanner.css";
import type { ReactNode } from "react";
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
        <button className={buttonStyles} disabled={isUpdating} onClick={onUpdate} type="button">
            {isUpdating ? "Updating..." : "Update"}
        </button>
    </section>
);

export { UpdateBanner };
