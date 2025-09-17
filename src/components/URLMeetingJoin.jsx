import React, { useState, useEffect } from 'react';
import { Users, ArrowRight } from 'lucide-react';

const URLMeetingJoin = ({ meetingId, onJoinMeeting, onGoHome }) => {
  const [userName, setUserName] = useState('');

  const handleJoin = () => {
    if (userName.trim()) {
      onJoinMeeting(meetingId, userName.trim());
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', 'Google Sans', sans-serif",
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '48px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(10px)',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          backgroundColor: '#667eea',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          color: 'white'
        }}>
          <Users size={32} />
        </div>

        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#1a1a1a',
          marginBottom: '12px'
        }}>
          Join Meeting
        </h1>

        <p style={{
          fontSize: '16px',
          color: '#6b7280',
          marginBottom: '8px'
        }}>
          Meeting ID: <strong>{meetingId}</strong>
        </p>

        <p style={{
          fontSize: '14px',
          color: '#9ca3af',
          marginBottom: '32px'
        }}>
          Enter your name to join the meeting
        </p>

        <div style={{ marginBottom: '24px' }}>
          <input
            type="text"
            placeholder="Your name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
            style={{
              width: '100%',
              padding: '16px 20px',
              fontSize: '16px',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              outline: 'none',
              transition: 'all 0.3s ease',
              fontFamily: 'inherit',
              backgroundColor: '#f9fafb'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            autoFocus
          />
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <button
            onClick={handleJoin}
            disabled={!userName.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '18px 32px',
              backgroundColor: userName.trim() ? '#667eea' : '#d1d5db',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: userName.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              boxShadow: userName.trim() ? '0 8px 25px rgba(102, 126, 234, 0.4)' : 'none'
            }}
          >
            Join Meeting
            <ArrowRight size={20} />
          </button>

          <button
            onClick={onGoHome}
            style={{
              padding: '16px 32px',
              backgroundColor: 'transparent',
              color: '#6b7280',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default URLMeetingJoin;