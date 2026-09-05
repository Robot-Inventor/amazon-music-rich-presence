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

export { withDiscordTimeout };
