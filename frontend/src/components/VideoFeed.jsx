import { useEffect, useRef } from "react";

function VideoFeed({ onCapture }) {
  const videoRef = useRef();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((error) => {
        console.error("Error accessing camera:", error);
      });
  }, []);

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
    <div>
      <video ref={videoRef} autoPlay width="300" />
      <button onClick={capture} style={{ display: "block", marginTop: "10px" }}>
        📸 Capture face texture
      </button>
    </div>
  );
}

export default VideoFeed;