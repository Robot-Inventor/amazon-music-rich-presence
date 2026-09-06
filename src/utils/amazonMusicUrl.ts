import { type } from "arktype";

// Ref: https://en.wikipedia.org/wiki/Amazon_Music
const AMAZON_MUSIC_REGIONAL_DATA = (
    [
        {
            hostname: "amazon.com",
            region: "us",
            // Ref: https://www.digitalmusicnews.com/2025/08/21/music-streaming-market-share-data-august-2025/
            users: 31_500_000
        },
        {
            hostname: "amazon.de",
            region: "de",
            // 38.057M * 26.3% ≒ 10M
            // Ref: https://www.lfk.de/fileadmin/PDFs/Publikationen/Studien/Online-Audio-Monitor/online-audio-monitor-2025.pdf
            users: 10_000_000
        },
        {
            hostname: "amazon.in",
            region: "in",
            // 175M * 5.3% ≒ 9.3M
            // Ref: https://bsmedia.business-standard.com/_media/bs/data/market-reports/equity-brokertips/2025-07/17521375570.84660000.pdf
            users: 9_300_000
        },
        {
            hostname: "amazon.co.jp",
            region: "jp",
            // Ref: https://prtimes.jp/main/html/rd/p/000000128.000047896.html
            users: 8_890_000
        },
        {
            hostname: "amazon.co.uk",
            region: "gb",
            // Ref: https://www.musicweek.com/digital/read/midia-spotify-secures-almost-half-of-uk-streaming-market-but-overall-subscriber-growth-slows/091682
            users: 8_700_000
        },
        {
            hostname: "amazon.ca",
            region: "ca",
            // 35.39M * 14% ≒ 4.95M
            // Ref: https://epe.lac-bac.gc.ca/100/200/301/pwgsc-tpsgc/por-ef/crtc/2026/006-25-e/POR_006-25_Report_EN.html?nodisclaimer=1
            // Ref: https://www150.statcan.gc.ca/n1/daily-quotidien/250924/dq250924a-eng.htm?indgeo=0&indid=4236-4
            users: 4_950_000
        },
        {
            hostname: "amazon.com.br",
            region: "br",
            // Ref: https://sensortower.com/blog/2025-q4-unified-top-5-music-and-podcasts-revenue-br-64c7e0f6e1714cfff17dc5e6,
            users: 3_100_000
        },
        {
            hostname: "amazon.com.mx",
            region: "mx",
            // Ref: https://sensortower.com/blog/2025-q4-unified-top-5-music-and-podcasts-revenue-mx-64c7e0f6e1714cfff17dc5e6
            users: 1_900_000
        },
        {
            hostname: "amazon.it",
            region: "it",
            // Ref: https://sensortower.com/blog/2025-q4-unified-top-5-music-and-podcasts-revenue-it-64c7e0f6e1714cfff17dc5e6
            users: 1_680_000
        },
        {
            hostname: "amazon.fr",
            region: "fr",
            // Ref: https://sensortower.com/blog/2025-q2-unified-top-5-music%20and%20podcasts-revenue-fr-64c7e0f6e1714cfff17dc5e6
            users: 1_400_000
        },
        {
            hostname: "amazon.es",
            region: "es",
            // Ref: https://sensortower.com/blog/2025-q4-unified-top-5-music-and-podcasts-revenue-es-64c7e0f6e1714cfff17dc5e6
            users: 1_100_000
        },
        {
            hostname: "amazon.com.au",
            region: "au",
            // 27.6M * 72% * 6% ≒ 1.2M
            // Ref: https://www.mofa.go.jp/mofaj/area/australia/data.html
            // Ref: https://www.acma.gov.au/sites/default/files/2026-03/Trends%20and%20developments%20in%20viewing%20and%20listening%202024-25.pdf
            users: 1_200_000
        }
    ] as const satisfies Array<{ hostname: string; region: string; users: number }>
).toSorted((left, right) => right.users - left.users);

const AMAZON_MUSIC_HOSTNAMES = AMAZON_MUSIC_REGIONAL_DATA.map((data) => data.hostname);

const isAmazonMusicHostname = (hostname: string): boolean =>
    AMAZON_MUSIC_HOSTNAMES.some(
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

const buildRegionNeutralAmazonMusicAlbumUrl = (trackId: string): { short: string; long: string } => {
    // Discord Rich Presence button URLs have a 512-character limit, so specify the top 5 regions as a fallback.
    // Additionally, since `largeImageUrl` has a 256-character limit, also create a link with a fallback only to the global and JP version
    // eslint-disable-next-line no-magic-numbers
    const fallbackUrls = AMAZON_MUSIC_REGIONAL_DATA.slice(0, 5)
        .map((data) => `&$fallback_url_${data.region}=https://music.${data.hostname}/tracks/${trackId}`)
        .join("");
    return {
        long: `https://am.app.link/?$deeplink_path=tracks/${trackId}&$fallback_url=https://music.amazon.com/tracks/${trackId}${fallbackUrls}`,
        short: `https://am.app.link/?$deeplink_path=tracks/${trackId}&$fallback_url=https://music.amazon.com/tracks/${trackId}&$fallback_url_jp=https://music.amazon.co.jp/tracks/${trackId}`
    };
};

export { buildAmazonMusicAlbumUrl, buildRegionNeutralAmazonMusicAlbumUrl, isAmazonMusicWebAppUrl };
