import Player from "./components/Player";
import "./App.css";

function App() {
    return (
        <div>
            {/* Header */}
            <main>
                <h1>October Playlist</h1>
                <section>{/* Carousel */}</section>

                <section>
                    <Player />
                </section>
            </main>
        </div>
    );
}

export default App;
