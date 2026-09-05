import { isAmazonMusicWebAppUrl } from "../utils/amazonMusicUrl";
import { type } from "arktype";

const DEBUG_PORT = 52856;
const DEBUG_ENDPOINT = `http://127.0.0.1:${String(DEBUG_PORT)}/json/list`;
const TARGET_REQUEST_TIMEOUT_MS = 1_000;

const parseCdpWebSocketUrl = type(
    `/^ws:\\/\\/127\\.0\\.0\\.1:${String(DEBUG_PORT)}\\/devtools\\/page\\/[^\\/\\s?#]+(?![\\s\\S])/`
);

const parseDebugTargets = type("string.json.parse").to(
    type({
        id: "string",
        type: "string",
        url: "string",
        webSocketDebuggerUrl: "string"
    }).array()
);

type DebugTarget = (typeof parseDebugTargets.infer)[number];

interface TargetQuery {
    readonly targetId?: string;
    readonly timeoutMs?: number;
}

const getAmazonMusicTarget = async ({
    targetId,
    timeoutMs = TARGET_REQUEST_TIMEOUT_MS
}: TargetQuery = {}): Promise<DebugTarget | null> => {
    const response = await fetch(DEBUG_ENDPOINT, { signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) {
        throw new Error(`Remote debugging endpoint returned ${String(response.status)}.`);
    }

    const targets = parseDebugTargets(await response.text());
    if (targets instanceof type.errors) {
        throw new Error(`Invalid remote debugging target list: ${targets.summary}`);
    }

    return (
        targets.find(
            (target) =>
                (!targetId || target.id === targetId) &&
                target.type === "page" &&
                isAmazonMusicWebAppUrl(target.url) &&
                parseCdpWebSocketUrl.allows(target.webSocketDebuggerUrl)
        ) ?? null
    );
};

export { getAmazonMusicTarget, type DebugTarget };
