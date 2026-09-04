import type { LaunchAmazonMusicResult } from "../../shared/rpc";
import type { ReactNode } from "react";
import { buttonStyles } from "./OpenAmazonMusic.css";

interface OpenAmazonMusicProps {
    onLaunch: () => Promise<LaunchAmazonMusicResult>;
}

const OpenAmazonMusic = ({ onLaunch }: OpenAmazonMusicProps): ReactNode => {
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
            Open Amazon Music
        </button>
    );
};

export { OpenAmazonMusic };
