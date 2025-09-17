import { useState, useEffect } from 'react';
import HomePage from './components/ImprovedHomePage';
import MeetingRoom from './components/WebRTCRoom';
import URLMeetingJoin from './components/URLMeetingJoin';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'meeting' | 'url-join'
  const [meetingData, setMeetingData] = useState(null);
  const [urlMeetingId, setUrlMeetingId] = useState(null);

  useEffect(() => {
    // Check if URL contains meeting ID
    const urlParams = new URLSearchParams(window.location.search);
    const meetId = urlParams.get('meet');
    
    if (meetId) {
      setUrlMeetingId(meetId);
      setCurrentView('url-join');
    }
  }, []);

  const handleJoinMeeting = (meetingId, userName) => {
    const localParticipant = {
      id: 'local-' + Date.now(),
      name: userName,
      videoEnabled: true,
      audioEnabled: true,
    };

    setMeetingData({
      meetingId,
      localParticipant,
      remoteParticipants: [], // Start with empty participants
    });
    
    // Update URL to include meeting ID
    window.history.pushState({}, '', `?meet=${meetingId}`);
    setCurrentView('meeting');
  };

  const handleCreateMeeting = (userName, uniqueId) => {
    const meetingId = uniqueId || Math.random().toString(36).substring(2, 15);
    handleJoinMeeting(meetingId, userName);
  };

  const handleLeaveMeeting = () => {
    // Clear URL parameters
    window.history.pushState({}, '', window.location.pathname);
    setCurrentView('home');
    setMeetingData(null);
  };

  const handleGoHome = () => {
    // Clear URL parameters
    window.history.pushState({}, '', window.location.pathname);
    setCurrentView('home');
    setUrlMeetingId(null);
    setMeetingData(null);
  };

  if (currentView === 'url-join' && urlMeetingId) {
    return (
      <URLMeetingJoin
        meetingId={urlMeetingId}
        onJoinMeeting={handleJoinMeeting}
        onGoHome={handleGoHome}
      />
    );
  }

  if (currentView === 'meeting' && meetingData) {
    return (
      <MeetingRoom
        meetingId={meetingData.meetingId}
        localParticipant={meetingData.localParticipant}
        remoteParticipants={meetingData.remoteParticipants}
        onLeaveMeeting={handleLeaveMeeting}
      />
    );
  }

  return (
    <HomePage
      onJoinMeeting={handleJoinMeeting}
      onCreateMeeting={handleCreateMeeting}
    />
  );
}

export default App;
