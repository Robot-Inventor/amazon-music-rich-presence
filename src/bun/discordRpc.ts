import { createDiscordActivity, getPresenceKey } from "./discordActivity";
import { Client } from "@xhayper/discord-rpc";
import type { PlaybackTimestamps } from "./playback";
import type { TrackInfo } from "./trackInfo";
import { withDiscordTimeout } from "./discordRpcUtils";

const DISCORD_RECONNECT_INTERVAL_MS = 5_000;
const DISCORD_RECONNECT_GRACE_PERIOD_MS = 60_000;
const DISCORD_LONG_RECONNECT_INTERVAL_MS = 60_000;
const DISCORD_APPLICATION_ID = "1545581759796617237";
const NO_ACTIVE_GENERATION = -1;

type DiscordConnectionState = "connecting" | "connected" | "reconnecting" | "unavailable";

let activeGeneration = NO_ACTIVE_GENERATION;
let discordClient: Client | null = null;
let discordConnectionState: DiscordConnectionState = "unavailable";
let discordReconnectStartedAt = 0;
let discordReconnectTimer: Timer | null = null;
let lastTrackInfo: TrackInfo | null = null;
let lastPlaybackTimestamps: PlaybackTimestamps | null = null;
let lastPublishedTrackKey: string | null = null;
let discordUpdateQueue = Promise.resolve();
let discordCleanupPromise = Promise.resolve();
let discordPresenceErrorReported = false;

const clearDiscordReconnectTimer = (): void => {
    if (!discordReconnectTimer) return;
    clearTimeout(discordReconnectTimer);
    discordReconnectTimer = null;
};

const destroyDiscordClient = async (client: Client): Promise<void> => {
    try {
        if (client.isConnected && client.user) await withDiscordTimeout(client.user.clearActivity());
    } catch {
        // The connection may already be closed while stopping.
    }

    await withDiscordTimeout(client.destroy());
};

const reportDiscordConnectionLost = (): void => {
    // eslint-disable-next-line no-console
    console.error("Discord RPC connection lost. Retrying in the background.");
};

const ignoreError = (): void => {
    // Cleanup errors are not actionable after the connection has already failed.
};

const reportDiscordPresenceFailure = (error: unknown): void => {
    if (discordPresenceErrorReported) return;
    discordPresenceErrorReported = true;
    // eslint-disable-next-line no-console
    console.error("Could not update Discord Rich Presence.", error);
};

const getDiscordReconnectInterval = (): number =>
    Date.now() - discordReconnectStartedAt < DISCORD_RECONNECT_GRACE_PERIOD_MS
        ? DISCORD_RECONNECT_INTERVAL_MS
        : DISCORD_LONG_RECONNECT_INTERVAL_MS;

const isActiveGeneration = (generation: number): boolean => generation === activeGeneration;

const isCurrentDiscordClient = (client: Client): boolean => discordClient === client;

const reconnectDiscordClient = async (client: Client): Promise<boolean> => {
    try {
        await withDiscordTimeout(client.login());
        return client.isConnected;
    } catch {
        return false;
    }
};

const sendDiscordPresence = async (
    client: Client,
    trackInfo: TrackInfo | null,
    playbackTimestamps: PlaybackTimestamps | null
): Promise<boolean> => {
    if (!client.user) return false;

    try {
        if (trackInfo) {
            await withDiscordTimeout(client.user.setActivity(createDiscordActivity(trackInfo, playbackTimestamps)));
        } else {
            await withDiscordTimeout(client.user.clearActivity());
        }
        return true;
    } catch (error: unknown) {
        reportDiscordPresenceFailure(error);
        return false;
    }
};

const recordPublishedTrack = (client: Client, generation: number, trackInfoKey: string): void => {
    discordPresenceErrorReported = false;
    if (isActiveGeneration(generation) && discordClient === client) lastPublishedTrackKey = trackInfoKey;
};

interface PresenceUpdate {
    readonly force?: boolean;
    readonly generation: number;
    readonly playbackTimestamps: PlaybackTimestamps | null;
    readonly trackInfo: TrackInfo | null;
}

const updateDiscordPresence = async ({
    force = false,
    generation,
    playbackTimestamps,
    trackInfo
}: PresenceUpdate): Promise<void> => {
    if (!isActiveGeneration(generation)) return;
    const trackInfoKey = getPresenceKey(trackInfo, playbackTimestamps);
    if (!force && trackInfoKey === lastPublishedTrackKey) return;

    const client = discordClient;
    if (!client || discordConnectionState !== "connected") return;

    if (await sendDiscordPresence(client, trackInfo, playbackTimestamps)) {
        recordPublishedTrack(client, generation, trackInfoKey);
    }
};

const queueDiscordPresence = (presenceUpdate: PresenceUpdate): void => {
    const { generation, playbackTimestamps, trackInfo } = presenceUpdate;
    if (!isActiveGeneration(generation)) return;
    lastTrackInfo = trackInfo;
    lastPlaybackTimestamps = playbackTimestamps;
    discordUpdateQueue = discordUpdateQueue.then(() => updateDiscordPresence(presenceUpdate)).catch(ignoreError);
};

const markDiscordConnected = (generation: number, message: string | null): void => {
    discordConnectionState = "connected";
    clearDiscordReconnectTimer();
    if (message) {
        // eslint-disable-next-line no-console
        console.info(message);
    }
    queueDiscordPresence({
        force: true,
        generation,
        playbackTimestamps: lastPlaybackTimestamps,
        trackInfo: lastTrackInfo
    });
};

