import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver, DrawingUtils, HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { HandTrackerProps } from '../types';

declare const vision: any;

const HandTracker: React.FC<HandTrackerProps> = ({ onLandmarks }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lastVideoTimeRef = useRef(-1);
    const animationFrameId = useRef<number | null>(null);
    const handLandmarkerRef = useRef<HandLandmarker | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const createHandLandmarker = async () => {
            try {
                const visionResolver = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.12/wasm"
                );
                const landmarker = await HandLandmarker.createFromOptions(visionResolver, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                        delegate: "GPU",
                    },
                    runningMode: "VIDEO",
                    numHands: 2,
                });
                if (isMounted) {
                    handLandmarkerRef.current = landmarker;
                    enableWebcam();
                }
            } catch (e) {
                if (e instanceof Error) {
                     setError(`Failed to initialize Hand Landmarker: ${e.message}`);
                } else {
                     setError('An unknown error occurred during initialization.');
                }
                setLoading(false);
            }
        };

        const enableWebcam = () => {
            navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 360 } })
                .then(stream => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.addEventListener('loadeddata', predictWebcam);
                    }
                })
                .catch(err => {
                    setError(`Error accessing webcam: ${err.message}`);
                    setLoading(false);
                });
        };

        const predictWebcam = () => {
            if (!videoRef.current || !canvasRef.current || !handLandmarkerRef.current) return;
            
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const canvasCtx = canvas.getContext("2d");

            if (!canvasCtx) return;

            if (video.currentTime !== lastVideoTimeRef.current) {
                lastVideoTimeRef.current = video.currentTime;
                const results = handLandmarkerRef.current.detectForVideo(video, Date.now());
                
                if (results.landmarks) {
                    onLandmarks(results, Date.now());
                }

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvasCtx.save();
                canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
                const drawingUtils = new DrawingUtils(canvasCtx);
                for (const landmarks of results.landmarks) {
                    drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: "#FFFFFF", lineWidth: 2 });
                    drawingUtils.drawLandmarks(landmarks, { color: "#4ade80", lineWidth: 1, radius: 3 });
                }
                canvasCtx.restore();
            }

            if (isMounted) {
                setLoading(false);
                animationFrameId.current = requestAnimationFrame(predictWebcam);
            }
        };

        createHandLandmarker();

        return () => {
            isMounted = false;
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            if(videoRef.current?.srcObject){
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="relative w-full aspect-video rounded-md overflow-hidden border border-gray-500">
            {loading && <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 text-xs"><p>Starting camera...</p></div>}
            {error && <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-75 p-2 text-center text-xs"><p>{error}</p></div>}
            <video ref={videoRef} autoPlay playsInline className="absolute w-full h-full object-cover transform -scale-x-100"></video>
            <canvas ref={canvasRef} className="absolute w-full h-full object-cover transform -scale-x-100"></canvas>
        </div>
    );
};

export default HandTracker;