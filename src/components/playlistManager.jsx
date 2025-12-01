import { useState, useEffect, useRef } from "react";
import youtubeService from "../services/youtubeService";
import "./playlistManager.css";

const PlaylistManager = ({
    onPlaySong,
    onStopSong,
    isEditing = false,
    setIsEditing,
}) => {
    const [playlist, setPlaylist] = useState([]);
    const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
    const isExternalUpdateRef = useRef(false);
    const [playlistTitle, setPlaylistTitle] = useState(
        localStorage.getItem("playlistTitle") || "My Playlist"
    );
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    useEffect(() => {
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

        window.addEventListener("playlistUpdated", loadPlaylist);

        return () => {
            window.removeEventListener("playlistUpdated", loadPlaylist);
        };
    }, []);

    useEffect(() => {
        if (isExternalUpdateRef.current) {
            isExternalUpdateRef.current = false;
            return;
        }

        localStorage.setItem("myPlaylist", JSON.stringify(playlist));
        window.dispatchEvent(new Event("playlistUpdated"));
    }, [playlist]);

    const playVideo = (video) => {
        const videoId = video.id?.videoId || video.id;
        const currentVideoId =
            currentlyPlaying?.id?.videoId || currentlyPlaying?.id;

        if (currentVideoId === videoId) {
            setCurrentlyPlaying(null);
            if (onStopSong) {
                onStopSong();
            }
            return;
        }

        setCurrentlyPlaying(video);
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

    const deleteFromPlaylist = (videoId) => {
        const updatedPlaylist = playlist.filter((item) => {
            const id = item.id?.videoId || item.id;
            return id !== videoId;
        });
        setPlaylist(updatedPlaylist);
    };

    const savePlaylistTitle = () => {
        setIsEditingTitle(false);
        localStorage.setItem("playlistTitle", playlistTitle);
        window.dispatchEvent(new Event("playlistTitleUpdated"));
    };

    const handleTitleKeyDown = (e) => {
        if (e.key === "Enter") {
            savePlaylistTitle();
        } else if (e.key === "Escape") {
            setPlaylistTitle(
                localStorage.getItem("playlistTitle") || "My Playlist"
            );
            setIsEditingTitle(false);
        }
    };

    return (
        <div className='playlist-manager'>
            <div className='playlist-header'>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {isEditing && isEditingTitle ? (
                        <input
                            type='text'
                            value={playlistTitle}
                            onChange={(e) => setPlaylistTitle(e.target.value)}
                            onBlur={savePlaylistTitle}
                            onKeyDown={handleTitleKeyDown}
                            className='playlist-title-input'
                            autoFocus
                        />
                    ) : (
                        <h1
                            onClick={() => isEditing && setIsEditingTitle(true)}
                            style={{ cursor: isEditing ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            {playlistTitle}
                            {isEditing && (
                                <span title='Edit title' style={{ fontSize: '0.9rem', opacity: 0.7 }}>✎</span>
                            )}
                        </h1>
                    )}
                </div>
                <button
                    onClick={() => setIsEditing && setIsEditing(!isEditing)}
                    className='edit-playlist-button'
                >
                    {isEditing ? "Done" : "Edit"}
                </button>
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
                                        {isEditing ? (
                                            <button
                                                onClick={() =>
                                                    deleteFromPlaylist(videoId)
                                                }
                                                className='delete-button'
                                                title='Delete'
                                            >
                                                ✕
                                            </button>
                                        ) : (
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
                                                {(currentlyPlaying?.id
                                                    ?.videoId ||
                                                    currentlyPlaying?.id) ===
                                                videoId
                                                    ? "⏸"
                                                    : "▶"}
                                            </button>
                                        )}
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
