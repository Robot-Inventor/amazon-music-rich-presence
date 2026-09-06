import type { Protocol } from "devtools-protocol";
import { type } from "arktype";

const CDP_CONNECT_TIMEOUT_MS = 5_000;
const CDP_REQUEST_TIMEOUT_MS = 5_000;

interface CdpClient {
    readonly evaluate: (expression: string) => Promise<unknown>;
    readonly close: () => void;
}

interface PendingRequest {
    readonly resolve: (value: unknown) => void;
    readonly reject: (reason?: Error) => void;
}

class CdpDisconnectedError extends Error {}

const parseCdpMessage = type("string.json.parse").to(
    type({ id: "number", result: "unknown" }).or({ error: { message: "string" }, id: "number" })
);

const parseRuntimeEvaluateResponse = type({
    "exceptionDetails?": "unknown",
    result: {
        type: "string",
        "value?": "unknown"
    }
});

const handleCdpMessage = (event: MessageEvent, pending: Map<number, PendingRequest>): void => {
    if (typeof event.data !== "string") return;

    const message = parseCdpMessage(event.data);
    if (message instanceof type.errors) return;

    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);

    if ("error" in message) {
        request.reject(new Error(message.error.message));
        return;
    }

    request.resolve(message.result);
};

const rejectPendingRequests = (pending: Map<number, PendingRequest>): void => {
    const error = new CdpDisconnectedError("Amazon Music CDP WebSocket disconnected.");
    for (const request of pending.values()) request.reject(error);
    pending.clear();
};

const waitForCdpSocket = (socket: WebSocket, timeoutMs: number): Promise<void> =>
    new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            socket.close();
            reject(new Error("Amazon Music CDP WebSocket connection timed out."));
        }, timeoutMs);

        socket.addEventListener("open", () => {
            clearTimeout(timeout);
            resolve();
        });

        socket.addEventListener("error", () => {
            clearTimeout(timeout);
            socket.close();
            reject(new Error("Amazon Music CDP WebSocket disconnected."));
        });

        socket.addEventListener("close", () => {
            clearTimeout(timeout);
            reject(new Error("Amazon Music CDP WebSocket closed before connecting."));
        });
    });

const createCdpCall = (
    socket: WebSocket,
    pending: Map<number, PendingRequest>,
    isClosed: () => boolean
): ((method: string, params: Record<string, unknown>) => Promise<unknown>) => {
    let nextRequestId = 0;

    return (method: string, params: Record<string, unknown>): Promise<unknown> => {
        if (isClosed() || socket.readyState !== WebSocket.OPEN) {
            return Promise.reject(new CdpDisconnectedError("Amazon Music CDP WebSocket is closed."));
        }

        return new Promise((resolve, reject) => {
            const requestId = ++nextRequestId;

            const timeout = setTimeout(() => {
                pending.delete(requestId);
                reject(new Error("Amazon Music CDP request timed out."));
            }, CDP_REQUEST_TIMEOUT_MS);

            pending.set(requestId, {
                reject: (reason?: Error): void => {
                    clearTimeout(timeout);
                    reject(reason ?? new Error("Amazon Music CDP request failed."));
                },
                resolve: (value: unknown): void => {
                    clearTimeout(timeout);
                    resolve(value);
                }
            });

            try {
                socket.send(JSON.stringify({ id: requestId, method, params }));
            } catch {
                pending.delete(requestId);
                clearTimeout(timeout);
                reject(new CdpDisconnectedError("Amazon Music CDP WebSocket disconnected."));
            }
        });
    };
};

const createCdpClient = async (webSocketUrl: string, connectTimeoutMs = CDP_CONNECT_TIMEOUT_MS): Promise<CdpClient> => {
    const socket = new WebSocket(webSocketUrl);
    await waitForCdpSocket(socket, connectTimeoutMs);

    const pending = new Map<number, PendingRequest>();
    let isClosed = false;

    const close = (): void => {
        if (isClosed) return;
        isClosed = true;
        rejectPendingRequests(pending);
        socket.close();
    };

    const call = createCdpCall(socket, pending, () => isClosed);

    socket.addEventListener("message", (event) => {
        handleCdpMessage(event, pending);
    });
    socket.addEventListener("error", close);
    socket.addEventListener("close", close);

    return {
        close,
        evaluate: async (expression: string): Promise<unknown> => {
            const params = {
                awaitPromise: true,
                expression,
                returnByValue: true
            } satisfies Protocol.Runtime.EvaluateRequest;
            const response = await call("Runtime.evaluate", params);

            const parsedResponse = parseRuntimeEvaluateResponse(response);

            if (parsedResponse instanceof type.errors) throw new Error("Invalid response from Amazon Music CDP.");
            if ("exceptionDetails" in parsedResponse) throw new Error("Amazon Music DOM evaluation failed.");

            return parsedResponse.result.value;
        }
    };
};

export { CDP_CONNECT_TIMEOUT_MS, CdpDisconnectedError, createCdpClient, type CdpClient };
