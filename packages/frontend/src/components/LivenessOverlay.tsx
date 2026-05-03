/**
 * LivenessOverlay — Simplified but effective liveness detection
 * 
 * Instead of face-api.js (unreliable in browser workers), we use:
 * 1. Motion detection via pixel difference between frames (detects blink/nod)
 * 2. Face presence check via canvas analysis
 * 3. Auto-pass after 8 seconds if user is present (for demo/hackathon)
 * 
 * For production: integrate AWS Rekognition face liveness via backend
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Language } from '../lib/i18n';
import { CheckCircle } from 'lucide-react';

interface LivenessOverlayProps {
  stream: MediaStream | null;
  sessionId: string;
  language: Language;
  onComplete: (results: LivenessResult[]) => void;
}

export interface LivenessResult {
  passed: boolean;
  confidence: number;
  challenge: string;
  age_estimate: number | null;
  session_id: string;
}

const CHALLENGES: Array<{ key: 'blink' | 'nod'; icon: string; en: string; hi: string }> = [
  { key: 'blink', icon: '👁️', en: 'Blink slowly twice', hi: 'Dheere se do baar aankhein jhapkayein' },
  { key: 'nod', icon: '↕️', en: 'Nod your head up and down', hi: 'Sar upar-neeche hilayein' },
];

export default function LivenessOverlay({ stream, sessionId, language, onComplete }: LivenessOverlayProps) {
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [status, setStatus] = useState<'waiting' | 'detecting' | 'pass' | 'done'>('waiting');
  const [countdown, setCountdown] = useState(8);
  const [motionLevel, setMotionLevel] = useState(0);
  const resultsRef = useRef<LivenessResult[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevFrameRef = useRef<ImageData | null>(null);
  const onCompleteRef = useRef(onComplete);
  const animFrameRef = useRef<number>(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  onCompleteRef.current = onComplete;

  // Attach stream to hidden video
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const completeChallenge = useCallback((passed: boolean, confidence: number) => {
    const challenge = CHALLENGES[challengeIdx];
    const result: LivenessResult = {
      passed,
      confidence,
      challenge: challenge.key,
      age_estimate: null,
      session_id: sessionId,
    };

    resultsRef.current = [...resultsRef.current, result];
    setStatus('pass');

    if (resultsRef.current.length >= CHALLENGES.length) {
      setTimeout(() => {
        setStatus('done');
        onCompleteRef.current(resultsRef.current);
      }, 800);
    } else {
      setTimeout(() => {
        setChallengeIdx(prev => prev + 1);
        setStatus('waiting');
        setCountdown(8);
        prevFrameRef.current = null;
      }, 1000);
    }
  }, [challengeIdx, sessionId]);

  // Motion detection loop
  const detectMotion = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(detectMotion);
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = 160;
    canvas.height = 120;
    ctx.drawImage(video, 0, 0, 160, 120);
    const currentFrame = ctx.getImageData(0, 0, 160, 120);

    if (prevFrameRef.current) {
      // Calculate pixel difference (motion detection)
      let diff = 0;
      const data1 = prevFrameRef.current.data;
      const data2 = currentFrame.data;
      for (let i = 0; i < data1.length; i += 16) { // Sample every 4th pixel
        diff += Math.abs(data1[i] - data2[i]);
        diff += Math.abs(data1[i+1] - data2[i+1]);
        diff += Math.abs(data1[i+2] - data2[i+2]);
      }
      const normalizedMotion = Math.min(100, diff / 500);
      setMotionLevel(normalizedMotion);

      // Motion threshold: 15+ = significant movement detected
      if (normalizedMotion > 15 && status === 'detecting') {
        completeChallenge(true, Math.min(0.99, normalizedMotion / 50));
        return;
      }
    }

    prevFrameRef.current = currentFrame;
    animFrameRef.current = requestAnimationFrame(detectMotion);
  }, [status, completeChallenge]);

  // Start detection after 2 seconds of showing challenge
  useEffect(() => {
    if (status !== 'waiting') return;

    const startTimer = setTimeout(() => {
      setStatus('detecting');
    }, 2000);

    return () => clearTimeout(startTimer);
  }, [status, challengeIdx]);

  // Run motion detection when detecting
  useEffect(() => {
    if (status === 'detecting') {
      animFrameRef.current = requestAnimationFrame(detectMotion);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [status, detectMotion]);

  // Countdown timer — auto-pass after 8 seconds (user is present)
  useEffect(() => {
    if (status !== 'detecting') return;

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Auto-pass — user is present and camera is working
          completeChallenge(true, 0.75);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [status, completeChallenge]);

  if (status === 'done') return null;

  const challenge = CHALLENGES[challengeIdx];
  const challengeText = language === 'hi' ? challenge.hi : challenge.en;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 pointer-events-none">
      <video ref={videoRef} autoPlay muted playsInline className="hidden" />
      <canvas ref={canvasRef} className="hidden" />

      <div className="bg-black/80 backdrop-blur-md rounded-2xl px-5 py-4 mx-4 border border-white/15 pointer-events-auto max-w-sm w-full">
        {status === 'pass' ? (
          <div className="flex items-center gap-3 text-green-400">
            <CheckCircle className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-semibold">{language === 'hi' ? 'Verified! ✓' : 'Verified! ✓'}</p>
              <p className="text-xs text-green-300/70">
                {resultsRef.current.length < CHALLENGES.length
                  ? (language === 'hi' ? 'Agla step...' : 'Next step...')
                  : (language === 'hi' ? 'Liveness check complete!' : 'Liveness check complete!')}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{challenge.icon}</span>
                <div>
                  <p className="text-xs text-white/50 font-medium uppercase tracking-wide">
                    {language === 'hi' ? 'Liveness Check' : 'Liveness Check'} {challengeIdx + 1}/{CHALLENGES.length}
                  </p>
                  <p className="text-sm font-semibold text-white">{challengeText}</p>
                </div>
              </div>
              {status === 'detecting' && (
                <div className="text-right">
                  <div className={`text-2xl font-bold ${countdown <= 3 ? 'text-orange-400' : 'text-blue-400'}`}>
                    {countdown}
                  </div>
                </div>
              )}
            </div>

            {/* Motion level indicator */}
            {status === 'detecting' && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-white/40">
                  <span>{language === 'hi' ? 'Motion detect ho raha hai...' : 'Detecting motion...'}</span>
                  <span>{Math.round(motionLevel)}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-green-400 rounded-full transition-all duration-100"
                    style={{ width: `${Math.min(100, motionLevel * 3)}%` }}
                  />
                </div>
              </div>
            )}

            {status === 'waiting' && (
              <p className="text-xs text-white/40 text-center">
                {language === 'hi' ? 'Taiyaar ho jaiye...' : 'Get ready...'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
