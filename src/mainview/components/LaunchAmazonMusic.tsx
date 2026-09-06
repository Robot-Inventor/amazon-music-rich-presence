import type { LaunchAmazonMusicResult } from "../../shared/rpc";
import type { ReactNode } from "react";
import { Toast } from "@base-ui/react/toast";
import { buttonStyles } from "./LaunchAmazonMusic.css";
import { mergeClassNames } from "../../utils/mergeClassNames";

interface OpenAmazonMusicProps {
    onLaunch: () => Promise<LaunchAmazonMusicResult>;
    className?: string | undefined;
}

const LaunchAmazonMusic = ({ onLaunch, className }: OpenAmazonMusicProps): ReactNode => {
    const toastManager = Toast.useToastManager();

    const handleClick = (): void => {
        void (async (): Promise<void> => {
            try {
                const result = await onLaunch();
                toastManager.add({
                    description: result.ok ? "Amazon Music opened." : result.message,
                    title: "Amazon Music"
                });
            } catch {
                toastManager.add({
                    description: "Could not open Amazon Music.",
                    title: "Amazon Music"
                });
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