const scheduleDiscordReconnect = (generation: number, delay: number, reconnect: () => Promise<void>): void => {
    if (!isActiveGeneration(generation) || discordConnectionState !== "reconnecting" || discordReconnectTimer) return;

    discordReconnectTimer = setTimeout(() => {
        discordReconnectTimer = null;
        void reconnect().catch(ignoreError);
    }, delay);
};

const retryDiscordReconnect = (generation: number, reconnect: () => Promise<void>): void => {
    if (isActiveGeneration(generation)) {
        scheduleDiscordReconnect(generation, getDiscordReconnectInterval(), reconnect);
    }
};

const attachDiscordDisconnectHandler = (client: Client, generation: number, reconnect: () => Promise<void>): void => {
    client.on("disconnected", () => {
        if (!isActiveGeneration(generation) || !isCurrentDiscordClient(client)) return;
        if (discordConnectionState !== "connected") return;

        discordConnectionState = "reconnecting";
        discordReconnectStartedAt = Date.now();
        reportDiscordConnectionLost();
        scheduleDiscordReconnect(generation, DISCORD_RECONNECT_INTERVAL_MS, reconnect);
    });
};

const createDiscordClient = (
    generation: number,
    connectionState: DiscordConnectionState,
    reconnect: () => Promise<void>
): Client => {
    const client = new Client({ clientId: DISCORD_APPLICATION_ID });
    discordClient = client;
    discordConnectionState = connectionState;
    attachDiscordDisconnectHandler(client, generation, reconnect);
    return client;
};

const replaceDiscordClient = (generation: number, reconnect: () => Promise<void>): Client => {
    const previousClient = discordClient;
    discordClient = null;
    if (previousClient) void destroyDiscordClient(previousClient).catch(ignoreError);
    return createDiscordClient(generation, "reconnecting", reconnect);
};

const handleDiscordReconnectFailure = (client: Client, generation: number, reconnect: () => Promise<void>): void => {
    if (isCurrentDiscordClient(client)) discordClient = null;
    void destroyDiscordClient(client).catch(ignoreError);
    retryDiscordReconnect(generation, reconnect);
};

const attemptDiscordReconnect = async (generation: number): Promise<void> => {
    if (!isActiveGeneration(generation) || discordConnectionState !== "reconnecting") return;

    const client = replaceDiscordClient(generation, () => attemptDiscordReconnect(generation));

    if (!(await reconnectDiscordClient(client))) {
        handleDiscordReconnectFailure(client, generation, () => attemptDiscordReconnect(generation));
        return;
    }

    if (!isActiveGeneration(generation) || !isCurrentDiscordClient(client)) {
        await destroyDiscordClient(client).catch(ignoreError);
        return;
    }

    markDiscordConnected(generation, "Discord RPC reconnected.");
};

const handleInitialDiscordConnectionFailure = (client: Client, generation: number, error: unknown): void => {
    if (isCurrentDiscordClient(client)) {
        discordClient = null;
        discordConnectionState = "unavailable";
    }
    if (isActiveGeneration(generation)) {
        // eslint-disable-next-line no-console
        console.error("Could not connect to Discord Rich Presence. Skipping Discord integration.", error);
    }
    discordCleanupPromise = discordCleanupPromise.then(() => destroyDiscordClient(client)).catch(ignoreError);
};

const connectDiscordRpc = async (generation: number): Promise<void> => {
    const client = createDiscordClient(generation, "connecting", () => attemptDiscordReconnect(generation));

    try {
        await withDiscordTimeout(client.login());
        if (!client.isConnected) throw new Error("Discord RPC disconnected during connection.");
    } catch (error: unknown) {
        handleInitialDiscordConnectionFailure(client, generation, error);
        return;
    }

    if (!isActiveGeneration(generation) || discordClient !== client) {
        await destroyDiscordClient(client).catch(ignoreError);
        return;
    }

    markDiscordConnected(generation, null);
};

const startDiscordRpc = (generation: number): void => {
    activeGeneration = generation;
    void discordCleanupPromise
        .then(() => {
            if (isActiveGeneration(generation)) void connectDiscordRpc(generation).catch(ignoreError);
        })
        .catch(ignoreError);
};

const resetDiscordState = (): void => {
    discordClient = null;
    discordConnectionState = "unavailable";
    lastTrackInfo = null;
    lastPlaybackTimestamps = null;
    lastPublishedTrackKey = null;
    discordPresenceErrorReported = false;
    discordUpdateQueue = Promise.resolve();
};

const stopDiscordRpc = (): void => {
    activeGeneration = NO_ACTIVE_GENERATION;
    clearDiscordReconnectTimer();

    const client = discordClient;
    resetDiscordState();
    if (client) {
        discordCleanupPromise = discordCleanupPromise.then(() => destroyDiscordClient(client)).catch(ignoreError);
    }
};

const publishTrackInfo = (
    trackInfo: TrackInfo | null,
    playbackTimestamps: PlaybackTimestamps | null,
    generation: number
): void => {
    queueDiscordPresence({ generation, playbackTimestamps, trackInfo });
};

export { publishTrackInfo, startDiscordRpc, stopDiscordRpc };
