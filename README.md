# VisionMentor X - AI-Powered Interview System

A complete AI-powered interview system with 3D avatar, speech recognition, camera access, and real-time AI interaction.

## Features

- 🤖 **Humanoid Robot Avatar**: Detailed 3D robot with head, body, arms, legs, and animated speaking features
- 🎤 **Speech Recognition**: Real-time speech-to-text using Web Speech API
- 📹 **Camera Access**: Live video feed integration
- 🤖 **AI Backend**: Express server with AI chat functionality
- 🔊 **Text-to-Speech**: AI responses spoken back to user with animated mouth
- ⚡ **Real-time Interaction**: Complete conversational AI interview experience

## Project Structure

```
VisionMentorX/
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Avatar3D.jsx    # 3D humanoid robot avatar with animations
│   │   │   └── VideoFeed.jsx   # Camera video feed
│   │   ├── App.jsx             # Main app component
│   │   └── main.jsx            # App entry point
│   └── package.json
└── backend/           # Express.js backend
    ├── server.js      # AI chat server
    └── package.json
```

## Setup & Installation

### Backend Setup
```bash
cd backend
npm install
npm start
```
Server runs on http://localhost:5000

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
App runs on http://localhost:5175

## Usage

1. **Start Interview**: Click "Start Interview" to hear the AI introduction
2. **Camera Access**: Grant camera permissions when prompted
3. **Voice Interaction**: Click "🎤 Start Listening" to speak to the AI
4. **AI Response**: AI will respond verbally to your speech

## Browser Permissions

Make sure to allow:
- 🎤 Microphone access for speech recognition
- 📹 Camera access for video feed

## Future Enhancements

- [ ] Integrate ReadyPlayerMe avatars
- [ ] Add OpenAI GPT integration
- [ ] Implement facial expression analysis
- [ ] Add interview question database
- [ ] Real-time conversation scoring

## Technologies Used

- **Frontend**: React 19, Vite, React Three Fiber, Three.js
- **Backend**: Node.js, Express.js, CORS
- **AI**: Web Speech API, Speech Synthesis API
- **Media**: WebRTC for camera access