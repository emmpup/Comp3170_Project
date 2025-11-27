import { useState } from "react";
import Player from "./components/Player";
import Carousel from "./components/carousel";
import Header from "./components/header";
import "./App.css";

function App() {
    const [isEditing, setIsEditing] = useState(false);
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playlist, setPlaylist] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [shouldStop, setShouldStop] = useState(false);

    const toggleEdit = () => {
        setIsEditing(!isEditing);
    };

    const handleTrackSelect = (track, index) => {
        setCurrentTrack(track);
        setCurrentIndex(index);
        setIsPlaying(true);
    };

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleNext = () => {
        if (playlist.length > 0) {
            const nextIndex = (currentIndex + 1) % playlist.length;
            setCurrentIndex(nextIndex);
            setCurrentTrack(playlist[nextIndex]);
            setIsPlaying(true);
        }
    };

    const handlePrev = () => {
        if (playlist.length > 0) {
            const prevIndex =
                (currentIndex - 1 + playlist.length) % playlist.length;
            setCurrentIndex(prevIndex);
            setCurrentTrack(playlist[prevIndex]);
            setIsPlaying(true);
        }
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
                <h1>October Playlist</h1>
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
                </section>

                <button onClick={toggleEdit} className='edit-button'>
                    {isEditing ? "Done" : "Edit"}
                </button>
            </main>
        </div>
    );
}

export default App;
