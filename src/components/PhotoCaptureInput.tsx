'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  Trash2, 
  SwitchCamera,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';

interface PhotoCaptureInputProps {
  label: string;
  required?: boolean;
  value?: File | null;
  previewUrl?: string;
  onChange: (file: File | null, previewUrl: string) => void;
  captureMode?: 'user' | 'environment';
  cameraButtonLabel?: string;
  uploadButtonLabel?: string;
  helperText?: string;
  compact?: boolean;
}

export default function PhotoCaptureInput({
  label,
  required = false,
  value,
  previewUrl = '',
  onChange,
  captureMode = 'environment',
  cameraButtonLabel = 'Click Photo',
  uploadButtonLabel = 'Upload File',
  helperText,
  compact = false,
}: PhotoCaptureInputProps) {
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>(captureMode);
  const [cameraError, setCameraError] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera tracks helper
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Clean up stream on unmount or modal close
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Check if multiple camera devices exist
  useEffect(() => {
    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      }).catch(() => {});
    }
  }, []);

  // Start in-browser camera stream
  const startCameraStream = async (facing: 'user' | 'environment') => {
    stopCameraStream();
    setCameraError('');
    setIsCapturing(true);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera not supported directly in browser. Using device camera instead.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setIsCapturing(false);
    } catch (err: any) {
      setIsCapturing(false);
      setCameraError(err.message || 'Could not access camera. You can use native camera app below.');
    }
  };

  const openCameraModal = () => {
    setIsCameraModalOpen(true);
    setCurrentFacingMode(captureMode);
    startCameraStream(captureMode);
  };

  const closeCameraModal = () => {
    stopCameraStream();
    setIsCameraModalOpen(false);
    setCameraError('');
  };

  const handleSwitchCamera = () => {
    const nextFacing = currentFacingMode === 'user' ? 'environment' : 'user';
    setCurrentFacingMode(nextFacing);
    startCameraStream(nextFacing);
  };

  // Capture still photo from video stream
  const capturePhotoFromStream = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, flip horizontally for natural selfie look
    if (currentFacingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const localUrl = URL.createObjectURL(blob);
        onChange(file, localUrl);
        closeCameraModal();
      },
      'image/jpeg',
      0.92
    );
  };

  // Handle native file inputs (camera or gallery)
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const localUrl = URL.createObjectURL(file);
      onChange(file, localUrl);
      if (isCameraModalOpen) {
        closeCameraModal();
      }
    }
  };

  const handleClearPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null, '');
    if (nativeCameraInputRef.current) nativeCameraInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      {/* Hidden Native Inputs */}
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture={captureMode}
        onChange={handleFileSelected}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* Header Label */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-zinc-900">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {previewUrl && (
          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-teal-200">
            <CheckCircle2 className="w-3 h-3 text-teal-600" /> Photo Attached
          </span>
        )}
      </div>

      {/* Preview Card If Photo Exists */}
      {previewUrl ? (
        <div className="p-3 rounded-2xl bg-teal-50/40 border border-teal-200/80 shadow-xs flex items-center gap-3">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-zinc-200 bg-black shrink-0 shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <p className="text-xs font-bold text-zinc-900 truncate">
              {value?.name || 'Photo captured'}
            </p>
            {value?.size && (
              <p className="text-[10px] text-zinc-500">
                {(value.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
              </p>
            )}

            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={openCameraModal}
                className="px-2.5 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold text-[11px] flex items-center gap-1 transition-all active:scale-95 shadow-xs"
              >
                <Camera className="w-3 h-3" />
                <span>Retake</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-700 font-semibold text-[11px] flex items-center gap-1 transition-all"
              >
                <Upload className="w-3 h-3" />
                <span>Change</span>
              </button>

              <button
                type="button"
                onClick={handleClearPhoto}
                className="p-1 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors"
                title="Remove photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Action Buttons When No Photo Selected */
        <div className="space-y-2">
          <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'} gap-2`}>
            {/* 1. Click Photo (Direct Camera) Button */}
            <button
              type="button"
              onClick={openCameraModal}
              className="py-3 px-4 rounded-xl border-2 border-teal-500 bg-teal-50/80 hover:bg-teal-100/80 text-teal-950 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] group"
            >
              <div className="w-7 h-7 rounded-lg bg-teal-500 text-zinc-950 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Camera className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-black text-zinc-950 leading-tight">
                  {cameraButtonLabel}
                </span>
                <span className="block text-[10px] text-teal-800 font-medium leading-tight">
                  Open Camera Viewfinder
                </span>
              </div>
            </button>

            {/* 2. Upload from Gallery / File Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-3 px-4 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] group"
            >
              <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center shrink-0 group-hover:bg-zinc-200 transition-colors">
                <Upload className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-zinc-900 leading-tight">
                  {uploadButtonLabel}
                </span>
                <span className="block text-[10px] text-zinc-500 font-medium leading-tight">
                  From Gallery or Files
                </span>
              </div>
            </button>
          </div>

          {helperText && (
            <p className="text-[10px] text-zinc-500 px-1">{helperText}</p>
          )}
        </div>
      )}

      {/* Live Camera Viewfinder Modal */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            {/* Camera Header */}
            <div className="px-4 py-3 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping" />
                <span className="text-xs font-bold tracking-tight">Camera Active</span>
              </div>
              <div className="flex items-center gap-2">
                {hasMultipleCameras && (
                  <button
                    type="button"
                    onClick={handleSwitchCamera}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                    title="Flip camera"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeCameraModal}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Video Viewfinder Screen */}
            <div className="relative flex-1 bg-black aspect-4/3 sm:aspect-square flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${currentFacingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* Viewfinder Guideline Reticle */}
              <div className="absolute inset-8 border border-white/20 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
                <div className="flex justify-between">
                  <div className="w-3 h-3 border-t-2 border-l-2 border-teal-400" />
                  <div className="w-3 h-3 border-t-2 border-r-2 border-teal-400" />
                </div>
                <div className="flex justify-between">
                  <div className="w-3 h-3 border-b-2 border-l-2 border-teal-400" />
                  <div className="w-3 h-3 border-b-2 border-r-2 border-teal-400" />
                </div>
              </div>

              {/* Error fallback display */}
              {cameraError && (
                <div className="absolute inset-0 bg-zinc-950/90 p-5 flex flex-col items-center justify-center text-center space-y-3 z-10">
                  <Camera className="w-10 h-10 text-teal-400 opacity-60" />
                  <p className="text-xs text-zinc-300 max-w-xs">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      nativeCameraInputRef.current?.click();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-teal-500 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Open Device Camera App</span>
                  </button>
                </div>
              )}
            </div>

            {/* Camera Bottom Controls */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-900 flex items-center justify-around">
              {/* Fallback to Native OS Camera App */}
              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  nativeCameraInputRef.current?.click();
                }}
                className="px-3 py-2 rounded-xl text-zinc-400 hover:text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                title="Use phone native camera app"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Device App</span>
              </button>

              {/* Shutter Button */}
              <button
                type="button"
                onClick={capturePhotoFromStream}
                className="w-16 h-16 rounded-full border-4 border-white bg-teal-500 hover:bg-teal-400 active:scale-90 transition-all flex items-center justify-center shadow-lg shadow-teal-500/30"
                title="Click Photo"
              >
                <div className="w-12 h-12 rounded-full border-2 border-zinc-950/30 bg-white/20" />
              </button>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={closeCameraModal}
                className="px-3 py-2 rounded-xl text-zinc-400 hover:text-white text-[11px] font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

