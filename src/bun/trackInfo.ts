import type { CdpClient } from "./cdp";
import { parsePlaybackSnapshot } from "./playback";
import { type } from "arktype";

const AMAZON_MUSIC_LINK_BASE = "https://music.amazon.co.jp/albums";

const parseTrackInfo = type({
    album: "string | null",
    artist: "string | null",
    coverImage: "string | null",
    link: "string | null",
    title: "string"
});

const parseTrackSnapshot = type({
    playback: parsePlaybackSnapshot,
    trackInfo: parseTrackInfo
});

type TrackInfo = typeof parseTrackInfo.infer;
type TrackSnapshot = typeof parseTrackSnapshot.infer;

const getTrackInfoKey = (trackInfo: TrackInfo): string => JSON.stringify(trackInfo);

const extractTrackInfo = async (client: CdpClient): Promise<TrackSnapshot | null> => {
    const value = await client.evaluate(`
        (() => {
            const getText = (selectors) => {
                for (const selector of selectors) {
                    const element = document.querySelector(selector);
                    const text = element && (element.textContent || '').trim();
                    if (text) return text;
                }
                return null;
            };
            const imageElement = document.querySelector('.trackMetadataWrapper .artImage') || document.querySelector('.artwork .artImage');
            const imageUrl = imageElement && (imageElement.currentSrc || imageElement.getAttribute('src'));
            const currentPlaybackPosition = document.querySelector('#transport .currentPlaybackPosition');
            const currentRemainingPosition = document.querySelector('#transport .currentRemainingPosition');
            const playPauseIcon = document.querySelector('#transport .playPause svg');
            const transport = document.querySelector('#transportContainer');
            const transportVue = transport && transport.__vue__;
            const track = transportVue && transportVue.track;
            const trackAsin = track && typeof track.asin === 'string' ? track.asin : null;
            const albumAsin = track && track.album && typeof track.album.asin === 'string' ? track.album.asin : null;
            const link = trackAsin && albumAsin
                ? '${AMAZON_MUSIC_LINK_BASE}/' + encodeURIComponent(albumAsin) + '?trackAsin=' + encodeURIComponent(trackAsin)
                : null;
            const title = getText(['.trackMetadata .title', '.trackTitle']);
            if (!title) return null;
            return {
                playback: {
                    currentPlaybackPosition: currentPlaybackPosition && currentPlaybackPosition.textContent
                        ? currentPlaybackPosition.textContent.trim()
                        : null,
                    currentRemainingPosition: currentRemainingPosition && currentRemainingPosition.textContent
                        ? currentRemainingPosition.textContent.trim()
                        : null,
                    isPlaying: Boolean(playPauseIcon && playPauseIcon.classList.contains('svg-icon--pause'))
                },
                trackInfo: {
                    album: getText(['.trackMetadata .secondaryInnerText:last-child']),
                    artist: getText(['.trackMetadata .secondaryInnerText:first-child']),
                    coverImage: typeof imageUrl === 'string' && imageUrl ? imageUrl : null,
                    link: link,
                    title: title
                }
            };
        })()
    `);

    const trackSnapshot = parseTrackSnapshot(value);
    return trackSnapshot instanceof type.errors ? null : trackSnapshot;
};

export { extractTrackInfo, getTrackInfoKey, type TrackInfo };
