import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  MoreHorizontal,
  Video,
  CakeSlice,
  Music,
  FilePenLine,
  Image,
  Building2,
  Search,
  MusicIcon,
  SkipBack,
  SkipForward,
} from "lucide-react";
import axios from "axios";
import Modal from "./Music/Components/Modal";
import PlaylistView from "./Music/Components/PlaylistView";
import MusicView from "./Music/Components/MusicView";
import MusicPlayer from "./Music/Components/MusicPlayer";
import YouTube, { YouTubePlayer } from "react-youtube";
import { Track } from "./Music/Types/tracks";
import { Playlist } from "./Music/Types/playlist";
import { formatTime } from "@/utils/time";
import Spinner from "../ui/spinner";
import { useAuthStore } from '@/storage/authStore';

export default function MusicLibrary({setActiveSection}) {
  const [musicData, setMusicData] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<any | null>(null);
  const [selectedTrackForMenu, setSelectedTrackForMenu] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [volume, setVolume] = useState(100);
  const [activeCategory, setActiveCategory] = useState("Music");
  const [playerReady, setPlayerReady] = useState(false);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);

  const { user } = useAuthStore()
  // console.log("User:", user);

  const fetchTracks = async () => {
    setLoadingTracks(true);
    const query = searchText.trim() || user?.attributes?.currentSelf?.[user?.attributes?.currentSelf?.length - 1] || "top songs";

    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/music/search`, {
        params: {
          q: query,
        },
      });

      const tracks = res.data.tracks.map((track) => ({
        id: track.videoId,
        title: track.title,
        artist: track.author,
        img: track.thumbnail,
        duration: track.duration,
      }));

      setMusicData(tracks);
    } catch (err) {
      console.error("Failed to fetch tracks", err);
    } finally {
      setLoadingTracks(false);
    }
  };

  const playTrack = (track: Track, index: number) => {
    setPlayerReady(false);
    setCurrentTrack(track);
    setCurrentTrackIndex(index);
    setIsPlaying(true);
    setProgress(0);
    setCurrentTime(0);
    setDuration(track.duration ? parseFloat(track.duration) : 0);
    console.log("Playing track:", track);
    console.log("Track duration:", track.duration);
    console.log("Music Data:", musicData);
  };

  const fetchPlaylists = async () => {
    try {
      setLoadingPlaylists(true);
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/playlist`, { withCredentials: true });
      setPlaylists(res.data);
    } catch (error) {
      console.error('Error fetching playlists:', error);
    } finally {
      setLoadingPlaylists(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
    fetchTracks();
  }, []);

  const handleNewPlaylistClick = () => {
    setPlaylistName('');
    setShowModal(true);
  };
 
  const handleCreatePlaylist = async () => {
      if (!playlistName.trim()) return;

      setLoading(true);
      try {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/playlist`,
          { name: playlistName.trim(), tracks: [] },
          { withCredentials: true }
        );
        setPlaylists(prev => [...prev, res.data]);
        setShowModal(false);
      } catch (error) {
        console.error('Failed to create playlist:', error);
      } finally {
        setLoading(false);
      }
  };

  const handleAddTrackToPlaylist = async (playlistId: string, track: any) => {
    try {
      const playlistToUpdate = playlists.find((pl) => pl._id === playlistId);
      if (!playlistToUpdate) return;

      // Optional: prevent duplicate tracks
      const isAlreadyAdded = playlistToUpdate.tracks.some(t => t.id === track.id);
      if (isAlreadyAdded) return;

      const updatedTracks = [...playlistToUpdate.tracks, track];

      await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/playlist/${playlistId}`,
        { tracks: updatedTracks },
        { withCredentials: true }
      );

      setPlaylists((prev) =>
        prev.map((pl) =>
          pl._id === playlistId ? { ...pl, tracks: updatedTracks } : pl
        )
      );

      setSelectedTrackForMenu(null);
    } catch (error) {
      console.error("Error adding track to playlist:", error);
    }
  };

  const onVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const vol = Number(e.target.value);
      setVolume(vol);
      playerRef.current?.setVolume(vol);
      console.log("Volume changed to:", vol);
  };
  
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newProgress = Number(e.target.value);
      const newTime = (newProgress / 100) * duration;
      setProgress(newProgress);
      setCurrentTime(newTime);
      playerRef.current?.seekTo(newTime, true);
  };
  
  const onPlayerReady = (event: { target: YouTubePlayer }) => {
      playerRef.current = event.target;
      event.target.setVolume(volume);
      setPlayerReady(true);
      if (!isPlaying) event.target.pauseVideo();
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPlaying && currentTrack && playerReady && playerRef.current) {
      interval = setInterval(async () => {
        try {
          const current = await playerRef.current!.getCurrentTime();
          const total = await playerRef.current!.getDuration();
          setCurrentTime(current);
          setDuration(total);
          setProgress((current / total) * 100);
        } catch (err) {
          console.error("Error updating time:", err);
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isPlaying, currentTrack, playerReady]);
  
  useEffect(() => {
      if (playerRef.current) {
        isPlaying ? playerRef.current.playVideo() : playerRef.current.pauseVideo();
      }
  }, [isPlaying]);
  
  const renderCategoryComponent = () => {
    switch (activeCategory) {
      case 'Film':
        return <Shop />;
      case 'Music':
        return (
          <div className="flex">
            <aside className="flex flex-col items-start w-40 text-lg text-gray-400 mr-6 space-y-3">
              <p className="text-lg font-bold">My Playlists</p>
                {playlists.map((playlist) => (
                  <button key={playlist._id} onClick={() => setSelectedPlaylistId(playlist._id)} className={"text-left text-sm text-gray-800 hover:text-gray-500 w-full truncate cursor-pointer" + (selectedPlaylistId === playlist._id ? " font-bold" : "")}>
                    {playlist.name}
                  </button>
                ))}

              <button onClick={handleNewPlaylistClick} className="text-blue-500 mt-2 text-sm cursor-pointer hover:text-blue-700">
                + New Playlist
              </button>
              {showModal && (
                <Modal playlistName={playlistName} setPlaylistName={setPlaylistName} loading={loading} onCancel={() => setShowModal(false)} onSave={handleCreatePlaylist}/>
              )}
            </aside>

            <section className="flex-1">
              {selectedPlaylistId ? (
                <PlaylistView playlistId={selectedPlaylistId} playTrack={playTrack} setMusicData={setMusicData} currentTrack={currentTrack} setActiveSection={setActiveSection} />
              ) : (
                <MusicView musicData={musicData} currentTrack={currentTrack} selectedTrackForMenu={selectedTrackForMenu} searchText={searchText} setSearchText={setSearchText} loading={loading} fetchTracks={fetchTracks} playTrack={playTrack} playlists={playlists} setSelectedTrackForMenu={setSelectedTrackForMenu} handleAddTrackToPlaylist={handleAddTrackToPlaylist} />
              )}
            </section>
          </div>
          )
      case 'Art':
        return <Blogs />;
      case 'Editorial':
        return <Shop />;
      case 'Print':
        return <Blogs />;
      case 'Animation':
        return <Shop />;
    }
  };

  if (loadingTracks || loadingPlaylists) {
    return <Spinner />;
  }

  return (
    <div className="relative p-6 font-sans pb-24">    

      <div>
          {renderCategoryComponent()}  
      </div>

      {/* Bottom Audio Player */}
      {currentTrack && (
        <MusicPlayer currentTrack={currentTrack} isPlaying={isPlaying} setIsPlaying={setIsPlaying} currentTrackIndex={currentTrackIndex} musicData={musicData} playTrack={playTrack} currentTime={currentTime} progress={progress} formatTime={formatTime} handleSeek={handleSeek} volume={volume} onVolumeChange={onVolumeChange} />
      )}

      {currentTrack && (
        <YouTube
          videoId={currentTrack.id}
          opts={{ height: "0", width: "0", playerVars: {autoplay: 1,},}}
          onReady={onPlayerReady}
        />
      )}
    </div>
  );
}