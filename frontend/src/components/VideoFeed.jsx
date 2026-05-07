import { useEffect, useRef, useState, useCallback } from "react";
import * as posenet from "@tensorflow-models/posenet";
import * as tf from "@tensorflow/tfjs";

const ERROR_TYPES = {
  PERMISSION_DENIED: "permission_denied",
  NOT_FOUND: "not_found",
  IN_USE: "in_use",
  HARDWARE: "hardware",
  SECURITY: "security",
  UNKNOWN: "unknown",
};

function getErrorType(error) {
  const name = error.name?.toLowerCase() || "";
  const message = error.message?.toLowerCase() || "";
  if (name === "notallowederror" || message.includes("permission denied")) return ERROR_TYPES.PERMISSION_DENIED;
  if (name === "notfounderror" || message.includes("not found")) return ERROR_TYPES.NOT_FOUND;
  if (name === "notreadableerror" || message.includes("in use")) return ERROR_TYPES.IN_USE;
  if (name === "hardwareerror" || message.includes("hardware")) return ERROR_TYPES.HARDWARE;
  if (name === "securityerror" || message.includes("secure")) return ERROR_TYPES.SECURITY;
  return ERROR_TYPES.UNKNOWN;
}

function getErrorHelpMessage(errorType) {
  switch (errorType) {
    case ERROR_TYPES.PERMISSION_DENIED: return "Camera denied. Click camera icon in address bar.";
    case ERROR_TYPES.NOT_FOUND: return "No camera. Connect a camera.";
    case ERROR_TYPES.IN_USE: return "Camera in use. Close other apps.";
    case ERROR_TYPES.HARDWARE: return "Hardware error. Try different camera.";
    case ERROR_TYPES.SECURITY: return "Use HTTPS connection.";
    default: return "Check browser permissions.";
  }
}

