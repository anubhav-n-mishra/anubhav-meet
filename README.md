# Google Meet Clone

A modern video conferencing application built with React, Vite, and WebRTC that replicates the core functionality of Google Meet with contemporary design patterns.

## Features

### ✅ Implemented
- **Modern UI Design**: Clean, responsive interface inspired by Google Meet
- **Video Controls**: Camera on/off, microphone mute/unmute
- **Screen Sharing**: Share your screen with meeting participants
- **Participant Management**: View and manage meeting participants
- **Real-time Chat**: Send messages during meetings
- **Meeting Creation & Joining**: Create new meetings or join existing ones
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### 🚧 In Progress
- **WebRTC Integration**: Peer-to-peer video/audio communication
- **Real-time Synchronization**: Socket.IO for real-time features

## Tech Stack

- **Frontend**: React 19.1.1 with JSX
- **Build Tool**: Vite 7.1.5
- **Styling**: Tailwind CSS with modern design tokens
- **Icons**: Lucide React for consistent iconography
- **Video**: WebRTC for peer-to-peer communication
- **Real-time**: Socket.IO for chat and signaling

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Usage

### Creating a Meeting
1. Enter your name in the "Your Name" field
2. Click "New Meeting" to create a new meeting room
3. Share the meeting ID with participants

### Joining a Meeting
1. Enter your name in the "Your Name" field
2. Enter the meeting ID in the "Join a Meeting" section
3. Click "Join Meeting"

### During a Meeting
- **Toggle Camera**: Click the video icon to turn your camera on/off
- **Toggle Microphone**: Click the microphone icon to mute/unmute
- **Screen Share**: Click the monitor icon to share your screen
- **Chat**: Click the message icon to open the chat panel
- **Participants**: Click the users icon to view participants
- **Leave Meeting**: Click the red "Leave" button to exit

## Project Structure

```
src/
├── components/
│   ├── HomePage.jsx          # Landing page with meeting options
│   ├── MeetingRoom.jsx       # Main meeting interface
│   ├── MeetingControls.jsx   # Control bar (mute, camera, etc.)
│   ├── ParticipantGrid.jsx   # Video grid layout
│   ├── VideoTile.jsx         # Individual participant video
│   ├── ParticipantsPanel.jsx # Participants sidebar
│   └── ChatPanel.jsx         # Chat sidebar
├── types/
│   └── index.js              # Type definitions and data structures
├── App.jsx                   # Main application component
└── index.css                 # Global styles with Tailwind imports
```

## License

This project is licensed under the MIT License.
