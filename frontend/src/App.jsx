import { useState } from "react";
import Avatar3D from "./components/Avatar3D";
import VideoFeed from "./components/VideoFeed";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const recognition = new SpeechRecognition();
recognition.continuous = false;

function App() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [faceTextureUrl, setFaceTextureUrl] = useState("/face.jpg");

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);

    speechSynthesis.speak(utterance);
  };

  const sendToAI = async (text) => {
    try {
      const res = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      speak(data.reply);
    } catch (error) {
      console.error("Error sending to AI:", error);
      speak("Sorry, I couldn't connect to the server.");
    }
  };

  const startListening = () => {
    recognition.start();

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      console.log("User said:", text);
      sendToAI(text);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h1>VisionMentor X</h1>

      <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "20px" }}>
        <Avatar3D isSpeaking={isSpeaking} faceTextureUrl={faceTextureUrl} />
        <VideoFeed onCapture={(dataUrl) => setFaceTextureUrl(dataUrl)} />
      </div>

      <div style={{ margin: "20px" }}>
        <button onClick={() => speak("Hello Aman, let's start your interview!")}>
          Start Interview
        </button>
        <button onClick={startListening} style={{ marginLeft: "10px" }}>
          🎤 Start Listening
        </button>
      </div>
    </div>
  );
}

export default App;