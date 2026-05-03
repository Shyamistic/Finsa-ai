import { useRef, useEffect } from 'react';
import { BandwidthTier } from '../hooks/useBandwidthProbe';
import { t, Language } from '../lib/i18n';
import clsx from 'clsx';
import { Wifi, WifiOff, Volume2 } from 'lucide-react';

interface VideoPanelProps {
  stream: MediaStream | null;
  tier: BandwidthTier;
  language: Language;
  isConnected: boolean;
}

const TIER_BADGE: Record<BandwidthTier, { label: string; color: string }> = {
  '720p': { label: 'HD', color: 'bg-green-500' },
  '480p': { label: 'SD', color: 'bg-yellow-500' },
  '360p': { label: 'LQ', color: 'bg-orange-500' },
  'audio-only': { label: 'Audio', color: 'bg-red-500' },
};

export default function VideoPanel({ stream, tier, language, isConnected }: VideoPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const badge = TIER_BADGE[tier];

  return (
    <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video">
      {tier !== 'audio-only' ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-white gap-3">
          <Volume2 className="w-12 h-12 text-gray-400" />
          <p className="text-sm text-gray-400">{t('session.bandwidth.audio-only', language)}</p>
        </div>
      )}

      {/* Connection status */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        {isConnected ? (
          <div className="flex items-center gap-1.5 bg-black/50 rounded-full px-2 py-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-white">Live</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-black/50 rounded-full px-2 py-1">
            <WifiOff className="w-3 h-3 text-red-400" />
            <span className="text-xs text-white">{t('session.connecting', language)}</span>
          </div>
        )}
      </div>

      {/* Bandwidth tier badge */}
      <div className="absolute top-3 right-3">
        <span className={clsx('text-xs text-white px-2 py-1 rounded-full font-medium', badge.color)}>
          {badge.label}
        </span>
      </div>

      {/* No stream overlay */}
      {!stream && tier !== 'audio-only' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center text-gray-400">
            <Wifi className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">{t('session.connecting', language)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
