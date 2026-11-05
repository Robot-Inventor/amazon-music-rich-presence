import type { Client } from "@xhayper/discord-rpc";

const DISCORD_REQUEST_TIMEOUT_MS = 5_000;

const toError = (error: unknown): Error => (error instanceof Error ? error : new Error(String(error)));

const withDiscordTimeout = <T>(request: Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error("Discord RPC request timed out."));
        }, DISCORD_REQUEST_TIMEOUT_MS);

        void request.then(
            (value) => {
                clearTimeout(timeout);
                resolve(value);
            },
            (error: unknown) => {
                clearTimeout(timeout);
                reject(toError(error));
            }
        );
    });

const destroyDiscordClient = async (client: Client): Promise<void> => {
    try {
        if (client.isConnected && client.user) {
            await withDiscordTimeout(client.user.clearActivity());
        }
    } catch {
        // The connection may already be closed while stopping.
    }

    await withDiscordTimeout(client.destroy());
};

const reconnectDiscordClient = async (client: Client): Promise<boolean> => {
    try {
        await withDiscordTimeout(client.login());

        return client.isConnected;
    } catch {
        return false;
    }
};

export { destroyDiscordClient, reconnectDiscordClient, withDiscordTimeout };
