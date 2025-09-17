import React from 'react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  MessageSquare, 
  Users, 
  MoreVertical,
  Phone,
  Settings
} from 'lucide-react';

const MeetingControls = ({
  isVideoEnabled,
  isAudioEnabled,
  isScreenSharing,
  isChatOpen,
  isParticipantsOpen,
  onToggleVideo,
  onToggleAudio,
  onToggleScreenShare,
  onToggleChat,
  onToggleParticipants,
  onLeaveMeeting,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        {/* Meeting Info */}
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            <div className="font-medium">Meeting Room</div>
            <div className="text-xs">meet.google.com/abc-defg-hij</div>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center space-x-2">
          {/* Audio Toggle */}
          <button
            onClick={onToggleAudio}
            className={`p-3 rounded-full transition-all duration-200 ${
              isAudioEnabled
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          {/* Video Toggle */}
          <button
            onClick={onToggleVideo}
            className={`p-3 rounded-full transition-all duration-200 ${
              isVideoEnabled
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          {/* Screen Share */}
          <button
            onClick={onToggleScreenShare}
            className={`p-3 rounded-full transition-all duration-200 ${
              isScreenSharing
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title={isScreenSharing ? 'Stop presenting' : 'Present now'}
          >
            <Monitor size={20} />
          </button>

          {/* More Options */}
          <button
            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200"
            title="More options"
          >
            <MoreVertical size={20} />
          </button>

          {/* Leave Meeting */}
          <button
            onClick={onLeaveMeeting}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium transition-all duration-200 flex items-center space-x-2 ml-4"
            title="Leave meeting"
          >
            <Phone size={18} />
            <span>Leave</span>
          </button>
        </div>

        {/* Side Controls */}
        <div className="flex items-center space-x-2">
          {/* Participants */}
          <button
            onClick={onToggleParticipants}
            className={`p-3 rounded-full transition-all duration-200 ${
              isParticipantsOpen
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title="Show participants"
          >
            <Users size={20} />
          </button>

          {/* Chat */}
          <button
            onClick={onToggleChat}
            className={`p-3 rounded-full transition-all duration-200 ${
              isChatOpen
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title="Chat with everyone"
          >
            <MessageSquare size={20} />
          </button>

          {/* Settings */}
          <button
            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200"
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingControls;