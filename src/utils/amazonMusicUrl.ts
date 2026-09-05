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
    "amazon.in",
    // Ref: https://press.aboutamazon.com/2017/12/amazon-music-unlimited-expands-to-28-more-countries-around-the-world
    "amazonmusic.com",
    "www.amazonmusic.com"
] as const;

const isAmazonMusicWebAppHostname = (hostname: string): boolean =>
    AMAZON_MUSIC_WEB_APP_DOMAINS.some(
        (domain) => hostname === domain || hostname === `music.${domain}` || hostname === `www.${domain}`
    );

const parseAmazonMusicWebAppUrl = type("string.url.parse").narrow(
    (url) =>
        url.protocol === "https:" &&
        url.pathname === "/morpho/webapp/index.html" &&
        isAmazonMusicWebAppHostname(url.hostname)
);

const isAmazonMusicWebAppUrl = (value: string): boolean => parseAmazonMusicWebAppUrl(value) instanceof URL;

const buildAmazonMusicAlbumUrl = (albumId: string, trackId: string): string =>
    `https://music.amazon.co.jp/albums/${encodeURIComponent(albumId)}?trackAsin=${encodeURIComponent(trackId)}`;

export { buildAmazonMusicAlbumUrl, isAmazonMusicWebAppUrl, parseAmazonMusicWebAppUrl };
