import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { Camera, Scan, ShieldCheck, Loader2, X, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../services/api';

const FaceEnrollment = ({ onComplete, onCancel }) => {
    const webcamRef = useRef(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isModelsLoaded, setIsModelsLoaded] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [enrollSuccess, setEnrollSuccess] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadModels = async () => {
            console.log("Starting to load face-api models...");
            try {
                const MODEL_URL = '/models';
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                console.log("Face-api models loaded successfully.");
                setIsModelsLoaded(true);
            } catch (err) {
                console.error("Error loading face models:", err);
                setError('Failed to load face recognition models.');
            }
        };
        loadModels();
    }, []);

    const handleUserMedia = (stream) => {
        console.log("✅ Webcam onUserMedia triggered - camera stream is ready", stream);
        setIsCameraReady(true);
        setError(null);
    };

    const handleUserMediaError = (err) => {
        console.error("❌ Camera access failed:", err);
        setError("Failed to access camera. Please allow camera permissions and refresh.");
        setIsCameraReady(false);
    };

    const handleEnroll = async () => {
        console.log("Capture Biometric Data button clicked");

        if (!isModelsLoaded || !webcamRef.current) {
            setError('System is still initializing. Please wait a moment.');
            return;
        }

        if (!isCameraReady) {
            setError('Waiting for camera stream to initialize...');
            return;
        }

        setIsScanning(true);
        setError(null);

        try {
            const video = webcamRef.current.video;
            console.log("Video dimensions:", video.videoWidth, "x", video.videoHeight);

            console.log("Attempting face detection...");
            const detections = await faceapi.detectSingleFace(video)
                .withFaceLandmarks()
                .withFaceDescriptor();

            console.log("Detections result:", detections);

            if (!detections) {
                setError('No face detected. Please position your face clearly in the frame.');
                setIsScanning(false);
                return;
            }

            const descriptorArray = Array.from(detections.descriptor);
            console.log("Success! descriptor captured.");

            const response = await api.post('/auth/enroll-face', {
                descriptor: descriptorArray
            });

            if (response.data.success) {
                setEnrollSuccess(true);
                setTimeout(() => onComplete(), 2000);
            }
        } catch (err) {
            console.error("Capture error:", err);
            setError(err.response?.data?.message || 'Failed to capture face data. Please try again.');
            setIsScanning(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Secure Face Enrollment</h3>
                {!enrollSuccess && (
                    <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                )}
            </div>

            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-900 border-4 border-primary-500/10 mb-6">
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                    videoConstraints={{ facingMode: "user" }}
                    onUserMedia={handleUserMedia}
                    onUserMediaError={handleUserMediaError}
                />

                {enrollSuccess && (
                    <div className="absolute inset-0 bg-green-600/20 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in zoom-in">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-green-600 mb-2 shadow-lg">
                            <ShieldCheck size={32} />
                        </div>
                        <p className="text-white font-bold text-lg">Enrollment Successful</p>
                    </div>
                )}

                {!isModelsLoaded && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                        <Loader2 className="animate-spin mb-2" size={32} />
                        <p className="text-sm">Preparing Biometric Engine...</p>
                    </div>
                )}
            </div>

            {!enrollSuccess && (
                <div className="space-y-4">
                    <p className="text-sm text-gray-500 text-center leading-relaxed">
                        Your facial features will be converted into a secure mathematical template.
                        We do not store your actual photo.
                    </p>

                    <button
                        onClick={handleEnroll}
                        disabled={isScanning || !isModelsLoaded}
                        className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50"
                    >
                        {isScanning ? (
                            <>
                                <RefreshCw className="animate-spin" size={20} />
                                Mapping Features...
                            </>
                        ) : (
                            <>
                                <Scan size={20} />
                                Capture Biometric Data
                            </>
                        )}
                    </button>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 flex items-center gap-2">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FaceEnrollment;
