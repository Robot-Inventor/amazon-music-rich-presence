import { CDP_CONNECT_TIMEOUT_MS, type CdpClient, CdpDisconnectedError, createCdpClient } from "./cdp";
import { type DebugTarget, getAmazonMusicTarget } from "./cdpTargets";
import { extractTrackInfo, getTrackInfoKey } from "./trackInfo";
import { getPlaybackTimestamps, resetPlaybackSyncState } from "./playback";
import { publishTrackInfo, startDiscordRpc, stopDiscordRpc } from "./discordRpc";

const POLL_INTERVAL_MS = 5_000;
const TARGET_RETRY_INTERVAL_MS = 1_000;
const TARGET_WAIT_TIMEOUT_MS = 30_000;
const NO_DELAY_MS = 0;

type PollingFunction = (state: PollingState) => Promise<void>;

interface TargetSearchResult {
    readonly deadline: number;
    readonly target: DebugTarget;
}

interface PollingState {
    readonly client: CdpClient;
    readonly generation: number;
    readonly nextPollAt: number;
    readonly target: DebugTarget;
}

const wait = async (milliseconds: number): Promise<void> => {
    await new Promise<void>((resolve) => {
        setTimeout(resolve, milliseconds);
    });
};

let pollingGeneration = 0;
let activeClient: CdpClient | null = null;

const stopAmazonMusicPolling = (): void => {
    ++pollingGeneration;
    resetPlaybackSyncState();
    activeClient?.close();
    activeClient = null;
    stopDiscordRpc();
};

const findTargetAfterLaunch = async (generation: number): Promise<TargetSearchResult | null> => {
    const deadline = Date.now() + TARGET_WAIT_TIMEOUT_MS;

    const findTarget = async (): Promise<DebugTarget | null> => {
        if (generation !== pollingGeneration || Date.now() >= deadline) return null;

        const remainingTime = deadline - Date.now();

        try {
            const target = await getAmazonMusicTarget({ timeoutMs: Math.min(TARGET_RETRY_INTERVAL_MS, remainingTime) });
            if (target && Date.now() < deadline) return target;
        } catch {
            // Amazon Music may not have opened its remote debugging endpoint yet.
        }

        const retryTime = Math.min(TARGET_RETRY_INTERVAL_MS, Math.max(NO_DELAY_MS, deadline - Date.now()));
        if (!(retryTime > NO_DELAY_MS)) return null;

        await wait(retryTime);

        return findTarget();
    };

    const target = await findTarget();
    return target ? { deadline, target } : null;
};

const waitForConnectionRetry = async (deadline: number): Promise<boolean> => {
    const retryTime = Math.min(TARGET_RETRY_INTERVAL_MS, Math.max(NO_DELAY_MS, deadline - Date.now()));
    if (!(retryTime > NO_DELAY_MS)) return false;

    await wait(retryTime);

    return true;
};

const connectToTarget = async (
    target: DebugTarget,
    generation: number,
    deadline: number
): Promise<CdpClient | null> => {
    if (generation !== pollingGeneration) return null;

    const remainingTime = deadline - Date.now();
    if (!(remainingTime > NO_DELAY_MS)) return null;

    const client = await createCdpClient(target.webSocketDebuggerUrl, Math.min(CDP_CONNECT_TIMEOUT_MS, remainingTime));

    if (generation !== pollingGeneration || Date.now() > deadline) {
        client.close();
        return null;
    }

    return client;
};

const connectAfterLaunch = async (
    target: DebugTarget,
    generation: number,
    deadline: number
): Promise<CdpClient | null> => {
    try {
        return await connectToTarget(target, generation, deadline);
    } catch {
        const remainingRetryTime = deadline - Date.now();
        if (!(remainingRetryTime > NO_DELAY_MS)) return null;

        const currentTarget = await getAmazonMusicTarget({
            targetId: target.id,
            timeoutMs: Math.min(CDP_CONNECT_TIMEOUT_MS, remainingRetryTime)
        }).catch(() => null);

        if (!currentTarget || !(await waitForConnectionRetry(deadline))) return null;

        return connectAfterLaunch(currentTarget, generation, deadline);
    }
};

const recoverCdpClient = async (
    client: CdpClient,
    target: DebugTarget,
    generation: number
): Promise<CdpClient | null> => {
    client.close();
    if (activeClient === client) activeClient = null;

    const replacementTarget = await getAmazonMusicTarget({ targetId: target.id }).catch(() => null);
    if (!replacementTarget || generation !== pollingGeneration) return null;

    return createCdpClient(replacementTarget.webSocketDebuggerUrl);
};

const updateCurrentTrack = async (client: CdpClient, generation: number): Promise<void> => {
    const trackSnapshot = await extractTrackInfo(client);
    if (!trackSnapshot) {
        resetPlaybackSyncState();
        publishTrackInfo(null, null, generation);
        return;
    }

    publishTrackInfo(
        trackSnapshot.trackInfo,
        getPlaybackTimestamps(getTrackInfoKey(trackSnapshot.trackInfo), trackSnapshot.playback),
        generation
    );
};

const handlePollingError = (generation: number, error: unknown): void => {
    if (generation !== pollingGeneration) return;
    // eslint-disable-next-line no-console
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

    if (!replacementClient || state.generation !== pollingGeneration) {
        publishTrackInfo(null, null, state.generation);
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
    if (generation !== pollingGeneration) return;

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
    if (generation !== pollingGeneration) {
        client.close();
        return false;
    }
    activeClient = client;
    return true;
};

const reportStartupFailure = (generation: number, message: string): void => {
    if (generation !== pollingGeneration) return;
    // eslint-disable-next-line no-console
    console.error(message);
};

const pollWithClient = (client: CdpClient, target: DebugTarget, generation: number): void => {
    if (!activateClient(client, generation)) return;
    schedulePoll({ client, generation, nextPollAt: Date.now(), target }, pollAmazonMusic);
};

const stopAfterStartupFailure = (generation: number, message: string): void => {
    reportStartupFailure(generation, message);
    if (generation === pollingGeneration) stopAmazonMusicPolling();
};

const connectAndPoll = async (searchResult: TargetSearchResult, generation: number): Promise<void> => {
    const client = await connectAfterLaunch(searchResult.target, generation, searchResult.deadline);
    if (!client) {
        stopAfterStartupFailure(generation, "Could not connect to the Amazon Music page within 30 seconds.");
        return;
    }

    pollWithClient(client, searchResult.target, generation);
};

const runAmazonMusicPolling = async (generation: number): Promise<void> => {
    const searchResult = await findTargetAfterLaunch(generation);
    if (!searchResult) {
        stopAfterStartupFailure(generation, "Could not find the Amazon Music page target within 30 seconds.");
        return;
    }
    if (generation !== pollingGeneration) {
        return;
    }

    await connectAndPoll(searchResult, generation);
};

const startAmazonMusicPolling = (): void => {
    stopAmazonMusicPolling();

    const generation = pollingGeneration;

    startDiscordRpc(generation);
    void runAmazonMusicPolling(generation).catch((error: unknown) => {
        if (generation === pollingGeneration) {
            // eslint-disable-next-line no-console
            console.error("Amazon Music polling stopped.", error);
            stopAmazonMusicPolling();
        }
    });
};

export { startAmazonMusicPolling, stopAmazonMusicPolling };
