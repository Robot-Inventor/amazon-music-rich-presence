import type { TrackInfo } from "../shared/trackInfo";

const PAUSED_PRESENCE_TIMEOUT_MS = 180_000;

let timer: Timer | null = null;
let expired = false;
let pausedTrackKey: string | null = null;

const resetPausedPresence = (): void => {
    if (timer) clearTimeout(timer);
    timer = null;
    expired = false;
    pausedTrackKey = null;
};

const getVisibleTrack = (
    trackInfo: TrackInfo | null,
    isPlaying: boolean | undefined,
    onExpire: () => void
): TrackInfo | null => {
    if (!trackInfo || isPlaying) {
        resetPausedPresence();
        return trackInfo;
    }

    const trackKey = trackInfo.trackId ?? `${trackInfo.title}\0${trackInfo.artist ?? ""}`;
    if (trackKey !== pausedTrackKey) {
        resetPausedPresence();
        pausedTrackKey = trackKey;
    }
    if (!timer && !expired) {
        timer = setTimeout(() => {
            timer = null;
            expired = true;
            onExpire();
        }, PAUSED_PRESENCE_TIMEOUT_MS);
    }
    return expired ? null : trackInfo;
};

export { getVisibleTrack, resetPausedPresence };
