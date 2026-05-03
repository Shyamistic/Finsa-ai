import { useState, useEffect } from 'react';

export type BandwidthTier = '720p' | '480p' | '360p' | 'audio-only';

const API_URL = import.meta.env.VITE_API_URL || '';

export function useBandwidthProbe(): { tier: BandwidthTier; probing: boolean; kbps: number } {
  const [tier, setTier] = useState<BandwidthTier>('480p');
  const [probing, setProbing] = useState(true);
  const [kbps, setKbps] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function probe() {
      try {
        const start = performance.now();
        await fetch(`${API_URL}/probe-100kb`, { cache: 'no-store' });
        if (cancelled) return;
        const elapsed = (performance.now() - start) / 1000;
        const measuredKbps = Math.round((100 * 8) / elapsed);
        setKbps(measuredKbps);

        let result: BandwidthTier;
        if (measuredKbps >= 1000) result = '720p';
        else if (measuredKbps >= 500) result = '480p';
        else if (measuredKbps >= 150) result = '360p';
        else result = 'audio-only';

        setTier(result);
      } catch {
        setTier('360p'); // conservative fallback
      } finally {
        if (!cancelled) setProbing(false);
      }
    }

    probe();
    return () => { cancelled = true; };
  }, []);

  return { tier, probing, kbps };
}

export function getWebRTCConstraints(tier: BandwidthTier): MediaStreamConstraints {
  if (tier === 'audio-only') {
    return { audio: true, video: false };
  }

  const resolutions: Record<BandwidthTier, { width: number; height: number; frameRate: number }> = {
    '720p': { width: 1280, height: 720, frameRate: 30 },
    '480p': { width: 854, height: 480, frameRate: 24 },
    '360p': { width: 640, height: 360, frameRate: 15 },
    'audio-only': { width: 0, height: 0, frameRate: 0 },
  };

  const res = resolutions[tier];
  return {
    audio: true,
    video: {
      width: { ideal: res.width },
      height: { ideal: res.height },
      frameRate: { ideal: res.frameRate },
    },
  };
}
