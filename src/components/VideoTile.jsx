import React, { useRef, useEffect } from 'react';
import { MicOff, VideoOff, Pin, MoreVertical } from 'lucide-react';

const VideoTile = ({
  participant,
  isLocal = false,
  isPinned = false,
  onPin,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden group ${className}`}>
      {/* Video Element */}
      {participant.videoEnabled && participant.stream ? (
        <video
          ref={videoRef}
          autoPlay
          muted={isLocal}
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
          {/* Avatar when video is off */}
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-medium">
            {participant.name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* Video off indicator */}
      {!participant.videoEnabled && (
        <div className="absolute top-3 left-3 bg-black bg-opacity-50 rounded-full p-1">
          <VideoOff size={16} className="text-white" />
        </div>
      )}

      {/* Audio muted indicator */}
      {!participant.audioEnabled && (
        <div className="absolute top-3 right-3 bg-red-500 rounded-full p-1">
          <MicOff size={16} className="text-white" />
        </div>
      )}

      {/* Participant name */}
      <div className="absolute bottom-3 left-3 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
        {participant.name} {isLocal && '(You)'}
      </div>

      {/* Controls overlay (visible on hover) */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="flex space-x-2">
          {onPin && (
            <button
              onClick={onPin}
              className={`p-2 rounded-full transition-all duration-200 ${
                isPinned
                  ? 'bg-blue-500 text-white'
                  : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
              }`}
              title={isPinned ? 'Unpin' : 'Pin'}
            >
              <Pin size={16} />
            </button>
          )}
          <button
            className="p-2 rounded-full bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-all duration-200"
            title="More options"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Pinned indicator */}
      {isPinned && (
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
          Pinned
        </div>
      )}
    </div>
  );
};

export default VideoTile;