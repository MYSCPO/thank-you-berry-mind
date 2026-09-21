import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: {
      Player: new (
        elementId: string | HTMLElement,
        options: {
          videoId: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number }) => void;
            onError?: (event: unknown) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState?: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
  }
}

export interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  destroy: () => void;
}

interface YouTubeAudioPlayerProps {
  videoId: string;
  isPlaying: boolean;
  onReady?: () => void;
  onEnded?: () => void;
}

export const YouTubeAudioPlayer: React.FC<YouTubeAudioPlayerProps> = ({
  videoId,
  isPlaying,
  onReady,
  onEnded
}) => {
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const containerId = useRef(`yt-audio-player-${Math.random().toString(36).substring(2, 9)}`);
  const isReadyRef = useRef(false);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  useEffect(() => {
    let isMounted = true;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      try {
        playerRef.current = new window.YT.Player(containerId.current, {
          videoId,
          playerVars: {
            enablejsapi: 1,
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            origin: window.location.origin
          },
          events: {
            onReady: (event) => {
              if (!isMounted) return;
              isReadyRef.current = true;
              event.target.setVolume(90);
              if (isPlayingRef.current) {
                event.target.playVideo();
              } else {
                event.target.pauseVideo();
              }
              onReady?.();
            },
            onStateChange: (event) => {
              // Ended
              if (event.data === 0) {
                onEnded?.();
              }
            },
            onError: (err) => {
              console.warn('YouTube Audio Player Error:', err);
            }
          }
        });
      } catch (e) {
        console.warn('Failed to initialize YouTube player:', e);
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      // Load YouTube IFrame API script once if not already present
      const existingScript = document.getElementById('youtube-iframe-api');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }

      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        if (isMounted) {
          initPlayer();
        }
      };
    }

    return () => {
      isMounted = false;
      try {
        const container = document.getElementById(containerId.current);
        const iframe = container?.querySelector('iframe');
        iframe?.contentWindow?.postMessage(
          JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }),
          '*'
        );
        iframe?.contentWindow?.postMessage(
          JSON.stringify({ event: 'command', func: 'stopVideo', args: '' }),
          '*'
        );
      } catch (e) {}
      try {
        playerRef.current?.pauseVideo();
        playerRef.current?.stopVideo();
        playerRef.current?.destroy();
      } catch (e) {}
      playerRef.current = null;
      isReadyRef.current = false;
    };
  }, [videoId]);

  // Handle play/pause commands reliably
  useEffect(() => {
    const container = document.getElementById(containerId.current);
    const iframe = container?.querySelector('iframe');

    if (isPlaying) {
      if (playerRef.current && isReadyRef.current) {
        try {
          playerRef.current.playVideo();
        } catch (e) {
          console.warn('Failed to play YouTube video:', e);
        }
      }
      try {
        iframe?.contentWindow?.postMessage(
          JSON.stringify({ event: 'command', func: 'playVideo', args: '' }),
          '*'
        );
      } catch (e) {}
    } else {
      // Completely stop/pause
      if (playerRef.current) {
        try {
          playerRef.current.pauseVideo();
        } catch (e) {}
        try {
          playerRef.current.stopVideo();
        } catch (e) {}
      }
      try {
        iframe?.contentWindow?.postMessage(
          JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }),
          '*'
        );
        iframe?.contentWindow?.postMessage(
          JSON.stringify({ event: 'command', func: 'stopVideo', args: '' }),
          '*'
        );
      } catch (e) {}
    }
  }, [isPlaying]);

  return (
    <div className="w-0 h-0 overflow-hidden opacity-0 pointer-events-none absolute -z-50">
      <div id={containerId.current} />
    </div>
  );
};
