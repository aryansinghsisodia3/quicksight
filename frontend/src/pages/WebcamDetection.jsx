import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, StopCircle, Radio, Activity } from 'lucide-react';
import api from '../api';
import Card from '../components/ui/Card';
import { useToast } from '../contexts/ToastContext';

const MIN_FRAME_INTERVAL_MS = 140;
const JPEG_QUALITY = 0.82;
const MAX_CAPTURE_WIDTH = 640;

export default function WebcamDetection() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [counts, setCounts] = useState({});
  const [fps, setFps] = useState(0);
  const { addToast } = useToast();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const previewObjectUrlRef = useRef(null);
  const inFlightRef = useRef(false);
  const lastSendRef = useRef(0);
  const fpsTimestampsRef = useRef([]);
  const rafRef = useRef(null);
  const loopActiveRef = useRef(false);

  const stopCamera = useCallback(() => {
    loopActiveRef.current = false;
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
    setPreviewUrl('');
    setCounts({});
    setFps(0);
    setIsStreaming(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      addToast('Camera API not available in this browser or context.', 'error');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((t) => t.stop());
        addToast('Video element not ready.', 'error');
        return;
      }
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.muted = true;
      await video.play();
      setIsStreaming(true);
      addToast('Camera active — sending frames to the detector.', 'success');
    } catch (err) {
      const name = err?.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        addToast('Camera permission denied. Allow access in the browser prompt or site settings.', 'error');
      } else if (name === 'NotFoundError') {
        addToast('No camera found on this device.', 'error');
      } else {
        addToast(err?.message || 'Could not open the camera.', 'error');
      }
    }
  }, [addToast]);

  const toggleStream = () => {
    if (isStreaming) {
      stopCamera();
      addToast('Stopped live detection.', 'info');
    } else {
      startCamera();
    }
  };

  useEffect(() => {
    if (!isStreaming) return;

    loopActiveRef.current = true;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const loop = () => {
      if (!loopActiveRef.current) return;

      const now = performance.now();
      if (
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        inFlightRef.current ||
        now - lastSendRef.current < MIN_FRAME_INTERVAL_MS
      ) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      lastSendRef.current = now;
      inFlightRef.current = true;

      const scale = vw > MAX_CAPTURE_WIDTH ? MAX_CAPTURE_WIDTH / vw : 1;
      const tw = Math.round(vw * scale);
      const th = Math.round(vh * scale);
      canvas.width = tw;
      canvas.height = th;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, tw, th);

      canvas.toBlob(
        async (blob) => {
          if (!blob || !loopActiveRef.current) {
            inFlightRef.current = false;
            rafRef.current = requestAnimationFrame(loop);
            return;
          }
          try {
            const formData = new FormData();
            formData.append('file', blob, 'frame.jpg');
            const res = await api.post('/detect/webcam/frame', formData, {
              responseType: 'blob',
              timeout: 120000,
            });
            const rawHeader =
              res.headers['x-detection-counts'] ?? res.headers['X-Detection-Counts'];
            if (rawHeader) {
              try {
                setCounts(JSON.parse(rawHeader));
              } catch {
                /* ignore malformed header */
              }
            }
            if (previewObjectUrlRef.current) {
              URL.revokeObjectURL(previewObjectUrlRef.current);
            }
            const url = URL.createObjectURL(res.data);
            previewObjectUrlRef.current = url;
            setPreviewUrl(url);

            const t = Date.now();
            fpsTimestampsRef.current = fpsTimestampsRef.current.filter(
              (x) => x > t - 1000
            );
            fpsTimestampsRef.current.push(t);
            setFps(fpsTimestampsRef.current.length);
          } catch (err) {
            let msg = err.message || 'Frame detection failed';
            const data = err.response?.data;
            if (data instanceof Blob) {
              try {
                const text = await data.text();
                const j = JSON.parse(text);
                if (j?.error) msg = j.error;
              } catch {
                /* keep msg */
              }
            } else if (data?.error) {
              msg = data.error;
            }
            addToast(String(msg), 'error');
          } finally {
            inFlightRef.current = false;
            if (loopActiveRef.current) {
              rafRef.current = requestAnimationFrame(loop);
            }
          }
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      loopActiveRef.current = false;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      inFlightRef.current = false;
    };
  }, [isStreaming, addToast]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const countsSummary = Object.entries(counts).length
    ? Object.entries(counts)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' · ')
    : '—';

  return (
    <div className="animate-in fade-in duration-500 mx-auto flex max-w-5xl flex-col gap-6">
      <video
        ref={videoRef}
        className="pointer-events-none fixed -left-[9999px] h-1 w-1 opacity-0"
        playsInline
        muted
        autoPlay
      />
      <canvas ref={canvasRef} className="hidden" />

      {!isStreaming ? (
        <button
          type="button"
          onClick={toggleStream}
          className="flex transform flex-col items-center justify-center gap-4 rounded-3xl border border-rose-500/50 bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-8 text-xl font-bold text-white shadow-xl shadow-rose-500/20 transition-transform hover:scale-[1.01] hover:from-rose-500 hover:to-pink-500"
        >
          <div className="rounded-full bg-white/20 p-5 shadow-inner">
            <Camera size={48} className="text-white" />
          </div>
          Allow camera &amp; start live detection
        </button>
      ) : (
        <button
          type="button"
          onClick={toggleStream}
          className="flex items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-slate-100 px-6 py-4 font-bold text-rose-600 shadow-sm transition-all hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-rose-400 dark:hover:bg-slate-700"
        >
          <StopCircle size={24} /> Stop camera
        </button>
      )}

      {isStreaming && (
        <Card className="overflow-hidden border-2 border-rose-500/30 p-0 shadow-2xl shadow-rose-900/10">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-100 p-3 dark:border-white/5 dark:bg-[#111]">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex animate-pulse items-center gap-1 rounded bg-rose-500 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                <Radio size={12} /> Live (browser camera)
              </span>
              <span className="font-mono text-xs font-medium text-slate-500 dark:text-slate-400">
                {countsSummary}
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-md border border-slate-300 bg-slate-200 px-3 py-1 font-mono text-xs text-slate-700 dark:border-white/10 dark:bg-black/50 dark:text-slate-300">
              <Activity size={12} className="text-emerald-500" /> ~{fps} proc/s
            </div>
          </div>

          <div className="flex min-h-[400px] items-center justify-center bg-slate-50 dark:bg-[#050505]">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Annotated webcam frame"
                className="block max-h-[70vh] w-full object-contain"
              />
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Waiting for first frame from the server…
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
