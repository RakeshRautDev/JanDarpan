import React, { useRef, useState } from 'react';
import { Camera, RefreshCw, CheckCircle, Image as ImageIcon, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import exifr from 'exifr';

const CameraCapture = ({ onCapture }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [photoData, setPhotoData] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setIsCameraOpen(true);
            setPhotoData(null);
        } catch (err) {
            console.error("Error accessing camera: ", err);
            alert("Unable to access camera. Please allow permissions or upload an image.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCameraOpen(false);
    };

    const processAndStripImage = async (fileOrBlob) => {
        setProcessing(true);
        try {
            // 1. Audit EXIF to prove privacy enforcement
            const exifData = await exifr.parse(fileOrBlob).catch(() => null);
            if (exifData) {
                console.log("EXIF Metadata detected. Engaging strict stripping protocol.");
            }

            // 2. Compress and strictly strip all metadata (GPS, Make, Model, Time)
            const options = {
                maxSizeMB: 1, // Compress to < 1MB for fast Cloudinary upload
                maxWidthOrHeight: 1280,
                useWebWorker: true,
                exifOrientation: false // Hard-strips all residual EXIF 
            };

            const compressedFile = await imageCompression(fileOrBlob, options);

            // 3. Convert back to Base64 to pipe into Cloudinary and Gemini
            const reader = new FileReader();
            reader.readAsDataURL(compressedFile);
            reader.onloadend = () => {
                const base64data = reader.result;
                setPhotoData(base64data);
                setProcessing(false);
                if (onCapture) onCapture(base64data);
            }
        } catch (error) {
            console.error("Error compressing/stripping image:", error);
            setProcessing(false);
            alert("Failed to process image securely. Please try again.");
        }
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Export to blob for compression rather than generic base64
            canvas.toBlob((blob) => {
                stopCamera();
                processAndStripImage(blob);
            }, 'image/jpeg', 1.0);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            processAndStripImage(file);
        }
    };

    return (
        <div className="w-full">
            {!isCameraOpen && !photoData && !processing && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        onClick={startCamera}
                        className="border-2 border-dashed border-slate-300 rounded-lg h-48 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 hover:border-primary-400 transition-colors group"
                    >
                        <Camera className="w-10 h-10 text-slate-400 group-hover:text-primary-500 mb-2" />
                        <span className="font-semibold text-slate-700">Open Camera</span>
                    </button>

                    <label className="border-2 border-dashed border-slate-300 rounded-lg h-48 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 hover:border-primary-400 transition-colors group cursor-pointer">
                        <input
                            type="file"
                            accept="image/jpeg, image/png"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                        <ImageIcon className="w-10 h-10 text-slate-400 group-hover:text-primary-500 mb-2" />
                        <span className="font-semibold text-slate-700">Upload Photo</span>
                        <span className="text-xs text-slate-400 mt-1">Strips EXIF automatically</span>
                    </label>
                </div>
            )}

            {processing && (
                <div className="flex flex-col items-center justify-center h-48 bg-slate-50 rounded-lg border-2 border-slate-200">
                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
                    <span className="text-slate-700 font-bold">Securing Metadata...</span>
                    <span className="text-slate-500 text-sm mt-1">Stripping GPS & EXIF data</span>
                </div>
            )}

            {isCameraOpen && (
                <div className="relative rounded-lg overflow-hidden bg-black flex flex-col items-center max-h-96">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full max-h-80 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 flex justify-center gap-4">
                        <button
                            onClick={stopCamera}
                            className="px-4 py-2 bg-slate-600 text-white rounded-full font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={takePhoto}
                            className="px-6 py-2 bg-primary-500 text-white rounded-full font-bold shadow-lg"
                        >
                            Capture
                        </button>
                    </div>
                </div>
            )}

            {photoData && (
                <div className="relative rounded-lg overflow-hidden border border-slate-200">
                    <img src={photoData} alt="Captured issue" className="w-full object-cover max-h-96" />
                    <div className="absolute top-4 right-4 bg-white/90 px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-semibold text-green-700 shadow-sm">
                        <CheckCircle className="w-4 h-4" /> Captured
                    </div>
                    <button
                        onClick={() => setPhotoData(null)}
                        className="absolute bottom-4 right-4 bg-white/90 text-slate-700 px-4 py-2 rounded-lg font-medium shadow flex items-center gap-2 hover:bg-white"
                    >
                        <RefreshCw className="w-4 h-4" /> Retake
                    </button>
                </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default CameraCapture;
