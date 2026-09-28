import { getPlaybackTimestamps, resetPlaybackSyncState } from "./playback";
import type { CdpClient } from "./cdp";
import type { CurrentTrackUpdate } from "../shared/rpc";
import { extractTrackInfo } from "./trackInfo";
import { isActivePollingGeneration } from "./pollingGeneration";
import { queueDiscordPresence } from "./discordRpc";

type PublishCurrentTrack = (update: CurrentTrackUpdate) => void;

let publishCurrentTrackToView: PublishCurrentTrack | null = null;

const setTrackPublisher = (publishCurrentTrack: PublishCurrentTrack): void => {
    publishCurrentTrackToView = publishCurrentTrack;
};

const publishNoTrackToView = (): void => {
    publishCurrentTrackToView?.({ kind: "no-track" });
};

const publishNoTrackUpdate = (generation: number): void => {
    resetPlaybackSyncState();
    queueDiscordPresence({ amazonMusicHostname: null, generation, playbackTimestamps: null, trackInfo: null });
    publishNoTrackToView();
};

const updateCurrentTrack = async (client: CdpClient, generation: number): Promise<void> => {
    const trackSnapshot = await extractTrackInfo(client);
    if (!isActivePollingGeneration(generation)) return;

    if (!trackSnapshot) {
        publishNoTrackUpdate(generation);
        return;
    }

    const { amazonMusicHostname, playback, trackInfo } = trackSnapshot;
    const playbackTimestamps = getPlaybackTimestamps(JSON.stringify(trackInfo), playback);
    queueDiscordPresence({
        amazonMusicHostname,
        generation,
        isPlaying: playback.isPlaying,
        playbackTimestamps,
        trackInfo
    });
    publishCurrentTrackToView?.({ amazonMusicHostname, kind: "track", playbackTimestamps, trackInfo });
};

export { publishNoTrackToView, publishNoTrackUpdate, setTrackPublisher, updateCurrentTrack };
