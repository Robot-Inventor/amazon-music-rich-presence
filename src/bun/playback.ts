import type { PlaybackTimestamps } from "../shared/playback";
import { type } from "arktype";

const MILLISECONDS_PER_SECOND = 1_000;
const MINUTES_PER_HOUR = 60;
const NO_SECONDS = 0;
const PLAYBACK_SYNC_TOLERANCE_MS = MILLISECONDS_PER_SECOND;
const SECONDS_PER_MINUTE = 60;

const parsePlaybackSnapshot = type({
    currentPlaybackPosition: "string | null",
    currentRemainingPosition: "string | null",
    isPlaying: "boolean"
});

const parsePlaybackPositionInput = type("x/^(?<sign>-)?(?<first>\\d+):(?<second>[0-5]\\d)(?::(?<third>[0-5]\\d))?$/");

type PlaybackSnapshot = typeof parsePlaybackSnapshot.infer;

interface PlaybackSyncState extends PlaybackTimestamps {
    readonly trackKey: string;
}

interface PlaybackParts {
    readonly first: number;
    readonly hasHours: boolean;
    readonly second: number;
    readonly third: number;
}

interface ParsedPlaybackPosition {
    readonly currentSeconds: number;
    readonly remainingSeconds: number;
}

let playbackSyncState: PlaybackSyncState | null = null;

const getPlaybackSeconds = ({ first, hasHours, second, third }: PlaybackParts): number => {
    if (hasHours) return first * MINUTES_PER_HOUR * SECONDS_PER_MINUTE + second * SECONDS_PER_MINUTE + third;
    return first * SECONDS_PER_MINUTE + second;
};

const parsePlaybackPosition = (value: string, requireNegative: boolean): number | null => {
    const match = parsePlaybackPositionInput(value.trim());
    if (match instanceof type.errors) return null;

    const { first, second, sign, third } = match.groups;
    if (requireNegative !== Boolean(sign)) return null;

    const seconds = getPlaybackSeconds({
        first: Number(first),
        hasHours: Boolean(third),
        second: Number(second),
        third: third ? Number(third) : NO_SECONDS
    });
    const signedSeconds = sign ? -seconds : seconds;

    return Number.isSafeInteger(seconds) ? signedSeconds : null;
};

const resetPlaybackSyncState = (): void => {
    playbackSyncState = null;
};

const parsePlaybackPositions = (playback: PlaybackSnapshot): ParsedPlaybackPosition | null => {
    const currentSeconds = parsePlaybackPosition(playback.currentPlaybackPosition ?? "", false);
    const remainingSeconds = parsePlaybackPosition(playback.currentRemainingPosition ?? "", true);
    if (currentSeconds === null || remainingSeconds === null) {
        resetPlaybackSyncState();
        return null;
    }

    const durationSeconds = currentSeconds - remainingSeconds;
    if (durationSeconds <= NO_SECONDS || currentSeconds > durationSeconds) {
        resetPlaybackSyncState();
        return null;
    }

    return { currentSeconds, remainingSeconds };
};

const shouldRegenerateTimestamps = (trackKey: string, now: number, currentPositionMs: number): boolean => {
    if (!playbackSyncState) return true;
    return (
        playbackSyncState.trackKey !== trackKey ||
        Math.abs(now - playbackSyncState.startTimestamp - currentPositionMs) >= PLAYBACK_SYNC_TOLERANCE_MS
    );
};

const getPlaybackTimestamps = (trackKey: string, playback: PlaybackSnapshot): PlaybackTimestamps | null => {
    if (!playback.isPlaying) {
        resetPlaybackSyncState();
        return null;
    }

    const positions = parsePlaybackPositions(playback);
    if (!positions) return null;

    const now = Date.now();
    const currentPositionMs = positions.currentSeconds * MILLISECONDS_PER_SECOND;

    if (shouldRegenerateTimestamps(trackKey, now, currentPositionMs)) {
        playbackSyncState = {
            endTimestamp: now - positions.remainingSeconds * MILLISECONDS_PER_SECOND,
            startTimestamp: now - currentPositionMs,
            trackKey
        };
    }

    return playbackSyncState
        ? {
              endTimestamp: playbackSyncState.endTimestamp,
              startTimestamp: playbackSyncState.startTimestamp
          }
        : null;
};

export { getPlaybackTimestamps, parsePlaybackSnapshot, resetPlaybackSyncState };
