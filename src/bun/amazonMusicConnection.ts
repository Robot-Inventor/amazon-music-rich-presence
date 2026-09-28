import { CDP_CONNECT_TIMEOUT_MS, type CdpClient, createCdpClient } from "./cdp";
import { type DebugTarget, getAmazonMusicTarget } from "./cdpTargets";
import { isActivePollingGeneration } from "./pollingGeneration";

const TARGET_RETRY_INTERVAL_MS = 1_000;
const NO_DELAY_MS = 0;

interface TargetSearchResult {
    readonly deadline: number;
    readonly target: DebugTarget;
}

const waitForNextTargetSearch = async (retryStartedAt: number, deadline: number): Promise<void> => {
    const retryTime = Math.min(TARGET_RETRY_INTERVAL_MS, Math.max(NO_DELAY_MS, deadline - Date.now()));
    const elapsedTime = Date.now() - retryStartedAt;
    const waitTime = Math.max(NO_DELAY_MS, retryTime - elapsedTime);
    if (waitTime > NO_DELAY_MS) await Bun.sleep(waitTime);
};

const findTargetAfterLaunch = async (
    generation: number,
    targetWaitTimeoutMs: number
): Promise<TargetSearchResult | null> => {
    const deadline = Date.now() + targetWaitTimeoutMs;

    const findTarget = async (): Promise<DebugTarget | null> => {
        if (!isActivePollingGeneration(generation) || Date.now() >= deadline) return null;

        const retryStartedAt = Date.now();
        const remainingTime = deadline - Date.now();

        try {
            const target = await getAmazonMusicTarget({ timeoutMs: Math.min(TARGET_RETRY_INTERVAL_MS, remainingTime) });
            if (target && Date.now() < deadline) return target;
        } catch {
            // Amazon Music may not have opened its remote debugging endpoint yet.
        }

        await waitForNextTargetSearch(retryStartedAt, deadline);

        return findTarget();
    };

    const target = await findTarget();
    return target ? { deadline, target } : null;
};

const waitForConnectionRetry = async (deadline: number): Promise<void> => {
    const retryTime = Math.min(TARGET_RETRY_INTERVAL_MS, Math.max(NO_DELAY_MS, deadline - Date.now()));
    if (!(retryTime > NO_DELAY_MS)) return;

    await Bun.sleep(retryTime);
};

const connectToTarget = async (
    target: DebugTarget,
    generation: number,
    deadline: number
): Promise<CdpClient | null> => {
    if (!isActivePollingGeneration(generation)) return null;

    const remainingTime = deadline - Date.now();
    if (!(remainingTime > NO_DELAY_MS)) return null;

    const client = await createCdpClient(target.webSocketDebuggerUrl, Math.min(CDP_CONNECT_TIMEOUT_MS, remainingTime));

    if (!isActivePollingGeneration(generation) || Date.now() > deadline) {
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

        if (!currentTarget) return null;
        await waitForConnectionRetry(deadline);

        return connectAfterLaunch(currentTarget, generation, deadline);
    }
};

export { connectAfterLaunch, findTargetAfterLaunch, type TargetSearchResult };
