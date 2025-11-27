import "./Player.css";
import {
    useState,
    useEffect,
    useRef,
    forwardRef,
    useImperativeHandle,
} from "react";

const Player = forwardRef(
    (
        {
            videoId,
            onPrev,
            onNext,
            isPlaying,
            setIsPlaying,
            duration: initialDuration,
        },
        ref
    ) => {
        const [isPlayingLocal, setIsPlayingLocal] = useState(false);
        const [elapsedTime, setElapsedTime] = useState(0);
        const [duration, setDuration] = useState(initialDuration || 0);
        const [apiReady, setApiReady] = useState(!!window.YT);
        const containerRef = useRef(null);
        const playerRef = useRef(null);
        const playStartTimeRef = useRef(null);

        useImperativeHandle(ref, () => ({
            pauseVideo: () => {
                if (playerRef.current && playerRef.current.pauseVideo) {
                    playerRef.current.pauseVideo();
                    setIsPlayingLocal(false);
                }
            },
        }));

        // Load YouTube IFrame API
        useEffect(() => {
            if (window.YT) {
                setApiReady(true);
                return;
            }

            window.onYouTubeIframeAPIReady = () => {
                setApiReady(true);
            };

            const tag = document.createElement("script");
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName("script")[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }, []);

        // Initialize player when container is ready
        useEffect(() => {
            const initializePlayer = () => {
                if (!window.YT || !window.YT.Player || !containerRef.current)
                    return;

                // Only create player once
                if (playerRef.current) return;

                playerRef.current = new window.YT.Player(containerRef.current, {
                    width: "100%",
                    height: "0",
                    videoId: videoId || "",
                    playerVars: {
                        autoplay: 0,
                        controls: 0,
                        modestbranding: 1,
                        origin: window.location.origin,
                    },
                    events: {
                        onReady: () => {
                            // Player is ready
                        },
                        onStateChange: (event) => {
                            if (event.data === window.YT.PlayerState.PLAYING) {
                                setIsPlayingLocal(true);
                                playStartTimeRef.current = Date.now();
                                if (setIsPlaying) setIsPlaying(true);
                            } else if (
                                event.data === window.YT.PlayerState.ENDED
                            ) {
                                setElapsedTime(0);
                                playStartTimeRef.current = null;
                                if (onNext) onNext();
                            } else if (
                                event.data === window.YT.PlayerState.PAUSED
                            ) {
                                setIsPlayingLocal(false);
                                playStartTimeRef.current = null;
                                if (setIsPlaying) setIsPlaying(false);
                            }
                        },
                        onError: (event) => {
                            console.error("YouTube player error:", event.data);
                        },
                    },
                });
            };

            if (apiReady && containerRef.current) {
                initializePlayer();
            }
        }, [apiReady, containerRef.current]);

        // Load video when videoId changes
        useEffect(() => {
            if (!playerRef.current || !videoId) return;

            try {
                playerRef.current.loadVideoById(videoId);
                setElapsedTime(0);
                setIsPlayingLocal(false);
            } catch (e) {
                console.error("Error loading video:", e);
            }
        }, [videoId]);

        // Update elapsed time while playing
        useEffect(() => {
            if (!isPlayingLocal || !playerRef.current) return;

            const interval = setInterval(() => {
                try {
                    const currentTime = playerRef.current.getCurrentTime();
                    setElapsedTime(Math.floor(currentTime));
                } catch (e) {
                    console.error("Error getting current time:", e);
                }
            }, 100);

            return () => clearInterval(interval);
        }, [isPlayingLocal]);

        // Update duration when initialDuration prop changes
        useEffect(() => {
            if (initialDuration && initialDuration > 0) {
                setDuration(initialDuration);
            }
        }, [initialDuration]);

        // Handle play/pause based on isPlaying prop
        useEffect(() => {
            if (!playerRef.current) return;

            if (isPlaying) {
                setElapsedTime(0);
                setIsPlayingLocal(true);
                try {
                    playerRef.current.playVideo();
                } catch (e) {
                    console.error("Error playing:", e);
                }
            } else {
                setIsPlayingLocal(false);
                try {
                    playerRef.current.pauseVideo();
                } catch (e) {
                    console.error("Error pausing:", e);
                }
            }
        }, [isPlaying, videoId]);

        const togglePlayPause = () => {
            if (!playerRef.current) return;

            try {
                if (isPlayingLocal) {
                    playerRef.current.pauseVideo();
                } else {
                    playerRef.current.playVideo();
                }
            } catch (e) {
                console.error("Error toggling play/pause:", e);
            }
        };

        const handlePrev = () => {
            if (onPrev) onPrev();
        };

        const handleNext = () => {
            if (onNext) onNext();
        };

        const formatTime = (seconds) => {
            if (isNaN(seconds) || seconds < 0) return "00:00";
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins.toString().padStart(2, "0")}:${secs
                .toString()
                .padStart(2, "0")}`;
        };

        const handleProgressClick = (e) => {
            if (!playerRef.current || !duration) return;

            const slider = e.currentTarget;
            const rect = slider.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            const newTime = Math.max(
                0,
                Math.min(duration, percentage * duration)
            );

            playerRef.current.seekTo(newTime, true);
            setElapsedTime(newTime);
            playStartTimeRef.current = Date.now() - newTime * 1000;
        };

        const progressPercentage =
            duration > 0 ? (elapsedTime / duration) * 100 : 0;

        return (
            <div className='player'>
                {/* YouTube IFrame API player container - hidden */}
                <div
                    ref={containerRef}
                    style={{
                        display: "none",
                        width: "100%",
                        height: "0",
                        visibility: "hidden",
                    }}
                ></div>

                <div className='buttons'>
                    <svg
                        className='prev btn'
                        onClick={handlePrev}
                        xmlns='http://www.w3.org/2000/svg'
                        width='18'
                        height='16'
                        viewBox='0 0 18 16'
                        fill='none'
                        style={{ cursor: "pointer" }}
                    >
                        <path
                            d='M3.75 8.43262C3.4169 8.24014 3.4169 7.75987 3.75 7.56738L12.75 2.3711C13.0833 2.17867 13.4999 2.41889 13.5 2.80371L13.5 13.1963C13.4999 13.5811 13.0833 13.8213 12.75 13.6289L3.75 8.43262Z'
                            fill='white'
                            stroke='white'
                        />
                        <line
                            x1='1.7998'
                            y1='14.2'
                            x2='1.79981'
                            y2='2.59995'
                            stroke='white'
                            strokeWidth='2'
                            strokeLinecap='round'
                        />
                    </svg>

                    <svg
                        className='pause-play btn'
                        onClick={togglePlayPause}
                        xmlns='http://www.w3.org/2000/svg'
                        width='24'
                        height='25'
                        viewBox='0 0 24 25'
                        fill='none'
                        style={{ cursor: "pointer" }}
                    >
                        {isPlayingLocal ? (
                            <>
                                <rect
                                    x='6'
                                    y='4'
                                    width='4'
                                    height='17'
                                    fill='white'
                                />
                                <rect
                                    x='14'
                                    y='4'
                                    width='4'
                                    height='17'
                                    fill='white'
                                />
                            </>
                        ) : (
                            <path
                                d='M22.5751 11.643C23.2212 12.0316 23.2212 12.9684 22.5751 13.357L7.51538 22.414C6.84888 22.8148 6 22.3348 6 21.557L6 3.443C6 2.66525 6.84887 2.1852 7.51538 2.58604L22.5751 11.643Z'
                                fill='white'
                            />
                        )}
                    </svg>

                    <svg
                        className='next btn'
                        onClick={handleNext}
                        xmlns='http://www.w3.org/2000/svg'
                        width='18'
                        height='15'
                        viewBox='0 0 18 15'
                        fill='none'
                        style={{ cursor: "pointer" }}
                    >
                        <path
                            d='M14.1377 7.06055C14.4864 7.24974 14.4864 7.75026 14.1377 7.93945L5.23828 12.7568C4.90513 12.9372 4.5 12.6952 4.5 12.3164L4.5 2.68359C4.5 2.30478 4.90514 2.06284 5.23828 2.24316L14.1377 7.06055Z'
                            fill='white'
                            stroke='white'
                        />
                        <line
                            x1='16.2002'
                            y1='1.75'
                            x2='16.2002'
                            y2='12.5'
                            stroke='white'
                            strokeWidth='2'
                            strokeLinecap='round'
                        />
                    </svg>
                </div>

                <div className='bar'>
                    <span>{formatTime(elapsedTime)}</span>
                    <div
                        className='slider'
                        onClick={handleProgressClick}
                        style={{
                            cursor: "pointer",
                            position: "relative",
                            overflow: "hidden",
                            width: "280px",
                            height: "2px",
                            backgroundColor: "rgba(255, 255, 255, 0.3)",
                        }}
                    >
                        {/* Progress indicator bar */}
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                height: "100%",
                                width: `${progressPercentage}%`,
                                backgroundColor: "white",
                                transition: "width 0.1s linear",
                            }}
                        ></div>
                    </div>
                    <span>{duration > 0 ? formatTime(duration) : "--:--"}</span>
                </div>
            </div>
        );
    }
);

export default Player;
