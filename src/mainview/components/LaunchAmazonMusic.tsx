import type { LaunchAmazonMusicResult } from "../../shared/rpc";
import type { ReactNode } from "react";
import { buttonStyles } from "./LaunchAmazonMusic.css";
import { mergeClassNames } from "../../utils/mergeClassNames";

interface OpenAmazonMusicProps {
    onLaunch: () => Promise<LaunchAmazonMusicResult>;
    className?: string | undefined;
}

const LaunchAmazonMusic = ({ onLaunch, className }: OpenAmazonMusicProps): ReactNode => {
    const handleClick = (): void => {
        void (async (): Promise<void> => {
            const result = await onLaunch();
            if (!result.ok) {
                // eslint-disable-next-line no-alert
                alert(result.message);
            }
        })();
    };

    return (
        <button className={mergeClassNames(buttonStyles, className)} onClick={handleClick} type="button">
            Launch Amazon Music
        </button>
    );
};

export { LaunchAmazonMusic };
