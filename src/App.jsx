import { useState, useEffect } from "react";
import Carousel from "./components/carousel.jsx";
import Header from "./components/header.jsx";
import "./App.css";

function App() {
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playlist, setPlaylist] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [shouldStop, setShouldStop] = useState(false);

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

    const handleTrackSelect = (track, index) => {
        setCurrentTrack(track);
        setCurrentIndex(index);
        setIsPlaying(true);
        setShouldStop(false);
    };

    const handleStopSong = () => {
        setCurrentTrack(null);
        setIsPlaying(false);
        setShouldStop(true);
    };

    return (
        <div>
            <Header
                onPlaySong={handleTrackSelect}
                onStopSong={handleStopSong}
            />

            <main>
                <h1 className='playlist-title'>My Playlist</h1>

                <section>
                    <Carousel
                        onTrackSelect={handleTrackSelect}
                        onPlaylistLoad={setPlaylist}
                        currentIndex={currentIndex}
                        setCurrentIndex={setCurrentIndex}
                        shouldStop={shouldStop}
                        setShouldStop={setShouldStop}
                        isPlaying={isPlaying}
                        setIsPlaying={setIsPlaying}
                    />
                </section>

                <button
                    onClick={() =>
                        setTheme(theme === "dark" ? "light" : "dark")
                    }
                    className='edit-button theme-toggle-button'
                >
                    Switch to {theme === "dark" ? "Light" : "Dark"} Theme
                </button>
            </main>
        </div>
    );
}

export default App;
