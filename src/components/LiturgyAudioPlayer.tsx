import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Volume2, VolumeX, FastForward, Mic, AlertCircle } from 'lucide-react';
import { useChurch } from '../context/ChurchContext';

export const LiturgyAudioPlayer: React.FC = () => {
  const { data } = useChurch();
  const { liturgy } = data;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeechSupported(false);
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  const getLiturgyTextToRead = () => {
    const stepsSummary = liturgy.steps
      .slice(0, 4)
      .map((s) => `${s.bagian}. ${s.keterangan || ''}`)
      .join('. ');

    return `Shalom jemaat GKI Efata Malanu. Panduan ibadah untuk hari ini, ${liturgy.mingguTanggal}. Tema pelayanan: ${liturgy.temaPelayanan}. Pelayan firman: ${liturgy.pelayanFirman}. Bacaan Alkitab: ${liturgy.ayatReferensi}. Mari ikuti tata ibadah dengan khusyuk. ${stepsSummary}`;
  };

  const handlePlay = () => {
    if (!speechSupported) {
      setErrorMessage('Browser Anda tidak mendukung pemutar suara audio liturgi.');
      return;
    }

    setErrorMessage(null);

    if (isPaused && utteranceRef.current) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
      startProgressTimer();
      return;
    }

    window.speechSynthesis.cancel();
    const text = getLiturgyTextToRead();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = playbackRate;
    utterance.volume = isMuted ? 0 : 1;

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(100);
      if (timerRef.current) window.clearInterval(timerRef.current);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setIsPlaying(false);
      setIsPaused(false);
      setErrorMessage('Gagal memutar audio panduan liturgi.');
      if (timerRef.current) window.clearInterval(timerRef.current);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
    setProgress(5);
    startProgressTimer();
  };

  const startProgressTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    let currentProg = progress;
    timerRef.current = window.setInterval(() => {
      currentProg += 1;
      if (currentProg > 98) currentProg = 98;
      setProgress(currentProg);
    }, 400);
  };

  const handlePause = () => {
    if (speechSupported && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      setIsPaused(true);
      if (timerRef.current) window.clearInterval(timerRef.current);
    }
  };

  const handleStop = () => {
    if (speechSupported && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(0);
      if (timerRef.current) window.clearInterval(timerRef.current);
    }
  };

  const handleRateChange = () => {
    const rates = [1, 1.25, 1.5, 0.75];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (isPlaying) {
      handleStop();
      setTimeout(handlePlay, 100);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (utteranceRef.current) {
      utteranceRef.current.volume = !isMuted ? 0 : 1;
    }
  };

  return (
    <div className="no-print rounded-2xl bg-gradient-to-r from-[#9A3412] to-[#7C2D12] text-white p-4 sm:p-5 shadow-sm border border-[#D4AF37]/30 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#D4AF37] text-[#431407] flex items-center justify-center shadow-inner shrink-0">
            <Mic className={`h-5 w-5 ${isPlaying ? 'animate-pulse text-amber-950' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/20 text-[#E5C158]">
                Audio Guide
              </span>
              <span className="text-xs text-slate-200">Panduan Liturgi Suara</span>
            </div>
            <h3 className="font-display text-base sm:text-lg font-bold">
              Dengar Panduan Liturgi & Firman
            </h3>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isPlaying ? (
            <button
              type="button"
              onClick={handlePlay}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37] text-[#431407] font-bold text-xs hover:bg-[#e1be49] transition-colors shadow-sm"
              title="Putar Panduan Audio"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>{isPaused ? 'Lanjutkan' : 'Putar Audio'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePause}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white font-bold text-xs hover:bg-white/30 transition-colors"
              title="Jeda Audio"
            >
              <Pause className="h-4 w-4 fill-current" />
              <span>Jeda</span>
            </button>
          )}

          {(isPlaying || isPaused) && (
            <button
              type="button"
              onClick={handleStop}
              className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
              title="Berhenti"
            >
              <Square className="h-4 w-4 fill-current" />
            </button>
          )}

          <button
            type="button"
            onClick={handleRateChange}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 text-xs font-mono font-medium hover:bg-white/20 transition-colors"
            title="Kecepatan Baca"
          >
            <FastForward className="h-3.5 w-3.5" />
            <span>{playbackRate}x</span>
          </button>

          <button
            type="button"
            onClick={toggleMute}
            className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
            title={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Progress Bar & Status */}
      {(isPlaying || isPaused || progress > 0) && (
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-200">
            <span>{isPlaying ? 'Memutar panduan liturgi...' : isPaused ? 'Audio dijeda' : 'Selesai'}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#D4AF37] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 text-xs text-amber-200 bg-black/20 p-2 rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
