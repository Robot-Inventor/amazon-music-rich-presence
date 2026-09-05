import type { LaunchAmazonMusicResult } from "../../shared/rpc";
import type { ReactNode } from "react";
import { buttonStyles } from "./LaunchAmazonMusic.css";

interface OpenAmazonMusicProps {
    onLaunch: () => Promise<LaunchAmazonMusicResult>;
}

const LaunchAmazonMusic = ({ onLaunch }: OpenAmazonMusicProps): ReactNode => {
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
        <button className={buttonStyles} onClick={handleClick} type="button">
            Launch Amazon Music
        </button>
    );
};

export { LaunchAmazonMusic };
