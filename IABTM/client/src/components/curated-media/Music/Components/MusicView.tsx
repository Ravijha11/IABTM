import React from "react";
import { Play, MoreHorizontal, Search, MusicIcon, Pause } from "lucide-react";
import { Track } from "../type/tracks";

interface Playlist {
  _id: string;
  name: string;
  tracks: any[];
}

interface MusicViewProps {
  musicData: Track[];
  currentTrack: Track | null;
  selectedTrackForMenu: string | null;
  searchText: string;
  setSearchText: (text: string) => void;
  loading: boolean;
  fetchTracks: () => void;
  playTrack: (track: Track, index: number) => void;
  playlists: Playlist[];
  setSelectedTrackForMenu: (id: string | null) => void;
  handleAddTrackToPlaylist: (playlistId: string, track: Track) => void;
}

export default function MusicView({musicData,currentTrack,selectedTrackForMenu,searchText,setSearchText,loading,fetchTracks,playTrack,playlists,setSelectedTrackForMenu,handleAddTrackToPlaylist,}: MusicViewProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Music</h3>
        <div className="relative w-64 flex items-center">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-3 pr-10 py-2 w-full text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Search songs or artists..."
          />
          <button
            onClick={fetchTracks}
            className="absolute right-2 top-2 text-gray-500 hover:text-black"
          >
            {loading ? (
              <svg
                className="animate-spin h-4 w-4 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      <ul className="space-y-3">
        {musicData.map((track, index) => (
          <li
            key={track.id}
            className={`flex items-center justify-between p-2 rounded-md hover:bg-gray-100 ${
              currentTrack?.id === track.id ? "bg-gray-100 shadow-sm" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => playTrack(track, index)}
                className="text-gray-600"
              >
                {currentTrack?.id === track.id ? <Pause className="w-4 h-4"/> :<Play className="w-4 h-4" />}
              </button>
              <div className="w-10 h-10 bg-gray-200 rounded-md overflow-hidden">
                {track.img || track.thumbnail ? (
                  <img
                    src={track.thumbnail || track.img}
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                    <MusicIcon className="h-full w-full text-gray-500"/>
                )}
              </div>
              <div>
                <p className="font-medium text-sm">{track.title}</p>
                <p className="text-xs text-gray-500">{track.artist || track.author}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{track.duration}</span>
              <MoreHorizontal
                className="w-4 h-4 text-gray-400 cursor-pointer"
                onClick={() => setSelectedTrackForMenu(track.id)}
              />
            </div>
            {selectedTrackForMenu === track.id && (
              <div className="absolute bg-white shadow-lg border rounded-md z-10 mt-20 right-0">
                {playlists.map((playlist) => (
                  <button
                    key={playlist._id}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    onClick={() =>
                      handleAddTrackToPlaylist(playlist._id, track)
                    }
                  >
                    Add to {playlist.name}
                  </button>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
