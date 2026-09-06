import { type MouseEvent, type ReactNode, useEffect, useState } from "react";
import {
    artistStyles,
    containerStyles,
    coverStyles,
    linkStyles,
    progressIndicatorStyles,
    progressLabelStyles,
    progressStyles,
    progressTrackStyles,
    titleStyles
} from "./RichPresencePlayer.css";
import { EmptyCover } from "./EmptyCover";
import type { OpenAmazonMusicParams } from "../../shared/rpc";
import type { PlaybackTimestamps } from "../../shared/playback";
import { Progress } from "@base-ui/react/progress";
import type { TrackInfo } from "../../shared/trackInfo";
import { buildAmazonMusicAlbumUrl } from "../../utils/amazonMusicUrl";

const MILLISECONDS_PER_SECOND = 1_000;
const MINUTES_PER_HOUR = 60;
const NO_SECONDS = 0;
const PROGRESS_FALLBACK_MAX = 1;
const PROGRESS_UPDATE_INTERVAL_MS = 250;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = MINUTES_PER_HOUR * SECONDS_PER_MINUTE;
const TIME_PART_WIDTH = 2;

interface RichPresencePlayerProps {
    amazonMusicHostname?: string | null;
    trackInfo?: Partial<TrackInfo> | null;
    playbackTimestamps?: PlaybackTimestamps | null;
    openAmazonMusic: (params: OpenAmazonMusicParams) => Promise<boolean>;
}

const formatTime = (seconds: number): string => {
    const totalSeconds = Math.max(NO_SECONDS, Math.floor(seconds));
    const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
    const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
    const remainingSeconds = totalSeconds % SECONDS_PER_MINUTE;
    const paddedMinutes = String(minutes).padStart(TIME_PART_WIDTH, "0");
    const paddedSeconds = String(remainingSeconds).padStart(TIME_PART_WIDTH, "0");

    return hours > NO_SECONDS
        ? `${String(hours)}:${paddedMinutes}:${paddedSeconds}`
        : `${String(minutes)}:${paddedSeconds}`;
};

interface PlaybackProgressProps {
    readonly playbackTimestamps: PlaybackTimestamps | null | undefined;
}

const PlaybackProgress = ({ playbackTimestamps }: PlaybackProgressProps): ReactNode => {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!playbackTimestamps) {
            return (): void => {
                // No timer was created for an absent playback timestamp.
            };
        }

        const intervalId = setInterval(() => {
            setNow(Date.now());
        }, PROGRESS_UPDATE_INTERVAL_MS);

        return (): void => {
            clearInterval(intervalId);
        };
    }, [playbackTimestamps]);

    const durationSeconds = playbackTimestamps
        ? Math.max(
              NO_SECONDS,
              (playbackTimestamps.endTimestamp - playbackTimestamps.startTimestamp) / MILLISECONDS_PER_SECOND
          )
        : NO_SECONDS;
    const currentSeconds = playbackTimestamps
        ? Math.min(
              durationSeconds,
              Math.max(NO_SECONDS, (now - playbackTimestamps.startTimestamp) / MILLISECONDS_PER_SECOND)
          )
        : NO_SECONDS;
    const progressMax = durationSeconds > NO_SECONDS ? durationSeconds : PROGRESS_FALLBACK_MAX;

    return (
        <Progress.Root className={progressStyles} max={progressMax} value={currentSeconds}>
            <Progress.Label className={progressLabelStyles}>
                {`${formatTime(currentSeconds)} / ${formatTime(durationSeconds)}`}
            </Progress.Label>
            <Progress.Track className={progressTrackStyles}>
                <Progress.Indicator className={progressIndicatorStyles} />
            </Progress.Track>
        </Progress.Root>
    );
};

interface PlayerContentProps {
    readonly album: string | null | undefined;
    readonly artist: string | null | undefined;
    readonly coverImage: string | null | undefined;
    readonly playbackTimestamps: PlaybackTimestamps | null | undefined;
    readonly title: string | null | undefined;
}

const PlayerContent = ({ album, artist, coverImage, playbackTimestamps, title }: PlayerContentProps): ReactNode => {
    const normalizedArtist = artist ? `by ${artist}` : "by unknown artist";
    const normalizedAlbum = album ? `from ${album}` : "from unknown album";

    return (
        <article className={containerStyles}>
            {coverImage ? (
                <img className={coverStyles} src={coverImage} width={500} height={500} alt="" />
            ) : (
                <EmptyCover className={coverStyles} />
            )}
            <h2 className={titleStyles}>{title ?? "Unknown music"}</h2>
            <div className={artistStyles}>{`${normalizedArtist} ${normalizedAlbum}`}</div>
            <PlaybackProgress playbackTimestamps={playbackTimestamps} />
        </article>
    );
};

interface OpenAlbumOptions {
    onError: () => void;
    openAmazonMusic: RichPresencePlayerProps["openAmazonMusic"];
    params: OpenAmazonMusicParams;
}

const openAlbum = async (
    event: MouseEvent<HTMLAnchorElement>,
    { onError, openAmazonMusic, params }: OpenAlbumOptions
): Promise<void> => {
    event.preventDefault();
    try {
        if (!(await openAmazonMusic(params))) onError();
    } catch {
        onError();
    }
};

const RichPresencePlayer = ({
    amazonMusicHostname,
    openAmazonMusic,
    playbackTimestamps,
    trackInfo
}: RichPresencePlayerProps): ReactNode => {
    const { album, artist, coverImage, title, albumId, trackId } = trackInfo ?? {};

    const amazonMusicUrl =
        amazonMusicHostname && albumId && trackId
            ? buildAmazonMusicAlbumUrl(amazonMusicHostname, albumId, trackId)
            : null;
    const amazonMusicParams =
        amazonMusicHostname && albumId && trackId ? { albumId, amazonMusicHostname, trackId } : null;

    const content = (
        <PlayerContent
            album={album}
            artist={artist}
            coverImage={coverImage}
            playbackTimestamps={playbackTimestamps}
            title={title}
        />
    );

    if (!amazonMusicUrl || !amazonMusicParams) return content;

    return (
        <a
            className={linkStyles}
            href={amazonMusicUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Listen to ${title ?? "Unknown music"}${artist ? ` by ${artist}` : ""} on Amazon Music`}
            onClick={(event) => {
                void openAlbum(event, {
                    onError: () => {
                        open(amazonMusicUrl, "_blank", "noopener,noreferrer");
                    },
                    openAmazonMusic,
                    params: amazonMusicParams
                });
            }}
        >
            {content}
        </a>
    );
};

export { RichPresencePlayer };
