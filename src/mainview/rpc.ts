import type { AppRPC, CurrentTrackUpdate, UpdateAvailable, UpdateCheckResult, UpdateError } from "../shared/rpc";
import { Electroview } from "electrobun/view";
import type { PlaybackTimestamps } from "../shared/playback";
import type { TrackInfo } from "../shared/trackInfo";
import { useSyncExternalStore } from "react";

interface CurrentTrackState {
    readonly amazonMusicHostname: string | null;
    readonly playbackTimestamps: PlaybackTimestamps | null;
    readonly trackInfo: TrackInfo | null;
}

interface UpdateState {
    readonly error: string | null;
    readonly version: string | null;
}

interface ExternalStore<T> {
    readonly getState: () => T;
    readonly setState: (next: T) => void;
    readonly subscribe: (subscriber: () => void) => () => void;
}

const createExternalStore = <T>(initialState: T): ExternalStore<T> => {
    let state = initialState;
    const subscribers = new Set<() => void>();

    const subscribe = (subscriber: () => void): (() => void) => {
        subscribers.add(subscriber);
        return (): void => {
            subscribers.delete(subscriber);
        };
    };

    const getState = (): T => state;

    const setState = (next: T): void => {
        state = next;
        subscribers.forEach((subscriber) => {
            subscriber();
        });
    };

    return { getState, setState, subscribe };
};

const currentTrackStore = createExternalStore<CurrentTrackState>({
    amazonMusicHostname: null,
    playbackTimestamps: null,
    trackInfo: null
});

const updateStore = createExternalStore<UpdateState>({ error: null, version: null });

const updateCurrentTrackState = (update: CurrentTrackUpdate): void => {
    currentTrackStore.setState(
        update.kind === "no-track"
            ? { amazonMusicHostname: null, playbackTimestamps: null, trackInfo: null }
            : {
                  amazonMusicHostname: update.amazonMusicHostname,
                  playbackTimestamps: update.playbackTimestamps,
                  trackInfo: update.trackInfo
              }
    );
};

const setUpdateAvailable = ({ version }: UpdateAvailable): void => {
    updateStore.setState({ ...updateStore.getState(), error: null, version });
};

const setUpdateError = ({ message }: UpdateError): void => {
    updateStore.setState({ ...updateStore.getState(), error: message });
};

const useCurrentTrack = (): CurrentTrackState =>
    useSyncExternalStore(currentTrackStore.subscribe, currentTrackStore.getState);

const useUpdateState = (): UpdateState => useSyncExternalStore(updateStore.subscribe, updateStore.getState);

const rpc = Electroview.defineRPC<AppRPC>({
    handlers: {
        messages: {
            currentTrack: updateCurrentTrackState,
            updateAvailable: setUpdateAvailable,
            updateError: setUpdateError
        },
        requests: {}
    }
});

new Electroview({ rpc });

const requestUpdateCheck = (onError: () => void): Promise<UpdateCheckResult> =>
    rpc.request.checkForUpdates({}).catch(() => {
        onError();
        return { status: "error" };
    });

export { requestUpdateCheck, rpc, useCurrentTrack, useUpdateState };
