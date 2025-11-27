import { useState, useEffect, useRef } from "react";
import youtubeService from "../services/youtubeService";
import "./playlistManager.css";

const PlaylistManager = ({ onPlaySong, onStopSong }) => {
    const [playlist, setPlaylist] = useState([]);
    const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
    const isExternalUpdateRef = useRef(false);

    useEffect(() => {
        // Load playlist from localStorage on mount
        const loadPlaylist = () => {
            const savedPlaylist = localStorage.getItem("myPlaylist");
            if (savedPlaylist) {
                try {
                    const parsed = JSON.parse(savedPlaylist);
                    isExternalUpdateRef.current = true;
                    setPlaylist(parsed);
                } catch (error) {
                    console.error("Error parsing playlist:", error);
                }
            }
        };

        loadPlaylist();

        // Listen for playlist updates from other components (Header)
        window.addEventListener("playlistUpdated", loadPlaylist);

        return () => {
            window.removeEventListener("playlistUpdated", loadPlaylist);
        };
    }, []);

    useEffect(() => {
        // Skip writing to localStorage if this is an external update
        if (isExternalUpdateRef.current) {
            isExternalUpdateRef.current = false;
            return;
        }

        localStorage.setItem("myPlaylist", JSON.stringify(playlist));
        // Dispatch event to notify other components of changes
        window.dispatchEvent(new Event("playlistUpdated"));
    }, [playlist]);

    const playVideo = (video) => {
        const videoId = video.id?.videoId || video.id;
        const currentVideoId =
            currentlyPlaying?.id?.videoId || currentlyPlaying?.id;

        // If clicking the same video, toggle it off (pause)
        if (currentVideoId === videoId) {
            setCurrentlyPlaying(null);
            // Call stop callback to stop the carousel player
            if (onStopSong) {
                onStopSong();
            }
            return;
        }

        // Otherwise, play the new video
        setCurrentlyPlaying(video);
        // Find the index of the video in the playlist and call the callback
        if (onPlaySong) {
            const index = playlist.findIndex((item) => {
                const id = item.id?.videoId || item.id;
                return id === videoId;
            });
            if (index !== -1) {
                onPlaySong(video, index);
            }
        }
    };

    return (
        <div className='playlist-manager'>
            <div className='playlist-header'>
                <h1>My Playlist</h1>
            </div>

            {currentlyPlaying && (
                <div className='player-section'>
                    <div className='player-header'>
                        <h3>Now Playing</h3>
                        <button
                            onClick={() => setCurrentlyPlaying(null)}
                            className='close-player'
                        >
                            ✕
                        </button>
                    </div>
                    <div className='player-image'>
                        <img
                            src={youtubeService.getThumbnailUrl(
                                currentlyPlaying.snippet.thumbnails
                            )}
                            alt={currentlyPlaying.snippet.title}
                        />
                    </div>
                    <div className='player-info'>
                        <h4>{currentlyPlaying.snippet.title}</h4>
                        <p>{currentlyPlaying.snippet.channelTitle}</p>
                    </div>
                </div>
            )}

            <div className='playlist-section'>
                <div className='playlist-section-header'>
                    <h2>Playlist ({playlist.length} tracks)</h2>
                </div>

                {playlist.length === 0 ? (
                    <div className='empty-playlist'>
                        <p>Your playlist is empty.</p>
                        <p>Search and add music to your playlist!</p>
                    </div>
                ) : (
                    <div className='playlist-grid'>
                        {playlist.map((video, index) => {
                            const videoId = video.id?.videoId || video.id;
                            const key =
                                typeof videoId === "string"
                                    ? videoId
                                    : `video-${index}`;
                            return (
                                <div key={key} className='playlist-item'>
                                    <div className='item-number'>
                                        {index + 1}
                                    </div>
                                    <div className='video-thumbnail'>
                                        <img
                                            src={youtubeService.getThumbnailUrl(
                                                video.snippet.thumbnails
                                            )}
                                            alt={video.snippet.title}
                                        />
                                    </div>
                                    <div className='video-info'>
                                        <h4 className='video-title'>
                                            {video.snippet.title}
                                        </h4>
                                        <p className='video-channel'>
                                            {video.snippet.channelTitle}
                                        </p>
                                    </div>
                                    <div className='video-actions'>
                                        <button
                                            onClick={() => playVideo(video)}
                                            className='play-button'
                                            title={
                                                (currentlyPlaying?.id
                                                    ?.videoId ||
                                                    currentlyPlaying?.id) ===
                                                videoId
                                                    ? "Pause"
                                                    : "Play"
                                            }
                                        >
                                            {(currentlyPlaying?.id?.videoId ||
                                                currentlyPlaying?.id) ===
                                            videoId
                                                ? "⏸"
                                                : "▶"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlaylistManager;
