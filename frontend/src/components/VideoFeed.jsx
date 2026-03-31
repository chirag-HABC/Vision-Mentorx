import { useEffect, useRef, useState } from "react";
import * as posenet from "@tensorflow-models/posenet";
import * as tf from "@tensorflow/tfjs";

function VideoFeed({ onCapture, onPose }) {
  const videoRef = useRef();
  const poseNetModelRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    const initCamera = async () => {
      try {
        console.log("📷 Requesting camera access...");
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          console.log("✓ Camera stream connected");
          setCameraReady(true);
        }

        const model = await posenet.load({
          architecture: "MobileNetV1",
          outputStride: 16,
          inputResolution: { width: 257, height: 200 },
          multiplier: 0.75,
        });

        poseNetModelRef.current = model;
        console.log("✓ PoseNet model loaded");

        const estimatePose = async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) {
            requestAnimationFrame(estimatePose);
            return;
          }

          const pose = await model.estimateSinglePose(videoRef.current, {
            flipHorizontal: true,
          });

          if (typeof onPose === "function") onPose(pose);
          requestAnimationFrame(estimatePose);
        };

        estimatePose();
      } catch (error) {
        console.error("❌ Error:", error.message);
        setCameraError(error.message);
      }
    };

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onPose, stream]);

  const capture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    if (typeof onCapture === "function") {
      onCapture(dataUrl);
    }
  };

  return (
    <div style={{ textAlign: "center", minWidth: "350px" }}>
      {cameraError ? (
        <div
          style={{
            width: "350px",
            height: "300px",
            backgroundColor: "#ffebee",
            border: "2px solid #d32f2f",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            color: "#d32f2f",
            padding: "20px",
            margin: "0 auto"
          }}
        >
          <div style={{ fontSize: "24px", marginBottom: "10px" }}>📷 Camera Error</div>
          <div style={{ fontSize: "12px", textAlign: "center" }}>{cameraError}</div>
          <div style={{ fontSize: "11px", marginTop: "10px", color: "#999" }}>
            Check browser permissions or grant camera access
          </div>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            width="350"
            height="300"
            style={{
              border: "2px solid #007bff",
              borderRadius: "8px",
              backgroundColor: "#000",
              display: "block",
              margin: "0 auto",
              opacity: cameraReady ? 1 : 0.5
            }}
          />
          {!cameraReady && (
            <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>Loading camera...</div>
          )}
        </>
      )}
      <button
        onClick={capture}
        disabled={!cameraReady}
        style={{
          display: "block",
          marginTop: "10px",
          padding: "8px 16px",
          marginLeft: "auto",
          marginRight: "auto",
          opacity: cameraReady ? 1 : 0.5,
          cursor: cameraReady ? "pointer" : "not-allowed"
        }}
      >
        📸 Capture face texture
      </button>
    </div>
  );
}

export default VideoFeed;