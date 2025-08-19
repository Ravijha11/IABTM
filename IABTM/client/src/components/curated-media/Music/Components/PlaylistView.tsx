"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { MoreHorizontal, Pause, Play, Trash2 } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Track } from "../type/tracks";
import { useRouter } from "next/router";

interface PlaylistViewProps {
  playlistId: string;
  playTrack: (track: Track, index: number) => void;
  setMusicData: (tracks: Track[]) => void;
  currentTrack: (track: Track) => void;
  setActiveSection: (section: string) => void;
}

export default function PlaylistView({ playlistId, playTrack, setMusicData,currentTrack,setActiveSection}: PlaylistViewProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [newName, setNewName] = useState("");
  const [deletingTrackId, setDeletingTrackId] = useState<string | null>(null);
  const [showTrackMenu, setShowTrackMenu] = useState<string | null>(null);
  
  useEffect(() => {
  const fetchPlaylist = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/playlist/${playlistId}`, {
        withCredentials: true,
      });

      const rawTracks = res.data.tracks || [];
      const parsedTracks = rawTracks.map(track => {
        return track instanceof Map ? Object.fromEntries(track) : track;
      });

      setTracks(parsedTracks);
      setPlaylistName(res.data.name || "Untitled Playlist");
      setNewName(res.data.name || "");
    } catch (err) {
      toast.error("Failed to fetch playlist");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (playlistId) fetchPlaylist();
  }, [playlistId]);

  const handleDeletePlaylist = async () => {
    if (!confirm("Are you sure you want to delete this playlist?")) return;

    try {
      setDeleting(true);
      await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/playlist/${playlistId}`, {
        withCredentials: true,
      });
      toast.success("Playlist deleted successfully");
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (err) {
      toast.error("Failed to delete playlist");
      // console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleRenamePlaylist = async () => {
    if (!newName.trim()) {
      toast.warning("Playlist name cannot be empty");
      return;
    }

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/playlist/${playlistId}`,
        { name: newName },
        { withCredentials: true }
      );
      setPlaylistName(newName);
      setRenaming(false);
      setShowMenu(false);
      toast.success("Playlist renamed");
    } catch (err) {
      toast.error("Failed to rename playlist");
      // console.error(err);
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    if (!confirm("Are you sure you want to delete this track from the playlist?")) return;

    try {
      setDeletingTrackId(trackId);
      const res = await axios.delete(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/playlist/track/${playlistId}`,
        {
          data: { trackId },
          withCredentials: true,
        }
      );
      setTracks(res.data.tracks); // assuming API returns updated playlist with tracks
      setShowTrackMenu(null);
    } catch (err) {
      toast.error("Failed to delete track");
    } finally {
      setDeletingTrackId(null);
    }
  };

  if (loading) return <div className="text-sm text-gray-500">Loading playlist...</div>;

  return (
    <>
      <div className="flex items-center justify-between mb-4 relative">
        <button onClick={() => {setActiveSection("Curated Media")}} className="text-blue-500 hover:underline">← Back to Music</button>

        <div className="relative">
          <MoreHorizontal className="w-5 h-5 text-gray-600 cursor-pointer"onClick={() => setShowMenu((prev) => !prev)}/>
          {showMenu && (
            <div className="absolute right-0 top-6 w-40 bg-white border rounded-md shadow-lg z-10">
              <button onClick={() => { setRenaming(true); setShowMenu(false); }}className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Rename Playlist</button>
              <button onClick={handleDeletePlaylist} disabled={deleting}className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">{deleting ? "Deleting..." : "Delete Playlist"}</button>
            </div>
          )}
        </div>
      </div>

      {renaming ? (
        <div className="mb-4 flex items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="border px-3 py-1 rounded-md text-sm w-64"
            placeholder="New playlist name"
          />
          <button
            onClick={handleRenamePlaylist}
            className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
          <button
            onClick={() => setRenaming(false)}
            className="text-sm text-gray-500 hover:underline"
          >
            Cancel
          </button>
        </div>
      ) : (
        <h2 className="text-xl font-semibold mb-4">{playlistName}</h2>
      )}

      {tracks.length === 0 ? (
        <p className="text-gray-500">No songs present.</p>
      ) : (
        <div className="space-y-3">
          {tracks.map((track, index) => (
            <div
              key={track.id || index}
              className={`flex items-center justify-between p-2 rounded-md gap-4 hover:bg-gray-100 ${
              currentTrack?.id === track.id ? "bg-gray-100 shadow-sm" : ""
            }`}
            >
              <button
                onClick={() => {
                  playTrack(track, index);
                  setMusicData(tracks);
                }}
                className="text-gray-600 cursor-pointer hover:text-gray-800"
              >
                {currentTrack?.id === track.id ? <Pause className="w-4 h-4"/> :<Play className="w-4 h-4" />}
              </button>
              <img
                src={track.img || "/placeholder.png"} // fallback image
                alt={track.title || "Unknown Title"}
                className="w-10 h-10 object-cover rounded"
              />
              <div>
                <p className="text-sm font-semibold">{track.title || "Untitled"}</p>
                <p className="text-xs text-gray-500">{track.artist || "Unknown Artist"}</p>
              </div>
              <span className="ml-auto text-sm text-gray-400">
                {track.duration || "0:00"}
              </span>
              <div className="relative">
              <MoreHorizontal
                className="w-5 h-5 cursor-pointer text-gray-600 hover:text-gray-800"
                onClick={() => setShowTrackMenu(showTrackMenu === track.id ? null : track.id)}
              />
              {showTrackMenu === track.id && (
                <div className="absolute right-0 top-5 w-36 bg-white border rounded-md shadow-lg z-10">
                  <button
                    onClick={() => handleDeleteTrack(track.id)}
                    disabled={deletingTrackId === track.id}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deletingTrackId === track.id ? "Deleting..." : "Delete Track"}
                  </button>
              </div>
            )}
          </div>
            </div>
          ))}
        </div>
      )}


      <ToastContainer position="top-right" autoClose={4000} />
    </>
  );
}
