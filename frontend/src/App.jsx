import { useState, useEffect, useRef } from "react";
import Avatar3D from "./components/Avatar3D";
import VideoFeed from "./components/VideoFeed";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.lang = "en-US";
recognition.interimResults = false;

function App() {
  // Welcome & conversation state
  const [isWelcomeComplete, setIsWelcomeComplete] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  
  // Avatar state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [faceTextureUrl, setFaceTextureUrl] = useState(null);
  const [modelUrl, setModelUrl] = useState(null);
  const [inputModelUrl, setInputModelUrl] = useState("");
  const [pose, setPose] = useState(null);
  const [gestureMode, setGestureMode] = useState(null);
  const [phoneme, setPhoneme] = useState("sil");
  const [lipSyncValue, setLipSyncValue] = useState(0);
  const [debugInfo, setDebugInfo] = useState("");
  
  const audioAnalyserRef = useRef(null);
  const audioStreamRef = useRef(null);
  const messagesEndRef = useRef(null);
  const speakTimeoutRef = useRef(null);

  // Speech synthesis function - DEFINE FIRST BEFORE USE
  const speak = (text) => {
    try {
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.1;
      utterance.volume = 1;

      utterance.onstart = () => {
        console.log("🎙️ Robot starting to speak...");
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        console.log("✅ Robot finished speaking");
        setIsSpeaking(false);
        setIsWelcomeComplete(true);
      };

      utterance.onerror = (event) => {
        console.error("❌ Speech synthesis error:", event.error);
        setIsSpeaking(false);
        setIsWelcomeComplete(true);
        setDebugInfo(`Speech error: ${event.error}`);
      };

      if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = setTimeout(() => {
        speechSynthesis.speak(utterance);
      }, 100);
    } catch (error) {
      console.error("❌ Error in speak function:", error);
      setDebugInfo(`Speak error: ${error.message}`);
      setIsWelcomeComplete(true);
    }
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Welcome introduction on mount
  useEffect(() => {
    const introduceRobot = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const introduction = "Hello! I'm your AI Mentor Robot. Welcome! I'm here to have a conversation with you, answer your questions, and help you learn. Please go ahead and ask me anything or just chat with me!";
      
      setMessages([{ role: "bot", text: introduction, timestamp: new Date() }]);
      console.log("🤖 Robot introducing...");
      speak(introduction);
      setGestureMode("hello");
      setTimeout(() => setGestureMode(null), 2000);
    };

    introduceRobot();
    
    return () => {
      if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);
      speechSynthesis.cancel();
    };
  }, []);

  const sendToAI = async (userText) => {
    setMessages((prev) => [...prev, { role: "user", text: userText, timestamp: new Date() }]);
    setDebugInfo("");

    try {
      console.log("📤 Sending to AI:", userText);
      const res = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });

      if (!res.ok) {
        throw new Error(`Backend error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const botReply = data.reply || "I didn't quite understand that. Could you please repeat?";

      console.log("📥 Receiving from AI:", botReply);
      setMessages((prev) => [...prev, { role: "bot", text: botReply, timestamp: new Date() }]);
      console.log("🎙️ Speaking...");
      speak(botReply);

      const intent = detectGestureIntent(userText);
      if (intent) {
        setGestureMode(intent);
        setTimeout(() => setGestureMode(null), 2000);
      }
    } catch (error) {
      console.error("❌ Error sending to AI:", error);
      setDebugInfo(`Error: ${error.message}`);
      const errorMsg = "Sorry, I couldn't connect to the server. Please make sure the backend is running on port 5000.";
      setMessages((prev) => [...prev, { role: "bot", text: errorMsg, timestamp: new Date() }]);
      speak(errorMsg);
    }
  };

  const startAudioAnalysis = async () => {
    if (audioAnalyserRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const audioContext = new window.AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      audioAnalyserRef.current = analyser;

      const updateLevel = () => {
        const buffer = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(buffer);
        const sum = buffer.reduce((acc, v) => acc + v, 0);
        const avg = sum / buffer.length;
        setLipSyncValue(Math.min(1, avg / 128));
        requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (error) {
      console.error("Error initializing audio analysis:", error);
    }
  };

  const detectGestureIntent = (text) => {
    const normalized = text.toLowerCase();
    if (/hello|hi|hey|greet/.test(normalized)) return "hello";
    if (/nod|yes|agree|ok|correct/.test(normalized)) return "nod";
    if (/no|not|disagree|wrong/.test(normalized)) return "shake";
    if (/point|look|that|this/.test(normalized)) return "point";
    if (/bow|thanks|thank|appreciate/.test(normalized)) return "bow";
    return null;
  };

  const startListening = async () => {
    if (!isWelcomeComplete) {
      setDebugInfo("⏳ Wait for intro to finish first");
      return;
    }

    setIsListening(true);
    setDebugInfo("");
    
    try {
      await startAudioAnalysis();
      console.log("🎙️ Starting speech recognition...");
      recognition.start();

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        console.log("📢 User said:", text);
        setIsListening(false);
        if (text && text.trim()) {
          sendToAI(text);
        }
      };

      recognition.onerror = (event) => {
        console.error("❌ Speech recognition error:", event.error);
        setDebugInfo(`Mic error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        console.log("🛑 Speech recognition ended");
        setIsListening(false);
      };
    } catch (error) {
      console.error("❌ Error starting listener:", error);
      setDebugInfo(`Error: ${error.message}`);
      setIsListening(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "#fff",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ padding: "20px", textAlign: "center", borderBottom: "2px solid rgba(255,255,255,0.2)" }}>
        <h1 style={{ margin: "0", fontSize: "2.5em", marginBottom: "5px" }}>🤖 VisionMentor X</h1>
        <p style={{ margin: "0", fontSize: "0.9em", opacity: 0.9 }}>AI Humanoid Robot Conversational Partner</p>
      </div>

      {/* Main Content */}
      <div style={{ display: "flex", height: "calc(100vh - 100px)", gap: "20px", padding: "20px" }}>
        {/* Left: Avatar & Video */}
        <div style={{ flex: "0 0 600px", display: "flex", flexDirection: "column", gap: "15px" }}>
          {/* Avatar */}
          <div style={{
            flex: 1,
            background: "rgba(0,0,0,0.3)",
            borderRadius: "12px",
            border: "3px solid rgba(255,255,255,0.3)",
            overflow: "hidden",
          }}>
            <Avatar3D
              isSpeaking={isSpeaking}
              faceTextureUrl={faceTextureUrl}
              modelPath={modelUrl}
              pose={pose}
              lipSync={lipSyncValue}
              gesture={gestureMode}
              phoneme={phoneme}
            />
          </div>

          {/* Video Feed */}
          <div style={{
            flex: "0 0 280px",
            background: "rgba(0,0,0,0.3)",
            borderRadius: "12px",
            border: "3px solid rgba(255,255,255,0.3)",
            padding: "10px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}>
            <VideoFeed onCapture={(dataUrl) => setFaceTextureUrl(dataUrl)} onPose={(p) => setPose(p)} />
          </div>

          {/* Model URL Input */}
          <div style={{ background: "rgba(0,0,0,0.2)", padding: "10px", borderRadius: "8px" }}>
            <input
              type="text"
              value={inputModelUrl}
              onChange={(e) => setInputModelUrl(e.target.value)}
              placeholder="Paste ReadyPlayerMe GLB URL here"
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #999",
                marginBottom: "8px",
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={() => {
                if (inputModelUrl.trim()) {
                  setModelUrl(inputModelUrl.trim());
                }
              }}
              style={{
                width: "100%",
                padding: "8px",
                background: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Load Custom Model
            </button>
          </div>
        </div>

        {/* Right: Conversation */}
        <div style={{
          flex: 1,
          background: "rgba(0,0,0,0.3)",
          borderRadius: "12px",
          border: "3px solid rgba(255,255,255,0.3)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Chat Messages */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
          }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: "center", opacity: 0.6, marginTop: "20px" }}>
                <p>Waiting for robot introduction...</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}>
                  <div style={{
                    maxWidth: "80%",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    background: msg.role === "user" ? "#4CAF50" : "rgba(255,255,255,0.2)",
                    color: "#fff",
                    wordWrap: "break-word",
                    whiteSpace: "pre-wrap",
                  }}>
                    {msg.role === "bot" && <strong>🤖 Robot: </strong>}
                    {msg.role === "user" && <strong>👤 You: </strong>}
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            {isSpeaking && (
              <div style={{ textAlign: "center", opacity: 0.7, fontSize: "0.9em" }}>
                <span>🎙️ Robot is speaking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: "15px", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
              <button
                onClick={startListening}
                disabled={isListening || isSpeaking}
                style={{
                  flex: 1,
                  padding: "15px",
                  background: isListening ? "#ff9800" : "#2196F3",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: isListening || isSpeaking ? "not-allowed" : "pointer",
                  opacity: isListening || isSpeaking ? 0.7 : 1,
                }}
              >
                {isListening ? "🎤 Listening..." : "🎤 Click to Speak"}
              </button>
              <button
                onClick={() => speak("Test: The robot is working!")}
                disabled={isSpeaking}
                title="Test if robot voice is working"
                style={{
                  padding: "15px 20px",
                  background: "#FF6BA6",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: isSpeaking ? "not-allowed" : "pointer",
                  opacity: isSpeaking ? 0.7 : 1,
                }}
              >
                🧪 Test
              </button>
            </div>
            {debugInfo && (
              <div style={{ background: "#ff6b6b", padding: "8px", borderRadius: "6px", fontSize: "12px", marginBottom: "8px" }}>
                🔧 {debugInfo}
              </div>
            )}
            {!isWelcomeComplete && (
              <div style={{ background: "#ffa500", padding: "8px", borderRadius: "6px", fontSize: "12px" }}>
                ⏳ Waiting for robot introduction to complete...
              </div>
            )}
            <small style={{ display: "block", marginTop: "8px", opacity: 0.8 }}>
              Click mic and speak. If no sound, click Test button first!
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
