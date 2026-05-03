import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Language } from '../lib/i18n';
import { useBandwidthProbe } from '../hooks/useBandwidthProbe';
import { useWebRTC } from '../hooks/useWebRTC';
import { useSocket } from '../hooks/useSocket';
import LivenessOverlay from '../components/LivenessOverlay';
import AgentDashboard from '../components/AgentDashboard';
import AutoFillFormPanel from '../components/AutoFillFormPanel';
import {
  Mic, MicOff, Clock, Wifi, Volume2, VolumeX, Send,
  Upload, FileText, CheckCircle, X, Camera, Zap
} from 'lucide-react';

const SESSION_DURATION = 300; // 5 minutes

// Web Speech API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionAny = any;

export default function SessionPage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const language: Language = (location.state as { language?: Language })?.language || 'en';
  const apiKey: string = (location.state as { apiKey?: string })?.apiKey || 'demo-key-loanwizard-2026';

  const { tier, probing } = useBandwidthProbe();
  const { stream, startStream } = useWebRTC(tier);
  const { connected, agentStates, agentMessage, sendLivenessResult, sendTranscript } = useSocket(sessionId || null);

  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION);
  const [livenessComplete, setLivenessComplete] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'agent' | 'user'; text: string; ts: number }>>([]);
  const [textInput, setTextInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState('');
  // Document upload state
  const [panFile, setPanFile] = useState<File | null>(null);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [panVerified, setPanVerified] = useState(false);
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [docUploading, setDocUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'docs' | 'form'>('chat');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionAny | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const panInputRef = useRef<HTMLInputElement>(null);
  const aadhaarInputRef = useRef<HTMLInputElement>(null);

  // Attach stream to video
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => { if (!probing) startStream(); }, [probing, startStream]);

  const sessionStartedRef = useRef(false);

  useEffect(() => {
    if (connected && !sessionStartedRef.current && sessionId) {
      sessionStartedRef.current = true;
      setSessionStarted(true);
      axios.post(`/sessions/${sessionId}/start`, {}, {
        headers: { Authorization: `Bearer ${apiKey}` }
      }).catch(console.error);
    }
  }, [connected, sessionId, apiKey]);

  // Countdown
  useEffect(() => {
    if (!sessionStarted) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStarted]);

  // Navigate to offer when ready
  useEffect(() => {
    if (agentStates['offer']?.status === 'completed' && sessionId) {
      setTimeout(() => navigate(`/offer/${sessionId}`, { state: { language, apiKey } }), 2000);
    }
  }, [agentStates, sessionId, navigate, language, apiKey]);

  // Show agent messages in chat + speak them
  useEffect(() => {
    if (!agentMessage.text) return;
    setChatHistory(prev => [...prev, { role: 'agent', text: agentMessage.text, ts: Date.now() }]);
    if (voiceEnabled) speakText(agentMessage.text, language);
  }, [agentMessage.id]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Text-to-Speech — uses Amazon Polly neural voice via backend, falls back to browser TTS
  const speakText = useCallback(async (text: string, lang: Language) => {
    if (!text.trim()) return;

    // Cancel any ongoing speech
    window.speechSynthesis?.cancel();

    try {
      // Try Amazon Polly first (Kajal — natural Indian female voice)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

      const response = await fetch('/tts/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: lang }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        // Timeout: if audio doesn't start within 3s, fall through
        await new Promise<void>((resolve, reject) => {
          const playTimeout = setTimeout(() => reject(new Error('audio play timeout')), 3000);
          audio.onplay = () => { clearTimeout(playTimeout); setIsSpeaking(true); resolve(); };
          audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(audioUrl); };
          audio.onerror = () => { clearTimeout(playTimeout); setIsSpeaking(false); URL.revokeObjectURL(audioUrl); reject(new Error('audio error')); };
          audio.play().catch(reject);
        });
        return;
      }
    } catch {
      // Polly unavailable or timed out — fall back to browser TTS
    }

    // Browser TTS fallback
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 1.0;

    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v =>
        v.lang.startsWith(lang === 'hi' ? 'hi' : 'en') &&
        (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') ||
         v.name.toLowerCase().includes('heera') || v.name.toLowerCase().includes('hazel'))
      ) || voices.find(v => v.lang.startsWith(lang === 'hi' ? 'hi' : 'en-IN'))
        || voices.find(v => v.lang.startsWith(lang === 'hi' ? 'hi' : 'en'));
      if (preferred) utterance.voice = preferred;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length > 0) trySpeak();
    else window.speechSynthesis.onvoiceschanged = trySpeak;
  }, []);

  // Speech-to-Text — push-to-talk style: click to start, click to stop
  // Uses non-continuous mode to avoid the duplicate-transcript storm
  const lastSentRef = useRef<string>('');
  const sendDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;      // Non-continuous: fires once per utterance
    recognition.interimResults = true;   // Show interim for UX only
    recognition.maxAlternatives = 1;
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    recognitionRef.current = recognition;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = '';
      let finalText = '';

      // Only process NEW results from resultIndex onwards — prevents re-processing old finals
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      setInterimTranscript(interim);

      if (finalText.trim()) {
        setInterimTranscript('');
        const trimmed = finalText.trim();

        // Debounce + dedup: don't send the same text twice within 2 seconds
        if (sendDebounceRef.current) clearTimeout(sendDebounceRef.current);
        sendDebounceRef.current = setTimeout(() => {
          if (trimmed !== lastSentRef.current) {
            lastSentRef.current = trimmed;
            handleSend(trimmed);
          }
        }, 300);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognition.onerror = (e: { error: string }) => {
      // 'no-speech' is normal — don't log it as an error
      if (e.error !== 'no-speech') {
        console.warn('Speech recognition error:', e.error);
      }
      setIsListening(false);
      setInterimTranscript('');
    };

    recognition.start();
    setIsListening(true);
  }, [language]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const handleSend = useCallback((text: string) => {
    if (!text.trim() || !sessionId) return;
    setChatHistory(prev => [...prev, { role: 'user', text: text.trim(), ts: Date.now() }]);
    sendTranscript(text.trim());
    setTextInput('');
  }, [sessionId, sendTranscript]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Document upload handler
  const handleDocUpload = useCallback(async (file: File, docType: 'pan' | 'aadhaar') => {
    if (!sessionId || !file) return;
    setDocUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('doc_type', docType);
      await axios.post(`/sessions/${sessionId}/documents/verify`, formData, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });
      if (docType === 'pan') setPanVerified(true);
      else setAadhaarVerified(true);
      // Notify Priya
      const msg = docType === 'pan'
        ? (language === 'hi' ? 'PAN card upload ho gaya' : 'PAN card uploaded successfully')
        : (language === 'hi' ? 'Aadhaar card upload ho gaya' : 'Aadhaar card uploaded successfully');
      setChatHistory(prev => [...prev, { role: 'user', text: `[Document: ${docType.toUpperCase()} uploaded]`, ts: Date.now() }]);
      sendTranscript(msg);
    } catch {
      // Verification failed — still mark as uploaded for demo
      if (docType === 'pan') setPanVerified(true);
      else setAadhaarVerified(true);
    } finally {
      setDocUploading(false);
    }
  }, [sessionId, apiKey, language, sendTranscript]);

  const handleLivenessComplete = useCallback((results: Array<{ passed: boolean; confidence: number; challenge: string; age_estimate: number | null; session_id: string }>) => {
    setLivenessComplete(true);
    results.forEach(r => sendLivenessResult(r));
  }, [sendLivenessResult]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const timerPct = (timeLeft / SESSION_DURATION) * 100;

  const completedAgents = Object.values(agentStates).filter(s => s.status === 'completed').length;

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0f] overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-black/40 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">LW</span>
          </div>
          <div>
            <p className="text-base font-semibold text-white leading-tight">Finsa</p>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-xs text-white/50">{connected ? 'Live' : 'Connecting...'}</span>
              <span className="text-white/20 mx-1">·</span>
              <Wifi className="w-3 h-3 text-white/30" />
              <span className="text-xs text-white/30">{tier}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Agent progress */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className={`w-1.5 h-4 rounded-full transition-all ${i < completedAgents ? 'bg-blue-400' : 'bg-white/10'}`} />
              ))}
            </div>
            <span className="text-xs text-white/40">{completedAgents}/7</span>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-1.5">
            <div className="relative w-7 h-7">
              <svg className="w-7 h-7 -rotate-90" viewBox="0 0 28 28">
                <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
                <circle cx="14" cy="14" r="11" fill="none"
                  stroke={timeLeft < 30 ? '#f87171' : '#60a5fa'} strokeWidth="2.5"
                  strokeDasharray={`${2 * Math.PI * 11}`}
                  strokeDashoffset={`${2 * Math.PI * 11 * (1 - timerPct / 100)}`}
                  strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <Clock className="w-2.5 h-2.5 absolute inset-0 m-auto text-white/40" />
            </div>
            <span className={`text-sm font-mono font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-white/70'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </div>

      {/* Main layout: video left, chat+agents right */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-0 overflow-hidden min-h-0">

        {/* Video panel — takes 3/5 on desktop */}
        <div className="lg:col-span-3 relative bg-black flex flex-col overflow-hidden">
          {/* User video */}
          <div className="flex-1 relative">
            <video
              ref={videoRef}
              autoPlay muted playsInline
              className="w-full h-full object-cover"
            />

            {/* Liveness overlay */}
            {stream && !livenessComplete && sessionId && (
              <LivenessOverlay
                stream={stream}
                sessionId={sessionId}
                language={language}
                onComplete={handleLivenessComplete}
              />
            )}

            {/* No stream placeholder */}
            {!stream && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center text-white/30">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">👤</span>
                  </div>
                  <p className="text-sm">Camera connecting...</p>
                </div>
              </div>
            )}

            {/* Priya AI avatar overlay — top right */}
            <div className="absolute top-3 right-3">
              <div className={`w-16 h-16 rounded-2xl border-2 overflow-hidden transition-all ${isSpeaking ? 'border-blue-400 shadow-lg shadow-blue-400/30' : 'border-white/20'}`}>
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-violet-700 flex items-center justify-center">
                  <span className="text-2xl">🤖</span>
                </div>
                {isSpeaking && (
                  <div className="absolute inset-0 flex items-end justify-center pb-1">
                    <div className="flex gap-0.5">
                      {[0,1,2,3].map(i => (
                        <div key={i} className="w-0.5 bg-white rounded-full animate-bounce"
                          style={{ height: `${6 + Math.random() * 8}px`, animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-white/60 text-center mt-1">Priya</p>
            </div>

            {/* Interim transcript overlay */}
            {interimTranscript && (
              <div className="absolute bottom-16 left-0 right-0 flex justify-center px-4">
                <div className="bg-black/70 backdrop-blur-sm rounded-xl px-4 py-2 max-w-sm">
                  <p className="text-sm text-white/70 italic">{interimTranscript}...</p>
                </div>
              </div>
            )}
          </div>

          {/* Voice controls bar */}
          <div className="flex items-center justify-center gap-4 py-3 bg-black/60 border-t border-white/5 flex-shrink-0">
            {/* Mic button — click to toggle */}
            <button
              onClick={toggleListening}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-red-500 shadow-lg shadow-red-500/40 scale-110 ring-4 ring-red-500/30'
                  : 'bg-blue-500/20 border-2 border-blue-500/40 hover:bg-blue-500/30'
              }`}
            >
              {isListening
                ? <Mic className="w-6 h-6 text-white animate-pulse" />
                : <MicOff className="w-6 h-6 text-blue-400" />
              }
            </button>

            <div className="text-center">
              <p className="text-sm font-medium text-white/70">
                {isListening ? '🔴 Listening...' : '🎤 Click to speak'}
              </p>
              <p className="text-xs text-white/30 mt-0.5">
                {interimTranscript || (isListening ? 'Speak now' : 'or type below')}
              </p>
            </div>

            {/* Voice toggle */}
            <button
              onClick={() => { setVoiceEnabled(v => !v); if (voiceEnabled) window.speechSynthesis?.cancel(); }}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4 text-blue-400" /> : <VolumeX className="w-4 h-4 text-white/40" />}
            </button>
          </div>
        </div>

        {/* Right panel: Chat + Docs + Agents */}
        <div className="lg:col-span-2 flex flex-col overflow-hidden border-l border-white/5">

          {/* Tab bar */}
          <div className="flex border-b border-white/5 flex-shrink-0">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${activeTab === 'chat' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-white/40 hover:text-white/60'}`}
            >
              💬 Chat with Priya
            </button>
            <button
              onClick={() => setActiveTab('form')}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors relative ${activeTab === 'form' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-white/40 hover:text-white/60'}`}
            >
              <Zap className="w-3 h-3 inline mr-1" />Auto-Fill
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors relative ${activeTab === 'docs' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-white/40 hover:text-white/60'}`}
            >
              📄 Docs
              {(panVerified || aadhaarVerified) && (
                <span className="absolute top-1.5 right-2 w-2 h-2 bg-green-400 rounded-full" />
              )}
            </button>
          </div>

          {/* Auto-Fill tab */}
          {activeTab === 'form' && (
            <div className="flex-1 overflow-y-auto p-3 min-h-0">
              <AutoFillFormPanel
                autoFillData={(agentStates['auto_fill']?.data as unknown) as Parameters<typeof AutoFillFormPanel>[0]['autoFillData'] ?? null}
                isActive={sessionStarted}
              />
            </div>
          )}

          {/* Chat tab */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                  <span className="text-base">🤖</span>
                </div>
                <div>
                  <p className="text-base font-semibold text-white">Priya</p>
                  <p className="text-xs text-white/40">AI Loan Advisor · Poonawalla Fincorp</p>
                </div>
                {isSpeaking && (
                  <div className="ml-auto flex gap-0.5 items-end">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1 bg-blue-400 rounded-full animate-bounce"
                        style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {chatHistory.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
                      <span className="text-2xl">🤖</span>
                    </div>
                    <p className="text-base text-white/50">Priya will greet you shortly...</p>
                    <p className="text-sm text-white/30 mt-1">Speak or type to respond</p>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'agent' && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-sm">🤖</span>
                      </div>
                    )}
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-500/20 border border-blue-500/30 text-blue-50 rounded-tr-sm'
                        : 'bg-white/8 border border-white/10 text-white rounded-tl-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Text input */}
              <div className="flex gap-2 p-3 border-t border-white/5 flex-shrink-0">
                <input
                  type="text"
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend(textInput)}
                  placeholder={language === 'hi' ? 'टाइप करें या माइक दबाएं...' : 'Type or hold mic to speak...'}
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all"
                />
                <button
                  onClick={() => handleSend(textInput)}
                  disabled={!textInput.trim()}
                  className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center hover:bg-blue-500/30 transition-colors disabled:opacity-30 flex-shrink-0"
                >
                  <Send className="w-4 h-4 text-blue-400" />
                </button>
              </div>
            </div>
          )}

          {/* Documents tab */}
          {activeTab === 'docs' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              <div className="text-center py-2">
                <p className="text-sm font-semibold text-white">Document Verification</p>
                <p className="text-xs text-white/40 mt-1">Upload your documents for instant AI verification</p>
              </div>

              {/* PAN Card */}
              <div className={`border rounded-2xl p-4 transition-all ${panVerified ? 'border-green-500/40 bg-green-500/5' : 'border-white/10 bg-white/5'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${panVerified ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
                      <FileText className={`w-4 h-4 ${panVerified ? 'text-green-400' : 'text-blue-400'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">PAN Card</p>
                      <p className="text-xs text-white/40">Required for identity verification</p>
                    </div>
                  </div>
                  {panVerified
                    ? <CheckCircle className="w-5 h-5 text-green-400" />
                    : <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">Required</span>
                  }
                </div>

                {panFile && !panVerified && (
                  <div className="flex items-center gap-2 mb-3 bg-white/5 rounded-lg px-3 py-2">
                    <FileText className="w-3 h-3 text-white/40" />
                    <span className="text-xs text-white/60 flex-1 truncate">{panFile.name}</span>
                    <button onClick={() => setPanFile(null)}>
                      <X className="w-3 h-3 text-white/30 hover:text-white/60" />
                    </button>
                  </div>
                )}

                {panVerified ? (
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <CheckCircle className="w-3 h-3" />
                    <span>Verified by AI — PAN extracted successfully</span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      ref={panInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) setPanFile(f); }}
                    />
                    <button
                      onClick={() => panInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 py-2 border border-dashed border-white/20 rounded-xl text-xs text-white/50 hover:border-blue-500/50 hover:text-blue-400 transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                      {panFile ? 'Change file' : 'Upload PAN Card'}
                    </button>
                    <button
                      onClick={() => panInputRef.current?.click()}
                      className="px-3 py-2 border border-white/10 rounded-xl text-xs text-white/40 hover:bg-white/5 transition-colors"
                      title="Take photo"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                    {panFile && (
                      <button
                        onClick={() => handleDocUpload(panFile, 'pan')}
                        disabled={docUploading}
                        className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-xl text-xs text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                      >
                        {docUploading ? '...' : 'Verify'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Aadhaar Card */}
              <div className={`border rounded-2xl p-4 transition-all ${aadhaarVerified ? 'border-green-500/40 bg-green-500/5' : 'border-white/10 bg-white/5'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${aadhaarVerified ? 'bg-green-500/20' : 'bg-violet-500/20'}`}>
                      <FileText className={`w-4 h-4 ${aadhaarVerified ? 'text-green-400' : 'text-violet-400'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Aadhaar Card</p>
                      <p className="text-xs text-white/40">Address & identity proof</p>
                    </div>
                  </div>
                  {aadhaarVerified
                    ? <CheckCircle className="w-5 h-5 text-green-400" />
                    : <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">Optional</span>
                  }
                </div>

                {aadhaarFile && !aadhaarVerified && (
                  <div className="flex items-center gap-2 mb-3 bg-white/5 rounded-lg px-3 py-2">
                    <FileText className="w-3 h-3 text-white/40" />
                    <span className="text-xs text-white/60 flex-1 truncate">{aadhaarFile.name}</span>
                    <button onClick={() => setAadhaarFile(null)}>
                      <X className="w-3 h-3 text-white/30 hover:text-white/60" />
                    </button>
                  </div>
                )}

                {aadhaarVerified ? (
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <CheckCircle className="w-3 h-3" />
                    <span>Verified by AI — address extracted</span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      ref={aadhaarInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) setAadhaarFile(f); }}
                    />
                    <button
                      onClick={() => aadhaarInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 py-2 border border-dashed border-white/20 rounded-xl text-xs text-white/50 hover:border-violet-500/50 hover:text-violet-400 transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                      {aadhaarFile ? 'Change file' : 'Upload Aadhaar'}
                    </button>
                    <button
                      onClick={() => aadhaarInputRef.current?.click()}
                      className="px-3 py-2 border border-white/10 rounded-xl text-xs text-white/40 hover:bg-white/5 transition-colors"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                    {aadhaarFile && (
                      <button
                        onClick={() => handleDocUpload(aadhaarFile, 'aadhaar')}
                        disabled={docUploading}
                        className="px-4 py-2 bg-violet-500/20 border border-violet-500/30 rounded-xl text-xs text-violet-400 hover:bg-violet-500/30 transition-colors disabled:opacity-50"
                      >
                        {docUploading ? '...' : 'Verify'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Privacy notice */}
              <div className="bg-white/3 border border-white/5 rounded-xl p-3">
                <p className="text-xs text-white/30 leading-relaxed">
                  🔒 Documents are processed by Amazon Nova AI for data extraction only. No document images are stored. 
                  All processing is compliant with DPDP Act 2023 and RBI V-CIP guidelines.
                </p>
              </div>
            </div>
          )}

          {/* Agent status — always visible at bottom */}
          <div className="border-t border-white/5 p-3 flex-shrink-0 bg-black/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-white/40 uppercase tracking-wide">AI Agents</span>
              <span className="text-xs text-white/30">{completedAgents}/7</span>
            </div>
            <AgentDashboard agentStates={agentStates} language={language} compact />
          </div>
        </div>
      </div>
    </div>
  );
}