function VideoFeed({ onCapture, onPose }) {
  const videoRef = useRef(null);
  const poseNetModelRef = useRef(null);
  const rafIdRef = useRef(null);
  const streamRef = useRef(null);
  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);
  
  const [cameraError, setCameraError] = useState(null);
  const [cameraErrorType, setCameraErrorType] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const MAX_RETRIES = 3;

  const cleanupStream = useCallback(() => {
    if (rafIdRef.current) { cancelAnimationFrame(rafIdRef.current); rafIdRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startPoseEstimation = useCallback(() => {
    if (!poseNetModelRef.current || !videoRef.current || !mountedRef.current) return;
    const model = poseNetModelRef.current;
    const estimatePose = async () => {
      if (!mountedRef.current || !videoRef.current) return;
      const video = videoRef.current;
      if (video.readyState < 2 || video.paused || video.ended) {
        rafIdRef.current = requestAnimationFrame(estimatePose);
        return;
      }
      try {
        const pose = await model.estimateSinglePose(video, { flipHorizontal: true });
        if (mountedRef.current && typeof onPose === "function") onPose(pose);
      } catch (err) { console.error("PoseNet error:", err); }
      if (mountedRef.current) rafIdRef.current = requestAnimationFrame(estimatePose);
    };
    estimatePose();
  }, [onPose]);

  const initializeCamera = useCallback(async () => {
    if (!mountedRef.current) return;
    setCameraError(null);
    setCameraErrorType(null);
    
    try {
      console.log("📷 Requesting camera...");
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error("Camera API not supported");
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: 640, height: 480 }, 
        audio: false 
      });
      
      if (!mountedRef.current) { stream.getTracks().forEach((track) => track.stop()); return; }
      streamRef.current = stream;
      setShowVideo(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (mountedRef.current && videoRef.current) {
            videoRef.current.play()
              .then(() => setCameraReady(true))
              .catch(err => console.error("Play error:", err));
          }
        };
      }
      
if (!poseNetModelRef.current) {
        console.log("⏳ Loading PoseNet...");
        try {
          await tf.setBackend("webgl");
          await tf.ready();
          const model = await posenet.load({ architecture: "MobileNetV1" });
          poseNetModelRef.current = model;
          setModelLoaded(true);
          startPoseEstimation();
        } catch (e) { 
          console.error("PoseNet error:", e);
          // Continue anyway - camera should still work
        }
      }
      retryCountRef.current = 0;
    } catch (error) {
      console.error("❌ Camera error:", error);
      if (!mountedRef.current) return;
      const errorType = getErrorType(error);
      setCameraErrorType(errorType);
      setCameraError(error.message || "Failed");
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        setTimeout(() => initializeCamera(), 2000);
      }
    }
  }, [startPoseEstimation]);

  useEffect(() => {
    mountedRef.current = true;
    initializeCamera();
    return () => { mountedRef.current = false; cleanupStream(); };
  }, [initializeCamera, cleanupStream]);

  const handleRetry = useCallback(() => {
    cleanupStream();
    retryCountRef.current = 0;
    setCameraReady(false);
    setShowVideo(false);
    setCameraError(null);
    setCameraErrorType(null);
    initializeCamera();
  }, [cleanupStream, initializeCamera]);

  const capture = useCallback(() => {
    if (!videoRef.current || !cameraReady) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const context = canvas.getContext("2d");
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    if (typeof onCapture === "function") onCapture(dataUrl);
  }, [cameraReady, onCapture]);

  if (cameraError) {
    return (
      <div style={{textAlign:"center",minWidth:"350px"}}>
        <div style={{width:"350px",height:"300px",backgroundColor:"#ffebee",border:"2px solid #d32f2f",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",color:"#d32f2f",padding:"20px",margin:"0 auto"}}>
          <div style={{fontSize:"24px",marginBottom:"10px"}}>📷 Camera Error</div>
          <div style={{fontSize:"14px",fontWeight:"bold",marginBottom:"10px"}}>
            {cameraErrorType === ERROR_TYPES.PERMISSION_DENIED && "🔒 Permission Denied"}
            {cameraErrorType === ERROR_TYPES.NOT_FOUND && "📷 No Camera"}
            {cameraErrorType === ERROR_TYPES.IN_USE && "⏳ In Use"}
            {cameraErrorType === ERROR_TYPES.HARDWARE && "⚠️ Hardware"}
            {cameraErrorType === ERROR_TYPES.SECURITY && "🔐 Security"}
            {cameraErrorType === ERROR_TYPES.UNKNOWN && "❌ Error"}
          </div>
          <div style={{fontSize:"12px",marginBottom:"15px"}}>{cameraError}</div>
          <div style={{fontSize:"11px",color:"#666",marginBottom:"15px"}}>{getErrorHelpMessage(cameraErrorType)}</div>
          <button onClick={handleRetry} style={{padding:"10px 20px",background:"#d32f2f",color:"white",border:"none",borderRadius:"6px",cursor:"pointer"}}>🔄 Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{textAlign:"center",minWidth:"350px"}}>
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            border: "2px solid #007bff",
            borderRadius: "8px",
            backgroundColor: "#000",
            display: "block",
            margin: "0 auto",
            width: "350px",
            height: "300px",
            transform: "scaleX(-1)",
          }}
        />
      ) : (
        <div style={{width:"350px",height:"300px",backgroundColor:"#f5f5f5",border:"2px solid #ccc",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",color:"#666",padding:"20px",margin:"0 auto"}}>
          <div style={{fontSize:"24px",marginBottom:"10px"}}>📷</div>
          <div style={{fontSize:"14px"}}>Loading camera...</div>
          {!modelLoaded && <div style={{fontSize:"12px",color:"#999",marginTop:"8px"}}>Loading AI model...</div>}
        </div>
      )}
      
      <div style={{fontSize:"12px",color:"#666",marginTop:"8px"}}>
        {cameraReady ? "✓ Camera ready" : "Loading..."}
      </div>
      <button
        onClick={capture}
        disabled={!cameraReady}
        style={{
          display:"block",marginTop:"10px",padding:"8px 16px",margin:"10px auto 0",
          opacity: cameraReady ? 1 : 0.5,cursor: cameraReady ? "pointer" : "not-allowed",
          background:"#007bff",color:"white",border:"none",borderRadius:"6px",
        }}
      >
        📸 Capture Face
      </button>
    </div>
  );
}

export default VideoFeed;
