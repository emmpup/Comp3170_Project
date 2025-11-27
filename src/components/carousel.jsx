import "./carousel.css";
import { useState, useEffect, useRef } from "react";
import youtubeService from "../services/youtubeService";
import Player from "./player";

const Carousel = ({
    isEditing = false,
    onTrackSelect,
    onPlaylistLoad,
    currentIndex: externalIndex,
    setCurrentIndex: setExternalIndex,
    shouldStop = false,
    setShouldStop,
    isPlaying = false,
    setIsPlaying,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [albumData, setAlbumData] = useState([]);
    const [currentVideoId, setCurrentVideoId] = useState(null);
    const [currentDuration, setCurrentDuration] = useState(0);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const stopProcessedRef = useRef(false);
    const playerRef = useRef(null);
    const durationCacheRef = useRef({});

    useEffect(() => {
        // Load playlist from localStorage
        const savedPlaylist = localStorage.getItem("myPlaylist");
        if (savedPlaylist) {
            try {
                const items = JSON.parse(savedPlaylist);
                setAlbumData(items);
                if (onPlaylistLoad) {
                    onPlaylistLoad(items);
                }
                // Auto-play first song on initial load
                setIsInitialLoad(false);
            } catch (error) {
                console.error(
                    "Error parsing playlist from localStorage:",
                    error
                );
            }
        } else {
            setIsInitialLoad(false);
        }

        // Listen for storage changes (from other tabs/windows)
        const handleStorageChange = (e) => {
            if (e.key === "myPlaylist") {
                const items = e.newValue ? JSON.parse(e.newValue) : [];
                setAlbumData(items);
                if (onPlaylistLoad) {
                    onPlaylistLoad(items);
                }
            }
        };

        // Listen for custom playlist update event (from same window)
        const handlePlaylistUpdated = () => {
            const savedPlaylist = localStorage.getItem("myPlaylist");
            if (savedPlaylist) {
                try {
                    const items = JSON.parse(savedPlaylist);
                    setAlbumData(items);
                    if (onPlaylistLoad) {
                        onPlaylistLoad(items);
                    }
                } catch (error) {
                    console.error(
                        "Error parsing playlist from localStorage:",
                        error
                    );
                }
            }
        };

        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("playlistUpdated", handlePlaylistUpdated);
        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener(
                "playlistUpdated",
                handlePlaylistUpdated
            );
        };
    }, [onPlaylistLoad]);

    useEffect(() => {
        if (externalIndex !== undefined && externalIndex !== currentIndex) {
            setCurrentIndex(externalIndex);
        }
    }, [externalIndex]);

    useEffect(() => {
        if (shouldStop && !stopProcessedRef.current) {
            stopProcessedRef.current = true;
            // Pause the player instead of stopping it
            if (playerRef.current && playerRef.current.pauseVideo) {
                playerRef.current.pauseVideo();
            }
            if (setShouldStop) {
                setShouldStop(false);
            }
        }
        if (!shouldStop) {
            stopProcessedRef.current = false;
        }
    }, [shouldStop, setShouldStop]);

    useEffect(() => {
        if (albumData.length > 0) {
            const currentAlbum = albumData[currentIndex];
            if (currentAlbum) {
                // Handle both YouTube search result format (id.videoId) and YouTube playlist format (snippet.resourceId.videoId)
                const videoId =
                    currentAlbum.id?.videoId ||
                    currentAlbum.snippet?.resourceId?.videoId ||
                    currentAlbum.id;
                if (videoId) {
                    setCurrentVideoId(videoId);

                    // Fetch video details to get duration
                    const fetchVideoDuration = async () => {
                        // Check cache first
                        if (durationCacheRef.current[videoId] !== undefined) {
                            setCurrentDuration(
                                durationCacheRef.current[videoId]
                            );
                            return;
                        }

                        try {
                            const videoDetails =
                                await youtubeService.getVideoDetails(videoId);

                            if (videoDetails.items && videoDetails.items[0]) {
                                const duration =
                                    videoDetails.items[0].contentDetails
                                        ?.duration;

                                if (duration) {
                                    // Parse ISO 8601 duration format (e.g., "PT4M33S")
                                    const match = duration.match(
                                        /PT(\d+H)?(\d+M)?(\d+S)?/
                                    );
                                    let totalSeconds = 0;
                                    if (match) {
                                        if (match[1])
                                            totalSeconds +=
                                                parseInt(match[1]) * 3600;
                                        if (match[2])
                                            totalSeconds +=
                                                parseInt(match[2]) * 60;
                                        if (match[3])
                                            totalSeconds += parseInt(match[3]);
                                    }
                                    durationCacheRef.current[videoId] =
                                        totalSeconds;
                                    setCurrentDuration(totalSeconds);
                                }
                            }
                        } catch (error) {
                            console.error(
                                "Error fetching video details:",
                                error
                            );
                            durationCacheRef.current[videoId] = 0;
                            setCurrentDuration(0);
                        }
                    };

                    fetchVideoDuration();

                    // Auto-play first song on initial page load
                    if (isInitialLoad && onTrackSelect) {
                        onTrackSelect(currentAlbum, currentIndex);
                    }
                }
            }
        }
    }, [currentIndex, albumData, isInitialLoad, onTrackSelect]);

    const nextSlide = () => {
        const newIndex =
            currentIndex === albumData.length - 1 ? 0 : currentIndex + 1;
        console.log("Next slide:", currentIndex, "->", newIndex);
        setCurrentIndex(newIndex);
        if (setExternalIndex) {
            setExternalIndex(newIndex);
        }
        if (onTrackSelect && albumData[newIndex]) {
            console.log("Calling onTrackSelect with:", albumData[newIndex]);
            onTrackSelect(albumData[newIndex], newIndex);
        }
    };

    const prevSlide = () => {
        const newIndex =
            currentIndex === 0 ? albumData.length - 1 : currentIndex - 1;
        console.log("Prev slide:", currentIndex, "->", newIndex);
        setCurrentIndex(newIndex);
        if (setExternalIndex) {
            setExternalIndex(newIndex);
        }
        if (onTrackSelect && albumData[newIndex]) {
            console.log("Calling onTrackSelect with:", albumData[newIndex]);
            onTrackSelect(albumData[newIndex], newIndex);
        }
    };

    const handleAlbumClick = (album, index) => {
        if (!isEditing) {
            const actualIndex =
                (currentIndex + index - 2 + albumData.length) %
                albumData.length;
            setCurrentIndex(actualIndex);
            if (setExternalIndex) {
                setExternalIndex(actualIndex);
            }
            if (onTrackSelect) {
                onTrackSelect(album, actualIndex);
            }
        }
    };

    const getVisibleAlbums = () => {
        const visible = [];
        const total = albumData.length;

        for (let i = -2; i <= 2; i++) {
            const index = (currentIndex + i + total) % total;
            visible.push({
                ...albumData[index],
                position: i,
                isCenter: i === 0,
            });
        }

        return visible;
    };

    const visibleAlbums = getVisibleAlbums();
    const currentAlbum = albumData[currentIndex];

    if (albumData.length === 0) {
        return (
            <div className='carousel-container'>
                <div className='empty-carousel'>
                    <p>Your playlist is empty</p>
                    <p>Use the search button to add songs to your playlist!</p>
                </div>
            </div>
        );
    }

    const handlePlayVideo = (album) => {
        const videoId = album.snippet?.resourceId?.videoId;
        if (videoId) {
            setCurrentVideoId(videoId);
        }
    };

    const handleDeleteFromPlaylist = (videoId, e) => {
        e.stopPropagation();

        // Find the video to delete - handle both YouTube playlist format and search result format
        const videoToDelete = albumData.find((item) => {
            const id = item.id?.videoId || item.id;
            return id === videoId;
        });

        if (!videoToDelete) return;

        const updatedPlaylist = albumData.filter((item) => {
            const id = item.id?.videoId || item.id;
            return id !== videoId;
        });

        setAlbumData(updatedPlaylist);
        localStorage.setItem("myPlaylist", JSON.stringify(updatedPlaylist));

        // Reset index if needed
        if (
            currentIndex >= updatedPlaylist.length &&
            updatedPlaylist.length > 0
        ) {
            const newIndex = updatedPlaylist.length - 1;
            setCurrentIndex(newIndex);
            if (setExternalIndex) {
                setExternalIndex(newIndex);
            }
        }
    };

    return (
        <div className='carousel-container'>
            <div className='carousel'>
                <div className='carousel-track'>
                    {visibleAlbums.map((album, index) => (
                        <div
                            key={`album-${album.position}`}
                            className={`album-cover ${
                                album.isCenter ? "center" : "side"
                            }`}
                            onClick={() => handleAlbumClick(album, index)}
                            style={{
                                cursor: isEditing ? "default" : "pointer",
                            }}
                        >
                            {isEditing && (
                                <button
                                    className='album-delete'
                                    onClick={(e) => {
                                        const videoId =
                                            album.id?.videoId || album.id;
                                        handleDeleteFromPlaylist(videoId, e);
                                    }}
                                >
                                    X
                                </button>
                            )}
                            {album.snippet?.thumbnails?.maxres?.url ? (
                                <img
                                    src={album.snippet.thumbnails.maxres.url}
                                    alt={album.snippet.title}
                                />
                            ) : album.snippet?.thumbnails?.high?.url ? (
                                <img
                                    src={album.snippet.thumbnails.high.url}
                                    alt={album.snippet.title}
                                />
                            ) : album.snippet?.thumbnails?.medium?.url ? (
                                <img
                                    src={album.snippet.thumbnails.medium.url}
                                    alt={album.snippet.title}
                                />
                            ) : album.snippet?.thumbnails?.default?.url ? (
                                <img
                                    src={album.snippet.thumbnails.default.url}
                                    alt={album.snippet.title}
                                />
                            ) : (
                                <div className='placeholder-cover'>
                                    <span>
                                        {album.snippet?.title || "Untitled"}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className='work-stage'>
                <button className='carousel-btn prev-btn' onClick={prevSlide}>
                    ‹
                </button>
                <div className='current-track-info'>
                    <h3 className='track-title'>
                        {currentAlbum?.snippet?.title || "Unknown"}
                    </h3>
                    <p className='track-artist'>
                        {currentAlbum?.snippet?.videoOwnerChannelTitle ||
                            currentAlbum?.snippet?.channelTitle ||
                            "Unknown Artist"}
                    </p>
                </div>
                <button className='carousel-btn next-btn' onClick={nextSlide}>
                    ›
                </button>
            </div>
            <Player
                ref={playerRef}
                videoId={currentVideoId}
                duration={currentDuration}
                onPrev={prevSlide}
                onNext={nextSlide}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
            />
        </div>
    );
};

export default Carousel;
