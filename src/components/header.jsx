import { useState } from "react";
import youtubeService from "../services/youtubeService";
import PlaylistManager from "./playlistManager";
import "./header.css";
import searchIcon from "../assets/material-symbols_search-rounded.svg";
import menuIcon from "../assets/material-symbols_menu-rounded.svg";

const Header = ({ onPlaySong, onStopSong }) => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSearchClosing, setIsSearchClosing] = useState(false);
    const [isMenuClosing, setIsMenuClosing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [showPlaylistManager, setShowPlaylistManager] = useState(false);
    const [notification, setNotification] = useState(null);

    const showNotification = (message, type = "success") => {
        setNotification({ message, type });
        setTimeout(() => {
            setNotification(null);
        }, 2000);
    };

    const closeSearch = () => {
        setIsSearchClosing(true);
        setTimeout(() => {
            setIsSearchOpen(false);
            setIsSearchClosing(false);
        }, 300);
    };

    const toggleSearch = () => {
        if (isSearchOpen) {
            closeSearch();
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

    const closeMenu = () => {
        setIsMenuClosing(true);
        setShowPlaylistManager(false);
        setTimeout(() => {
            setIsMenuOpen(false);
            setIsMenuClosing(false);
        }, 300);
    };

    const toggleMenu = () => {
        if (isMenuOpen) {
            closeMenu();
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
            showNotification(
                "This track is already in your playlist.",
                "error"
            );
            return;
        }

        playlist.push(video);
        localStorage.setItem("myPlaylist", JSON.stringify(playlist));

        window.dispatchEvent(new Event("playlistUpdated"));

        showNotification("Added to playlist!");
    };

    return (
        <>
            <header className='header'>
                <button className='icon-btn search-btn' onClick={toggleSearch}>
                    <img src={searchIcon} alt='Search' width='24' height='24' />
                </button>
                <button className='icon-btn menu-btn' onClick={toggleMenu}>
                    <img src={menuIcon} alt='Menu' width='24' height='24' />
                </button>
            </header>

            {isSearchOpen && (
                <>
                    <div className='sidebar-overlay' onClick={closeSearch} />
                    <div
                        className={`sidebar search-sidebar frosted-backdrop ${
                            isSearchClosing ? "closing" : ""
                        }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <form
                            onSubmit={handleSearch}
                            className='search-container'
                        >
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
                </>
            )}

            {isMenuOpen && (
                <>
                    <div className='sidebar-overlay' onClick={closeMenu} />
                    <div
                        className={`sidebar menu-sidebar frosted-backdrop ${
                            isMenuClosing ? "closing" : ""
                        }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <PlaylistManager
                            onPlaySong={onPlaySong}
                            onStopSong={onStopSong}
                            isEditing={isEditing}
                            setIsEditing={setIsEditing}
                        />
                    </div>
                </>
            )}

            {notification && (
                <div className={`notification-modal ${notification.type}`}>
                    {notification.message}
                </div>
            )}
        </>
    );
};

export default Header;
