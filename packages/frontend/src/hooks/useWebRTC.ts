import { useEffect, useRef, useState, useCallback } from 'react';
import { BandwidthTier, getWebRTCConstraints } from './useBandwidthProbe';

export function useWebRTC(tier: BandwidthTier) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const startStream = useCallback(async () => {
    try {
      const constraints = getWebRTCConstraints(tier);
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setIsConnected(true);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Camera access denied';
      setError(message);
    }
  }, [tier]);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
      setIsConnected(false);
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [stream]);

  return { localVideoRef, stream, error, isConnected, startStream, stopStream };
}
