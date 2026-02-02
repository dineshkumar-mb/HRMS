import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { Camera, Scan, ShieldCheck, Loader2, X, AlertCircle } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../services/api';

const FaceLogin = ({ onBack, onSuccess }) => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanComplete, setScanComplete] = useState(false);
    const [isModelsLoaded, setIsModelsLoaded] = useState(false);
    const [error, setError] = useState(null);
    const { setAuth } = useAuthStore();

    useEffect(() => {
        const loadModels = async () => {
            try {
                const MODEL_URL = '/models';
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                setIsModelsLoaded(true);
            } catch (err) {
                console.error("Error loading face models:", err);
                setError('Failed to load face recognition models.');
            }
        };
        loadModels();
    }, []);

    const handleScan = async () => {
        if (!isModelsLoaded || !webcamRef.current) return;

        setIsScanning(true);
        setError(null);

        try {
            const video = webcamRef.current.video;
            const detections = await faceapi.detectSingleFace(video)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detections) {
                setError('No face detected. Please ensure you are in a well-lit area.');
                setIsScanning(false);
                return;
            }

            // Convert descriptor to regular array for JSON
            const descriptorArray = Array.from(detections.descriptor);

            const response = await api.post('/auth/face-login', {
                descriptor: descriptorArray
            });

            if (response.data.success) {
                setAuth(response.data);
                setScanComplete(true);
                setTimeout(() => onSuccess(), 1500);
            }
        } catch (err) {
            console.error("Face login error:", err);
            setError(err.response?.data?.message || 'Face not recognized. Please try again or use password.');
            setIsScanning(false);
        }
    };

    return (
        <div className="flex flex-col items-center space-y-6 max-w-sm w-full">
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-900 border-4 border-primary-500/20 shadow-2xl">
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover grayscale opacity-80"
                    videoConstraints={{ facingMode: "user" }}
                />
                <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

                {/* Scanning Overlay */}
                {isScanning && !scanComplete && (
                    <div className="absolute inset-0 z-10 pointer-events-none">
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary-500 shadow-[0_0_20px_rgba(59,130,246,0.8)] animate-face-scan"></div>
                        <div className="absolute inset-x-12 inset-y-20 border-2 border-primary-400/30 rounded-[40px] animate-pulse"></div>
                    </div>
                )}

                {/* Success Overlay */}
                {scanComplete && (
                    <div className="absolute inset-0 bg-primary-600/20 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in zoom-in">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-primary-600 mb-2 shadow-lg">
                            <ShieldCheck size={32} />
                        </div>
                        <p className="text-white font-bold text-lg">Identity Verified</p>
                    </div>
                )}

                {/* Initial Overlay */}
                {!isScanning && !scanComplete && (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white backdrop-blur-[2px]">
                        {!isModelsLoaded ? (
                            <div className="flex flex-col items-center">
                                <Loader2 className="animate-spin mb-2" size={32} />
                                <p className="text-sm font-medium">Initialising AI System...</p>
                            </div>
                        ) : (
                            <>
                                <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/50 flex items-center justify-center mb-4">
                                    <Camera size={24} />
                                </div>
                                <p className="text-sm font-medium">Ready for Face Recognition</p>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="w-full space-y-3">
                {!scanComplete && (
                    <button
                        onClick={handleScan}
                        disabled={isScanning || !isModelsLoaded}
                        className="w-full py-3.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50"
                    >
                        {isScanning ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Analysing Features...
                            </>
                        ) : (
                            <>
                                <Scan size={20} className="group-hover:rotate-12 transition-transform" />
                                Begin Face Recognition
                            </>
                        )}
                    </button>
                )}

                <button
                    onClick={onBack}
                    disabled={isScanning && !scanComplete}
                    className="w-full py-2 text-gray-500 font-semibold text-sm hover:text-gray-800 flex items-center justify-center gap-1 transition-colors"
                >
                    <X size={14} /> Traditional Login
                </button>
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 flex items-center gap-2 animate-in slide-in-from-top-2">
                    <AlertCircle size={14} />
                    {error}
                </div>
            )}
        </div>
    );
};

export default FaceLogin;
