import { type } from "arktype";

const AMAZON_MUSIC_WEB_APP_DOMAINS = [
    // Ref: https://en.wikipedia.org/wiki/Amazon_Music
    "amazon.com",
    "amazon.co.uk",
    "amazon.de",
    "amazon.fr",
    "amazon.it",
    "amazon.es",
    "amazon.co.jp",
    "amazon.ca",
    "amazon.com.au",
    "amazon.com.mx",
    "amazon.com.br",
    "amazon.in"
] as const;

const isAmazonMusicHostname = (hostname: string): boolean =>
    AMAZON_MUSIC_WEB_APP_DOMAINS.some(
        (domain) => hostname === domain || hostname === `music.${domain}` || hostname === `www.${domain}`
    );

const parseAmazonMusicWebAppUrl = type("string.url.parse").narrow(
    (url) =>
        url.protocol === "https:" && url.pathname === "/morpho/webapp/index.html" && isAmazonMusicHostname(url.hostname)
);

const isAmazonMusicWebAppUrl = (value: string): boolean => parseAmazonMusicWebAppUrl(value) instanceof URL;

const buildAmazonMusicAlbumUrl = (hostname: string, albumId: string, trackId: string): string | null => {
    if (!isAmazonMusicHostname(hostname)) return null;
    const musicHostname = hostname.startsWith("music.") ? hostname : `music.${hostname.replace(/^www\./u, "")}`;
    return `https://${musicHostname}/albums/${albumId}?trackAsin=${trackId}`;
};

export { buildAmazonMusicAlbumUrl, isAmazonMusicWebAppUrl };
