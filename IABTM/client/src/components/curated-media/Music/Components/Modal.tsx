import React from "react";

type ModalProps = {
  playlistName: string;
  setPlaylistName: (name: string) => void;
  loading: boolean;
  onCancel: () => void;
  onSave: () => void;
};

export default function Modal({playlistName,setPlaylistName,loading,onCancel,onSave}: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-9999">
      <div className="bg-white p-6 rounded-md w-[400px] shadow-lg relative">
        <button onClick={onCancel} className="absolute top-4 right-4 text-gray-500 hover:text-black text-xl cursor-pointer">&times;</button>
        <h2 className="text-xl font-bold mb-4 text-black">Create playlist</h2>
        <input type="text" placeholder="Playlist title" value={playlistName} onChange={(e) => setPlaylistName(e.target.value)} className="w-full border border-gray-300 px-4 py-3 rounded-md text-black placeholder-gray-500 text-sm" />
        <div className="flex justify-center mt-6">
          <button onClick={onSave} className="px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 text-sm cursor-pointer" disabled={loading}>{loading ? 'Creating...' : 'Create Playlist'}</button>
        </div>
      </div>
    </div>
  );
}
