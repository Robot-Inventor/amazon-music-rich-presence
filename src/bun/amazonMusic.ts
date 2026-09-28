import { type CdpClient, CdpDisconnectedError, createCdpClient } from "./cdp";
import { type DebugTarget, getAmazonMusicTarget } from "./cdpTargets";
import { type TargetSearchResult, connectAfterLaunch, findTargetAfterLaunch } from "./amazonMusicConnection";
import { advancePollingGeneration, isActivePollingGeneration } from "./pollingGeneration";
import { publishNoTrackToView, publishNoTrackUpdate, setTrackPublisher, updateCurrentTrack } from "./trackPublisher";
import { startDiscordRpc, stopDiscordRpc } from "./discordRpc";
import type { CurrentTrackUpdate } from "../shared/rpc";
import { resetPlaybackSyncState } from "./playback";

const POLL_INTERVAL_MS = 5_000;
const TARGET_WAIT_TIMEOUT_MS = 30_000;
const MILLISECONDS_PER_SECOND = 1_000;
const NO_DELAY_MS = 0;

type PollingFunction = (state: PollingState) => Promise<void>;

interface AmazonMusicPollingOptions {
    readonly shouldLogStartupFailure?: boolean;
    readonly startDiscordBeforeTargetSearch?: boolean;
    readonly targetWaitTimeoutMs?: number;
}

interface PollingRunOptions {
    readonly generation: number;
    readonly shouldLogStartupFailure: boolean;
    readonly startDiscordBeforeTargetSearch: boolean;
    readonly targetWaitTimeoutMs: number;
}

interface PollingState {
    readonly client: CdpClient;
    readonly generation: number;
    readonly nextPollAt: number;
    readonly target: DebugTarget;
}

let activeClient: CdpClient | null = null;

const stopAmazonMusicPolling = (): void => {
    advancePollingGeneration();
    resetPlaybackSyncState();
    activeClient?.close();
    activeClient = null;
    stopDiscordRpc();
    publishNoTrackToView();
};

const recoverCdpClient = async (
    client: CdpClient,
    target: DebugTarget,
    generation: number
): Promise<CdpClient | null> => {
    client.close();
    if (activeClient === client) activeClient = null;

    const replacementTarget = await getAmazonMusicTarget({ targetId: target.id }).catch(() => null);
    if (!replacementTarget || !isActivePollingGeneration(generation)) return null;

    return createCdpClient(replacementTarget.webSocketDebuggerUrl);
};

const handlePollingError = (generation: number, error: unknown): void => {
    if (!isActivePollingGeneration(generation)) return;
    // oxlint-disable-next-line no-console
    console.error("Amazon Music polling stopped.", error);
    stopAmazonMusicPolling();
};

const schedulePoll = (state: PollingState, poll: PollingFunction): void => {
    const delay = Math.max(NO_DELAY_MS, state.nextPollAt - Date.now());
    setTimeout(() => {
        void poll(state).catch((error: unknown) => {
            handlePollingError(state.generation, error);
        });
    }, delay);
};

const scheduleAfterDisconnect = async (state: PollingState, poll: PollingFunction): Promise<void> => {
    const replacementClient = await recoverCdpClient(state.client, state.target, state.generation);

    if (!replacementClient || !isActivePollingGeneration(state.generation)) {
        if (isActivePollingGeneration(state.generation)) publishNoTrackUpdate(state.generation);
        replacementClient?.close();
        return;
    }

    activeClient = replacementClient;
    schedulePoll(
        {
            client: replacementClient,
            generation: state.generation,
            nextPollAt: Date.now(),
            target: state.target
        },
        poll
    );
};

