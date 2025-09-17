import React, { useState, useRef, useEffect } from 'react';
import { Video, VideoOff, Mic, MicOff, Settings, Camera } from 'lucide-react';

const HomePage = ({ onJoinMeeting, onCreateMeeting }) => {
  const [meetingId, setMeetingId] = useState('');
  const [userName, setUserName] = useState('');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize preview camera
  useEffect(() => {
    const initializePreview = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };

    initializePreview();

    return () => {
      // Cleanup function will access stream from closure
    };
  }, []); // Remove stream from dependency array

  // Update video preview when video is toggled
  useEffect(() => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoEnabled;
      }
    }
  }, [isVideoEnabled, stream]);

  // Update audio when audio is toggled
  useEffect(() => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isAudioEnabled;
      }
    }
  }, [isAudioEnabled, stream]);

  const handleJoinMeeting = () => {
    if (meetingId.trim() && userName.trim()) {
      onJoinMeeting(meetingId.trim(), userName.trim());
    }
  };

  const handleCreateMeeting = () => {
    if (userName.trim()) {
      onCreateMeeting(userName.trim());
    }
  };

  const generateMeetingId = () => {
    const randomId = Math.random().toString(36).substring(2, 15);
    setMeetingId(randomId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to Meet</h1>
          <p className="text-lg text-gray-600">
            Premium video meetings. Now free for everyone.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Video Preview */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Camera Preview</h2>
            
            {/* Video container */}
            <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video mb-4">
              {isVideoEnabled && stream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-medium">
                    {userName.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
              )}

              {/* Video off indicator */}
              {!isVideoEnabled && (
                <div className="absolute top-4 left-4 bg-black bg-opacity-50 rounded-full p-2">
                  <VideoOff size={20} className="text-white" />
                </div>
              )}

              {/* Audio muted indicator */}
              {!isAudioEnabled && (
                <div className="absolute top-4 right-4 bg-red-500 rounded-full p-2">
                  <MicOff size={20} className="text-white" />
                </div>
              )}
            </div>

            {/* Preview controls */}
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                className={`p-3 rounded-full transition-all duration-200 ${
                  isAudioEnabled
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
                title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
              >
                {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
              </button>

              <button
                onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                className={`p-3 rounded-full transition-all duration-200 ${
                  isVideoEnabled
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
                title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
              >
                {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
              </button>

              <button
                className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200"
                title="Settings"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>

          {/* Meeting options */}
          <div className="space-y-6">
            {/* User name input */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Your Name</h3>
              <input
                type="text"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
            </div>

            {/* Create meeting */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Start a Meeting</h3>
              <button
                onClick={handleCreateMeeting}
                disabled={!userName.trim()}
                className={`w-full py-3 px-6 rounded-lg font-medium text-lg transition-all duration-200 ${
                  userName.trim()
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Camera size={20} />
                  <span>New Meeting</span>
                </div>
              </button>
            </div>

            {/* Join meeting */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Join a Meeting</h3>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter meeting ID"
                    value={meetingId}
                    onChange={(e) => setMeetingId(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={generateMeetingId}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    title="Generate random ID"
                  >
                    Random
                  </button>
                </div>
                <button
                  onClick={handleJoinMeeting}
                  disabled={!meetingId.trim() || !userName.trim()}
                  className={`w-full py-3 px-6 rounded-lg font-medium text-lg transition-all duration-200 ${
                    meetingId.trim() && userName.trim()
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Join Meeting
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600">
          <p className="text-sm">
            By proceeding, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;