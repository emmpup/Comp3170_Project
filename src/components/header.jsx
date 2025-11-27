import { useState, useEffect } from "react";
import youtubeService from "../services/youtubeService";
import PlaylistManager from "./PlaylistManager";
import "./Header.css";

const Header = ({ onPlaySong, onStopSong }) => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchClosing, setIsSearchClosing] = useState(false);
    const [isMenuClosing, setIsMenuClosing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [showPlaylistManager, setShowPlaylistManager] = useState(false);

    const toggleSearch = () => {
        if (isSearchOpen) {
            setIsSearchClosing(true);
            setTimeout(() => {
                setIsSearchOpen(false);
                setIsSearchClosing(false);
            }, 300);
        } else {
            setIsSearchOpen(true);
            if (isMenuOpen) {
                setIsMenuClosing(true);
                setTimeout(() => {
                    setIsMenuOpen(false);
                    setIsMenuClosing(false);
                }, 300);
            }
        }
    };

    const toggleMenu = () => {
        if (isMenuOpen) {
            setIsMenuClosing(true);
            setShowPlaylistManager(false);
            setTimeout(() => {
                setIsMenuOpen(false);
                setIsMenuClosing(false);
            }, 300);
        } else {
            setIsMenuOpen(true);
            setShowPlaylistManager(false);
            if (isSearchOpen) {
                setIsSearchClosing(true);
                setTimeout(() => {
                    setIsSearchOpen(false);
                    setIsSearchClosing(false);
                }, 300);
            }
        }
    };

    const openPlaylistManager = () => {
        setShowPlaylistManager(true);
    };

    const closePlaylistManager = () => {
        setShowPlaylistManager(false);
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        setSearchError(null);

        try {
            const results = await youtubeService.searchMusic(searchQuery, 10);
            setSearchResults(results.items || []);
        } catch (error) {
            setSearchError("Search failed. Please try again.");
            console.error("Search error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVideoSelect = (video) => {
        window.open(
            `https://www.youtube.com/watch?v=${video.id.videoId}`,
            "_blank"
        );
    };

    const addToPlaylist = (video, e) => {
        e.stopPropagation();

        const savedPlaylist = localStorage.getItem("myPlaylist");
        const playlist = savedPlaylist ? JSON.parse(savedPlaylist) : [];

        const exists = playlist.some(
            (item) => item.id.videoId === video.id.videoId
        );

        if (exists) {
            alert("This track is already in your playlist.");
            return;
        }

        playlist.push(video);
        localStorage.setItem("myPlaylist", JSON.stringify(playlist));

        // Dispatch custom event to notify Carousel of changes
        window.dispatchEvent(new Event("playlistUpdated"));

        alert("Added to playlist!");
    };

    return (
        <>
            <header className='header'>
                <button className='icon-btn search-btn' onClick={toggleSearch}>
                    <svg
                        width='20'
                        height='20'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                    >
                        <circle cx='11' cy='11' r='8'></circle>
                        <path d='m21 21-4.35-4.35'></path>
                    </svg>
                </button>
                <button className='icon-btn menu-btn' onClick={toggleMenu}>
                    ☰
                </button>
            </header>

            {isSearchOpen && (
                <div
                    className={`sidebar search-sidebar frosted-backdrop ${
                        isSearchClosing ? "closing" : ""
                    }`}
                >
                    <form onSubmit={handleSearch} className='search-container'>
                        <input
                            type='text'
                            placeholder='Search for music...'
                            className='search-input'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </form>

                    {isLoading && (
                        <div className='loading-message'>Searching...</div>
                    )}

                    {searchError && (
                        <div className='error-message'>{searchError}</div>
                    )}

                    {searchResults.length > 0 && (
                        <div className='search-results'>
                            {searchResults.map((item, index) => (
                                <div
                                    key={item.id.videoId}
                                    className='search-item'
                                    onClick={() => handleVideoSelect(item)}
                                >
                                    <img
                                        src={
                                            item.snippet.thumbnails?.medium
                                                ?.url ||
                                            "/default-thumbnail.png"
                                        }
                                        alt={item.snippet.title}
                                        className='album-placeholder'
                                    />
                                    <div className='track-info'>
                                        <div className='song-name'>
                                            {item.snippet.title}
                                        </div>
                                        <div className='artist-name'>
                                            {item.snippet.channelTitle}
                                        </div>
                                    </div>
                                    <div className='action-buttons'>
                                        <button
                                            className='add-to-playlist-btn'
                                            onClick={(e) =>
                                                addToPlaylist(item, e)
                                            }
                                            title='Add to playlist'
                                        >
                                            ➕
                                        </button>
                                        <button
                                            className='play-btn'
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleVideoSelect(item);
                                            }}
                                        >
                                            ▶
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {searchResults.length === 0 &&
                        !isLoading &&
                        !searchError && (
                            <div className='empty-state'>
                                <p>Search for your favorite music</p>
                            </div>
                        )}
                </div>
            )}

            {isMenuOpen && (
                <div
                    className={`sidebar menu-sidebar frosted-backdrop ${
                        isMenuClosing ? "closing" : ""
                    }`}
                >
                    <PlaylistManager
                        onPlaySong={onPlaySong}
                        onStopSong={onStopSong}
                    />
                </div>
            )}
        </>
    );
};

export default Header;
