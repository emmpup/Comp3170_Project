import { useState, useEffect } from "react";
import Player from "./components/Player.jsx";
import Carousel from "./components/carousel.jsx";
import Header from "./components/header.jsx";
import EditIcon from "./assets/editicon.svg";
import "./App.css";

function App() {
    const [isEditing, setIsEditing] = useState(false);
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playlist, setPlaylist] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [shouldStop, setShouldStop] = useState(false);

   
    const [playlistTitle, setPlaylistTitle] = useState(
        localStorage.getItem("playlistTitle") || "My Playlist"
    );
    const [isRenaming, setIsRenaming] = useState(false);

   
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  
    useEffect(() => {
        if (theme === "dark") {
            document.body.style.backgroundImage =
                "url('/backgrounds/classic-dark.png')";
            document.body.classList.remove("light-mode");
            document.body.classList.add("dark-mode");
        } else {
            document.body.style.backgroundImage =
                "url('/backgrounds/classic-light.png')";
            document.body.classList.remove("dark-mode");
            document.body.classList.add("light-mode");
        }

        localStorage.setItem("theme", theme);
    }, [theme]);

    const toggleEdit = () => {
        setIsEditing(!isEditing);
        setIsRenaming(false);
    };

    const handleTrackSelect = (track, index) => {
        setCurrentTrack(track);
        setCurrentIndex(index);
        setIsPlaying(true);
        setShouldStop(false);
    };

    const handleNext = () => {
        if (playlist.length === 0) return;
        const nextIndex = (currentIndex + 1) % playlist.length;
        setCurrentIndex(nextIndex);
        setCurrentTrack(playlist[nextIndex]);
        setIsPlaying(true);
    };

    const handlePrev = () => {
        if (playlist.length === 0) return;
        const prevIndex =
            (currentIndex - 1 + playlist.length) % playlist.length;
        setCurrentIndex(prevIndex);
        setCurrentTrack(playlist[prevIndex]);
        setIsPlaying(true);
    };

    const handleStopSong = () => {
        setCurrentTrack(null);
        setIsPlaying(false);
        setShouldStop(true);
    };

    const safeVideoId =
        currentTrack?.videoId ||
        currentTrack?.id?.videoId ||
        currentTrack?.snippet?.resourceId?.videoId ||
        currentTrack?.id ||
        null;

    const isValidVideoId =
        typeof safeVideoId === "string" &&
        safeVideoId.length >= 8 &&
        safeVideoId.length <= 20;

    return (
        <div>
            <Header onPlaySong={handleTrackSelect} onStopSong={handleStopSong} />

            <main>
                
                {isEditing && (
                    <div className="theme-select-container">
                        <button
                            className="theme-btn"
                            onClick={() =>
                                setTheme(theme === "dark" ? "light" : "dark")
                            }
                        >
                            Switch to {theme === "dark" ? "Light" : "Dark"} Theme
                        </button>
                    </div>
                )}

                
                <div className="playlist-title-container">
                    {isRenaming ? (
                        <input
                            className="playlist-title-input"
                            value={playlistTitle}
                            onChange={(e) => setPlaylistTitle(e.target.value)}
                            onBlur={() => {
                                setIsRenaming(false);
                                localStorage.setItem(
                                    "playlistTitle",
                                    playlistTitle
                                );
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    setIsRenaming(false);
                                    localStorage.setItem(
                                        "playlistTitle",
                                        playlistTitle
                                    );
                                }
                            }}
                            autoFocus
                        />
                    ) : (
                        <h1 className="playlist-title">
                            {playlistTitle}

                            {isEditing && (
                                <button
                                    className="rename-button"
                                    onClick={() => setIsRenaming(true)}
                                >
                                    <img
                                        src={EditIcon}
                                        alt="Edit"
                                        width="22"
                                        height="22"
                                        className="icon"
                                    />
                                </button>
                            )}
                        </h1>
                    )}
                </div>

                <section>
                    <Carousel
                        isEditing={isEditing}
                        onTrackSelect={handleTrackSelect}
                        onPlaylistLoad={setPlaylist}
                        currentIndex={currentIndex}
                        setCurrentIndex={setCurrentIndex}
                        shouldStop={shouldStop}
                        setShouldStop={setShouldStop}
                    />

                    {isValidVideoId && (
                        <Player
                            videoId={safeVideoId}
                            isPlaying={isPlaying}
                            setIsPlaying={setIsPlaying}
                            onNext={handleNext}
                            onPrev={handlePrev}
                        />
                    )}
                </section>

                
                <button onClick={toggleEdit} className="edit-button">
                    {isEditing ? "Done" : "Edit"}
                </button>
            </main>
        </div>
    );
}

export default App;