const pollAmazonMusic = async ({ client, generation, nextPollAt, target }: PollingState): Promise<void> => {
    if (!isActivePollingGeneration(generation)) return;

    try {
        await updateCurrentTrack(client, generation);
    } catch (error: unknown) {
        if (!(error instanceof CdpDisconnectedError)) throw error;
        await scheduleAfterDisconnect({ client, generation, nextPollAt, target }, pollAmazonMusic);
        return;
    }

    schedulePoll({ client, generation, nextPollAt: nextPollAt + POLL_INTERVAL_MS, target }, pollAmazonMusic);
};

const activateClient = (client: CdpClient, generation: number): boolean => {
    if (!isActivePollingGeneration(generation)) {
        client.close();
        return false;
    }
    activeClient = client;
    return true;
};

const logStartupFailure = (generation: number, message: string): void => {
    if (!isActivePollingGeneration(generation)) return;
    // oxlint-disable-next-line no-console
    console.error(message);
};

const pollWithClient = (state: PollingState): void => {
    if (!activateClient(state.client, state.generation)) return;
    schedulePoll(state, pollAmazonMusic);
};

const stopAfterStartupFailure = (generation: number, message: string, reportFailure: boolean): void => {
    if (reportFailure) logStartupFailure(generation, message);
    if (isActivePollingGeneration(generation)) stopAmazonMusicPolling();
};

const connectAndPoll = async (
    searchResult: TargetSearchResult,
    { generation, shouldLogStartupFailure, startDiscordBeforeTargetSearch, targetWaitTimeoutMs }: PollingRunOptions
): Promise<void> => {
    const client = await connectAfterLaunch(searchResult.target, generation, searchResult.deadline);
    if (!client) {
        stopAfterStartupFailure(
            generation,
            `Could not connect to the Amazon Music page within ${String(targetWaitTimeoutMs / MILLISECONDS_PER_SECOND)} seconds.`,
            shouldLogStartupFailure
        );
        return;
    }

    if (!isActivePollingGeneration(generation)) {
        client.close();
        return;
    }

    if (!startDiscordBeforeTargetSearch) startDiscordRpc(generation);
    pollWithClient({
        client,
        generation,
        nextPollAt: Date.now(),
        target: searchResult.target
    });
};

const runAmazonMusicPolling = async ({
    generation,
    shouldLogStartupFailure,
    startDiscordBeforeTargetSearch,
    targetWaitTimeoutMs
}: PollingRunOptions): Promise<void> => {
    const searchResult = await findTargetAfterLaunch(generation, targetWaitTimeoutMs);
    if (!searchResult) {
        stopAfterStartupFailure(
            generation,
            `Could not find the Amazon Music page target within ${String(targetWaitTimeoutMs / MILLISECONDS_PER_SECOND)} seconds.`,
            shouldLogStartupFailure
        );
        return;
    }
    if (!isActivePollingGeneration(generation)) return;

    await connectAndPoll(searchResult, {
        generation,
        shouldLogStartupFailure,
        startDiscordBeforeTargetSearch,
        targetWaitTimeoutMs
    });
};

const startAmazonMusicPolling = (
    publishCurrentTrack: (update: CurrentTrackUpdate) => void,
    {
        shouldLogStartupFailure = true,
        startDiscordBeforeTargetSearch = true,
        targetWaitTimeoutMs = TARGET_WAIT_TIMEOUT_MS
    }: AmazonMusicPollingOptions = {}
): void => {
    setTrackPublisher(publishCurrentTrack);
    stopAmazonMusicPolling();

    const generation = advancePollingGeneration();

    if (startDiscordBeforeTargetSearch) startDiscordRpc(generation);
    void runAmazonMusicPolling({
        generation,
        shouldLogStartupFailure,
        startDiscordBeforeTargetSearch,
        targetWaitTimeoutMs
    }).catch((error: unknown) => {
        if (isActivePollingGeneration(generation)) {
            if (shouldLogStartupFailure) {
                // oxlint-disable-next-line no-console
                console.error("Amazon Music polling stopped.", error);
            }
            stopAmazonMusicPolling();
        }
    });
};

export { startAmazonMusicPolling };
