import React from "react";
import { Play, Pause, SkipBack, SkipForward, Music as MusicIcon, Volume2, X } from "lucide-react";

export default function MusicPlayer({currentTrack,isPlaying,setIsPlaying,currentTrackIndex,musicData,playTrack,currentTime,progress,formatTime,handleSeek,volume, onVolumeChange}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md px-6 py-4 flex items-center justify-between z-50 h-[100px]">
      
      {/* Left: Track Info */}
      <div className="flex items-center gap-4 min-w-0 w-[300px]">
        <div className="w-14 h-14 bg-gray-200 rounded overflow-hidden shrink-0">{currentTrack.img ? (<img src={currentTrack.img} alt={currentTrack.title} className="w-full h-full object-cover" />) : (<MusicIcon className="h-full w-full text-gray-500" />)}</div>
        <div className="truncate">
          <p className="text-xs text-gray-500 uppercase leading-tight">{currentTrack.artist}</p>
          <p className="text-base font-semibold truncate leading-tight">{currentTrack.title}</p>
        </div>
      </div>

      {/* Center: Controls & Progress (absolute centered) */}
      <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center w-full max-w-lg">
        <div className="flex items-center gap-5 mb-2">
                  <button onClick={() => { if (currentTrackIndex !== null && currentTrackIndex > 0) { const prevIndex = currentTrackIndex - 1; playTrack(musicData[prevIndex], prevIndex); } }} className="text-gray-700 hover:text-black cursor-pointer"><SkipBack className="w-5 h-5" /></button>
                  
                  <button onClick={() => setIsPlaying(prev => !prev)} className="w-10 h-10 cursor-pointer flex items-center justify-center bg-blue-500 text-white rounded-full hover:bg-blue-600">{isPlaying ? <Pause className="w-5 h-5 " /> : <Play className="w-5 h-5" />}</button>
            
                  <button onClick={() => { if (currentTrackIndex !== null && currentTrackIndex < musicData.length - 1) { const nextIndex = currentTrackIndex + 1; playTrack(musicData[nextIndex], nextIndex); } }} className="text-gray-700 hover:text-black cursor-pointer "><SkipForward className="w-5 h-5" /></button>
        </div>
        <div className="flex items-center gap-3 w-full">
          <span className="text-xs text-gray-500">{formatTime(currentTime)}</span>
          <input type="range" min="0" max="100" value={isNaN(progress) ? 0 : progress} onChange={handleSeek} className="flex-1 appearance-none h-1 bg-gray-300 rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500" />
          <span className="text-xs text-gray-500">{currentTrack.duration}</span>
        </div>
      </div>

      {/* Right: Volume + Close */}
      <div className="flex items-center gap-3 w-[300px] justify-end">
        <Volume2 className="w-4 h-4 text-gray-700" />
        <input type="range" min="0" max="100" value={volume} onChange={onVolumeChange} className="w-24 h-1 bg-gray-300 rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500" />
      </div>

    </div>
  );
}
