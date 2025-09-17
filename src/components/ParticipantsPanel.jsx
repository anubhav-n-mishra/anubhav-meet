import React, { useState } from 'react';
import { X, Users, Mic, MicOff, Video, VideoOff, MoreVertical, Crown } from 'lucide-react';

const ParticipantsPanel = ({
  isOpen,
  onClose,
  participants,
  localParticipant,
  isHost = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const allParticipants = [localParticipant, ...participants];
  const filteredParticipants = allParticipants.filter(participant =>
    participant.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 w-80 h-full bg-white border-l border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Users size={20} className="text-gray-600" />
          <h2 className="text-lg font-medium">Participants ({allParticipants.length})</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <input
          type="text"
          placeholder="Search participants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto">
        {filteredParticipants.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              {/* Avatar */}
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                {participant.name.charAt(0).toUpperCase()}
              </div>

              {/* Name and status */}
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">
                    {participant.name}
                  </span>
                  {participant.id === localParticipant.id && (
                    <span className="text-sm text-gray-500">(You)</span>
                  )}
                  {isHost && participant.id === localParticipant.id && (
                    <div title="Host">
                      <Crown size={14} className="text-yellow-500" />
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-1 mt-1">
                  {participant.audioEnabled ? (
                    <Mic size={12} className="text-green-500" />
                  ) : (
                    <MicOff size={12} className="text-red-500" />
                  )}
                  {participant.videoEnabled ? (
                    <Video size={12} className="text-green-500" />
                  ) : (
                    <VideoOff size={12} className="text-red-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1">
              {isHost && participant.id !== localParticipant.id && (
                <button
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                  title="More actions"
                >
                  <MoreVertical size={16} className="text-gray-600" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Actions (for hosts) */}
      {isHost && (
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button className="w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            Mute all participants
          </button>
          <button className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            End meeting for all
          </button>
        </div>
      )}
    </div>
  );
};

export default ParticipantsPanel;