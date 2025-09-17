import React, { useState, useEffect } from 'react';
import MeetingControls from './MeetingControls';
import ParticipantGrid from './ParticipantGrid';
import ParticipantsPanel from './ParticipantsPanel';
import ChatPanel from './ChatPanel';

const MeetingRoom = ({
  meetingId,
  localParticipant: initialLocalParticipant,
  remoteParticipants,
  onLeaveMeeting,
}) => {
  const [localParticipant, setLocalParticipant] = useState(initialLocalParticipant);
  const [participants] = useState(remoteParticipants);
  const [pinnedParticipantId, setPinnedParticipantId] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  
  const [controls, setControls] = useState({
    isVideoEnabled: true,
    isAudioEnabled: true,
    isScreenSharing: false,
    isChatOpen: false,
    isParticipantsOpen: false,
  });

  // Initialize user media
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        
        setLocalParticipant(prev => ({
          ...prev,
          stream,
          videoEnabled: true,
          audioEnabled: true,
        }));
      } catch (error) {
        console.error('Error accessing media devices:', error);
        // Handle permission denied or no devices
        setLocalParticipant(prev => ({
          ...prev,
          videoEnabled: false,
          audioEnabled: false,
        }));
      }
    };

    initializeMedia();

    // Cleanup on unmount
    return () => {
      if (localParticipant.stream) {
        localParticipant.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleToggleVideo = async () => {
    if (localParticipant.stream) {
      const videoTrack = localParticipant.stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !controls.isVideoEnabled;
        setControls(prev => ({ ...prev, isVideoEnabled: !prev.isVideoEnabled }));
        setLocalParticipant(prev => ({
          ...prev,
          videoEnabled: !prev.videoEnabled,
        }));
      }
    }
  };

  const handleToggleAudio = async () => {
    if (localParticipant.stream) {
      const audioTrack = localParticipant.stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !controls.isAudioEnabled;
        setControls(prev => ({ ...prev, isAudioEnabled: !prev.isAudioEnabled }));
        setLocalParticipant(prev => ({
          ...prev,
          audioEnabled: !prev.audioEnabled,
        }));
      }
    }
  };

  const handleToggleScreenShare = async () => {
    try {
      if (!controls.isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        
        setLocalParticipant(prev => ({
          ...prev,
          stream: screenStream,
        }));
        
        // Listen for screen share end
        screenStream.getVideoTracks()[0].onended = () => {
          handleStopScreenShare();
        };
      } else {
        handleStopScreenShare();
      }
      
      setControls(prev => ({ ...prev, isScreenSharing: !prev.isScreenSharing }));
    } catch (error) {
      console.error('Error sharing screen:', error);
    }
  };

  const handleStopScreenShare = async () => {
    try {
      // Stop screen share tracks
      if (localParticipant.stream) {
        localParticipant.stream.getTracks().forEach(track => track.stop());
      }

      // Return to camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: controls.isVideoEnabled,
        audio: controls.isAudioEnabled,
      });
      
      setLocalParticipant(prev => ({
        ...prev,
        stream,
      }));
      
      setControls(prev => ({ ...prev, isScreenSharing: false }));
    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  };

  const handleToggleChat = () => {
    setControls(prev => ({ 
      ...prev, 
      isChatOpen: !prev.isChatOpen,
      isParticipantsOpen: false, // Close participants panel
    }));
  };

  const handleToggleParticipants = () => {
    setControls(prev => ({ 
      ...prev, 
      isParticipantsOpen: !prev.isParticipantsOpen,
      isChatOpen: false, // Close chat panel
    }));
  };

  const handlePinParticipant = (participantId) => {
    setPinnedParticipantId(participantId === pinnedParticipantId ? '' : participantId);
  };

  const handleSendMessage = (message) => {
    const newMessage = {
      id: Date.now().toString(),
      senderId: localParticipant.id,
      senderName: localParticipant.name,
      message,
      timestamp: new Date(),
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    // TODO: Send message to other participants via WebRTC/Socket.IO
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Meeting Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Meeting Room</h1>
            <p className="text-sm text-gray-600">Meeting ID: {meetingId}</p>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>{participants.length + 1} participants</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Recording</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main meeting area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video grid */}
        <div className="flex-1 flex flex-col">
          <ParticipantGrid
            participants={participants}
            pinnedParticipantId={pinnedParticipantId}
            onPinParticipant={handlePinParticipant}
            localParticipant={localParticipant}
          />
        </div>

        {/* Side panels */}
        <ParticipantsPanel
          isOpen={controls.isParticipantsOpen}
          onClose={() => setControls(prev => ({ ...prev, isParticipantsOpen: false }))}
          participants={participants}
          localParticipant={localParticipant}
          isHost={true}
        />

        <ChatPanel
          isOpen={controls.isChatOpen}
          onClose={() => setControls(prev => ({ ...prev, isChatOpen: false }))}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          currentUserId={localParticipant.id}
          currentUserName={localParticipant.name}
        />
      </div>

      {/* Meeting controls */}
      <MeetingControls
        isVideoEnabled={controls.isVideoEnabled}
        isAudioEnabled={controls.isAudioEnabled}
        isScreenSharing={controls.isScreenSharing}
        isChatOpen={controls.isChatOpen}
        isParticipantsOpen={controls.isParticipantsOpen}
        onToggleVideo={handleToggleVideo}
        onToggleAudio={handleToggleAudio}
        onToggleScreenShare={handleToggleScreenShare}
        onToggleChat={handleToggleChat}
        onToggleParticipants={handleToggleParticipants}
        onLeaveMeeting={onLeaveMeeting}
      />
    </div>
  );
};

export default MeetingRoom;