import { type } from "arktype";

const DEBUG_PORT = 52856;
const DEBUG_ENDPOINT = `http://127.0.0.1:${String(DEBUG_PORT)}/json/list`;
const TARGET_REQUEST_TIMEOUT_MS = 1_000;
const parseCdpWebSocketUrl = type(`/^ws:\\/\\/127\\.0\\.0\\.1:${String(DEBUG_PORT)}\\/devtools\\/page\\/[^\\/]+$/`);
const parseTargetUrl = type("string.url.parse");
const parseAmazonHostname = type(/^(?:[a-z\d-]+\.)*amazon\.(?:com|co\.[a-z]{2}|com\.[a-z]{2}|[a-z]{2})$/u);

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

const isAmazonMusicUrl = (targetUrl: string): boolean => {
    const url = parseTargetUrl(targetUrl);
    return (
        !(url instanceof type.errors) &&
        url.protocol === "https:" &&
        url.pathname === "/morpho/webapp/index.html" &&
        parseAmazonHostname.allows(url.hostname)
    );
};

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
                isAmazonMusicUrl(target.url) &&
                parseCdpWebSocketUrl.allows(target.webSocketDebuggerUrl)
        ) ?? null
    );
};

export { getAmazonMusicTarget, type DebugTarget };
