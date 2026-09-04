import { type } from "arktype";

const DEBUG_PORT = 52856;
const DEBUG_ENDPOINT = `http://127.0.0.1:${DEBUG_PORT}/json/list`;

const parseDebugTargets = type("string.json.parse").to(
    type({
        id: /^[A-F0-9]+$/,
        title: "string",
        type: "string",
        url: "string"
    }).array()
);

type DebugTarget = (typeof parseDebugTargets.infer)[number];

const getAmazonMusicTarget = async (): Promise<DebugTarget> => {
    const response = await fetch(DEBUG_ENDPOINT);
    if (!response.ok) throw new Error(`Remote debugging endpoint returned ${response.status}.`);

    const targets = parseDebugTargets(await response.text());
    if (targets instanceof type.errors) throw new Error(`Invalid remote debugging target list: ${targets.summary}`);

    const target = targets.find((value) => value.type === "page" && value.url.includes("amazon.co.jp"));
    if (!target) throw new Error("Amazon Music page was not found. Start it with the Rich Presence app first.");

    return target;
};

const getChromePath = (): string => {
    const candidates = [
        `${Bun.env["PROGRAMFILES"] ?? ""}\\Google\\Chrome\\Application\\chrome.exe`,
        `${Bun.env["PROGRAMFILES(X86)"] ?? ""}\\Google\\Chrome\\Application\\chrome.exe`,
        `${Bun.env["LOCALAPPDATA"] ?? ""}\\Google\\Chrome\\Application\\chrome.exe`
    ];
    const chromePath = candidates.find((path) => path && Bun.file(path).size > 0);
    if (!chromePath) throw new Error("Google Chrome executable was not found.");
    return chromePath;
};

const openInChrome = async (chromePath: string, url: string): Promise<void> => {
    Bun.spawn([chromePath, "--new-window", "about:blank"], {
        detached: true,
        stdio: ["ignore", "ignore", "ignore"]
    }).unref();

    const command = [
        "Start-Sleep -Milliseconds 1000",
        "$shell = New-Object -ComObject WScript.Shell",
        "if (!$shell.AppActivate('about:blank - Google Chrome')) { exit 1 }",
        "$shell.SendKeys('^l')",
        `$shell.SendKeys('${url}')`,
        "$shell.SendKeys('{ENTER}')"
    ].join("; ");

    const subprocess = Bun.spawn(["powershell.exe", "-NoProfile", "-Command", command], {
        stdio: ["ignore", "ignore", "ignore"]
    });
    if ((await subprocess.exited) !== 0) throw new Error("Could not activate the Chrome address bar.");
};

let url = "";

try {
    const target = await getAmazonMusicTarget();
    url = `devtools://devtools/bundled/inspector.html?ws=127.0.0.1:${DEBUG_PORT}/devtools/page/${target.id}`;

    await openInChrome(getChromePath(), url);
    console.log(`Opened DevTools for ${target.title}.`);
} catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
} finally {
    console.log(url);
}
