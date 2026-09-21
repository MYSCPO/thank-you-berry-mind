import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Wind,
  Bell,
  Sliders,
  Upload,
  Check,
  Music,
  Waves,
  Plus,
  Minus,
  Youtube
} from 'lucide-react';
import { soundEngine } from '../utils/audioSynth';
import { YouTubeAudioPlayer } from './YouTubeAudioPlayer';

export type MeditationMode = 'breathing' | 'singingBowl';
export type BreathingSound = 'waves' | 'wind' | 'silent';

export const YOUTUBE_DEFAULT_VIDEO_ID = 'ugQQLyGs9SA';

interface BreathingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTitle?: string;
  defaultDurationMinutes?: number;
  initialMode?: MeditationMode;
}

export const BreathingModal: React.FC<BreathingModalProps> = ({
  isOpen,
  onClose,
  defaultTitle = '마음챙김 명상 가이드',
  defaultDurationMinutes = 3,
  initialMode = 'breathing'
}) => {
  // Active mode: Breathing (호흡) vs Singing Bowl (싱잉볼)
  const [mode, setMode] = useState<MeditationMode>(initialMode);
  
  // Timer state
  const [totalSeconds, setTotalSeconds] = useState(defaultDurationMinutes * 60);
  const [timeLeft, setTimeLeft] = useState(defaultDurationMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Audio selections for breathing mode
  const [breathingSound, setBreathingSound] = useState<BreathingSound>('waves');

  // YouTube Audio for Singing Bowl (Default & Dedicated)
  const [customYouTubeUrl, setCustomYouTubeUrl] = useState('https://youtu.be/ugQQLyGs9SA');
  const [activeVideoId, setActiveVideoId] = useState(YOUTUBE_DEFAULT_VIDEO_ID);
  const [isYouTubePlaying, setIsYouTubePlaying] = useState(false);

  // Breathing cycle phase (4-4-4 breathing)
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [cycleSeconds, setCycleSeconds] = useState(0);

  // Visual ripple for singing bowl
  const [bowlRipple, setBowlRipple] = useState(false);

  // Reset when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      const initialSeconds = defaultDurationMinutes * 60;
      setTotalSeconds(initialSeconds);
      setTimeLeft(initialSeconds);
      setIsRunning(false);
      setIsSettingsOpen(false);
      setCycleSeconds(0);
      setPhase('inhale');
      setIsYouTubePlaying(false);
    } else {
      setIsRunning(false);
      setIsYouTubePlaying(false);
      soundEngine.stopAll();
    }
  }, [isOpen, defaultDurationMinutes, initialMode]);

  // Extract YouTube ID from link
  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : YOUTUBE_DEFAULT_VIDEO_ID;
  };

  const handleApplyYouTubeUrl = (url: string) => {
    setCustomYouTubeUrl(url);
    const vid = extractVideoId(url);
    setActiveVideoId(vid);
  };

  // Handle ambient background sound for breathing mode
  useEffect(() => {
    if (isOpen && isRunning && mode === 'breathing') {
      if (breathingSound === 'waves') {
        soundEngine.startAmbient('waves');
      } else if (breathingSound === 'wind') {
        soundEngine.startAmbient('wind');
      } else {
        soundEngine.stopAmbient();
      }
    } else {
      soundEngine.stopAmbient();
    }
  }, [isOpen, isRunning, mode, breathingSound]);

  // Synchronize YouTube audio playback strictly with timer running state in Singing Bowl mode
  useEffect(() => {
    if (isOpen && isRunning && mode === 'singingBowl') {
      setIsYouTubePlaying(true);
    } else {
      setIsYouTubePlaying(false);
      soundEngine.stopAll();
    }
  }, [isOpen, isRunning, mode]);

  // Main countdown timer
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          setIsYouTubePlaying(false);
          soundEngine.stopAll();
          return 0;
        }
        return prev - 1;
      });

      // Update 4-4-4 breathing cycle
      if (mode === 'breathing') {
        setCycleSeconds(prev => {
          const next = (prev + 1) % 12;
          if (next < 4) setPhase('inhale');
          else if (next < 8) setPhase('hold');
          else setPhase('exhale');
          return next;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeLeft, mode]);

  const triggerBowlAnimation = () => {
    setBowlRipple(true);
    setTimeout(() => setBowlRipple(false), 2200);
  };

  const handleStart = () => {
    if (timeLeft <= 0) {
      setTimeLeft(totalSeconds);
    }
    setIsRunning(true);
    setIsSettingsOpen(false);

    // Start singing bowl sound
    if (mode === 'singingBowl') {
      triggerBowlAnimation();
      setIsYouTubePlaying(true);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
    setIsYouTubePlaying(false);
    soundEngine.stopAll();
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsYouTubePlaying(false);
    setTimeLeft(totalSeconds);
    setCycleSeconds(0);
    setPhase('inhale');
    soundEngine.stopAll();
  };

  const handleClose = () => {
    setIsRunning(false);
    setIsYouTubePlaying(false);
    soundEngine.stopAll();
    onClose();
  };

  // Adjust time by minutes
  const adjustMinutes = (deltaMin: number) => {
    const deltaSec = deltaMin * 60;
    setTotalSeconds(prev => {
      const next = Math.max(30, Math.min(3600, prev + deltaSec));
      setTimeLeft(next);
      return next;
    });
  };

  const setPresetMinutes = (minutes: number) => {
    const sec = minutes * 60;
    setTotalSeconds(sec);
    setTimeLeft(sec);
  };

  if (!isOpen) return null;

  const displayMinutes = Math.floor(timeLeft / 60);
  const displaySeconds = timeLeft % 60;
  const progressPercent = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;

  const phaseText = {
    inhale: '코로 천천히 숨을 들이마셔요 (4초)',
    hold: '숨을 머금고 편안하게 멈춰요 (4초)',
    exhale: '입으로 가만히 숨을 내쉬어요 (4초)'
  }[phase];

  const circleScale = {
    inhale: 'scale-110 sm:scale-120 bg-emerald-100/95 text-emerald-900 border-emerald-300',
    hold: 'scale-105 sm:scale-110 bg-amber-100/95 text-amber-900 border-amber-300',
    exhale: 'scale-90 sm:scale-95 bg-sky-100/95 text-sky-900 border-sky-300'
  }[phase];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      
      {/* Hidden YouTube Background Audio Engine */}
      <YouTubeAudioPlayer
        videoId={activeVideoId}
        isPlaying={isYouTubePlaying}
        onEnded={() => {
          // If video ends during timer, restart or smooth loop
          if (isRunning) {
            setIsYouTubePlaying(true);
          }
        }}
      />

      <div className="bg-[#12161a] text-stone-100 rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl border border-stone-800 text-center relative overflow-hidden max-h-[94vh] flex flex-col justify-between">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl p-1.5 rounded-xl bg-stone-800 text-emerald-400 border border-stone-700">
              {mode === 'breathing' ? '🌱' : '🔔'}
            </span>
            <div className="text-left">
              <span className="text-[11px] font-bold text-emerald-400 block tracking-wide">
                {mode === 'breathing' ? '4-4-4 카밍 호흡 가이드' : '싱잉볼 명상 & 타이머'}
              </span>
              <h3 className="text-sm font-extrabold text-white">
                {defaultTitle}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`p-2 rounded-xl transition cursor-pointer ${
                isSettingsOpen ? 'bg-emerald-500/20 text-emerald-300' : 'hover:bg-stone-800 text-stone-400 hover:text-stone-200'
              }`}
              title="유튜브 싱잉볼 음원 설정"
            >
              <Sliders className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center justify-center gap-2 my-2.5">
          <button
            type="button"
            onClick={() => {
              setMode('breathing');
              setIsRunning(false);
              setIsYouTubePlaying(false);
              soundEngine.stopAll();
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              mode === 'breathing'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>🌿 4-4-4 호흡</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('singingBowl');
              setIsRunning(false);
              setIsYouTubePlaying(false);
              soundEngine.stopAll();
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              mode === 'singingBowl'
                ? 'bg-amber-500 text-stone-950 font-black shadow-md'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>🔔 싱잉볼 & 타이머</span>
          </button>
        </div>

        {/* DETAILED SETTINGS VIEW (YouTube Link Setup) */}
        {isSettingsOpen ? (
          <div className="space-y-4 py-2 text-left animate-in fade-in duration-150 overflow-y-auto max-h-[50vh] pr-1">
            {/* YouTube Audio Link Box */}
            <div className="bg-stone-900/90 p-3.5 rounded-2xl border border-stone-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-200 flex items-center gap-1.5">
                  <Youtube className="w-4 h-4 text-red-400" />
                  <span>유튜브 싱잉볼 음원 연동</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> 기본 연동됨
                </span>
              </div>

              <p className="text-[11px] text-stone-400 leading-snug">
                싱잉볼 명상 시 등록된 유튜브 싱잉볼 영상의 잔잔한 공명 사운드가 자동으로 재생됩니다.
              </p>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={customYouTubeUrl}
                  onChange={(e) => handleApplyYouTubeUrl(e.target.value)}
                  placeholder="https://youtu.be/..."
                  className="flex-1 bg-stone-950 border border-stone-700 rounded-xl px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition cursor-pointer"
            >
              설정 완료 & 명상으로 돌아가기
            </button>
          </div>
        ) : (
          /* MAIN ACTIVE VIEW WITH PROMINENT TIME CONTROLS */
          <div className="py-1 flex flex-col items-center justify-center">
            
            {/* Visual Stage */}
            {mode === 'breathing' ? (
              /* 4-4-4 Breathing Visual */
              <div className="relative w-40 h-40 sm:w-44 sm:h-44 mx-auto flex items-center justify-center my-2">
                <div
                  className={`absolute inset-0 rounded-full border-4 transition-all duration-1000 ease-in-out shadow-2xl flex flex-col items-center justify-center p-3 ${circleScale}`}
                >
                  <span className="text-2xl mb-0.5">
                    {phase === 'inhale' ? '🌱' : phase === 'hold' ? '✨' : '🌬️'}
                  </span>
                  <span className="text-sm sm:text-base font-black">
                    {phase === 'inhale' ? '들이마시기' : phase === 'hold' ? '잠시 멈춤' : '내쉬기'}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold opacity-80 mt-0.5">
                    {phaseText}
                  </span>
                </div>
              </div>
            ) : (
              /* Singing Bowl Visual */
              <div className="relative w-40 h-40 sm:w-44 sm:h-44 mx-auto flex items-center justify-center my-2">
                {bowlRipple && (
                  <>
                    <div className="absolute inset-0 rounded-full border-2 border-amber-400/60 animate-ping" />
                    <div className="absolute -inset-4 rounded-full border border-amber-500/30 animate-pulse" />
                  </>
                )}
                
                <button
                  type="button"
                  onClick={() => {
                    triggerBowlAnimation();
                    const next = !isYouTubePlaying;
                    setIsYouTubePlaying(next);
                    if (!next) {
                      soundEngine.stopAll();
                    }
                  }}
                  className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-b from-amber-600/30 via-stone-800 to-stone-900 border-2 border-amber-500/50 shadow-2xl flex flex-col items-center justify-center p-3 group transition transform active:scale-95 cursor-pointer"
                  title="터치하여 싱잉볼 울리기"
                >
                  <span className="text-3xl mb-1 filter drop-shadow">🔔</span>
                  <span className="text-xs font-black text-amber-200">마음챙김 싱잉볼</span>
                  <span className="text-[9px] text-amber-400/80 mt-0.5 group-hover:text-amber-300">
                    {isYouTubePlaying ? '🎵 싱잉볼 재생 중 (터치 시 멈춤)' : '터치 시 싱잉볼 재생'}
                  </span>
                </button>
              </div>
            )}

            {/* SOUND SELECTION STRIP (Only shown for breathing mode) */}
            {mode === 'breathing' && (
              <div className="w-full bg-stone-900/90 p-2 rounded-2xl border border-stone-800 my-2">
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-[11px] font-bold text-stone-400 flex items-center gap-1">
                    <Waves className="w-3.5 h-3.5 text-sky-400" />
                    <span>배경 자연음:</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setBreathingSound('waves')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                        breathingSound === 'waves'
                          ? 'bg-sky-600 text-white'
                          : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <span>🌊 파도소리</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBreathingSound('wind')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                        breathingSound === 'wind'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <span>🍃 바람소리</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBreathingSound('silent')}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        breathingSound === 'silent'
                          ? 'bg-stone-700 text-white'
                          : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <span>무음</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* DIGITAL TIMER WITH DIRECT INCREMENT/DECREMENT BUTTONS */}
            <div className="flex items-center justify-center gap-3 my-1">
              <button
                type="button"
                onClick={() => adjustMinutes(-1)}
                className="w-8 h-8 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 flex items-center justify-center transition cursor-pointer active:scale-95"
                title="1분 줄이기"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <div className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-white">
                {String(displayMinutes).padStart(2, '0')}:{String(displaySeconds).padStart(2, '0')}
              </div>

              <button
                type="button"
                onClick={() => adjustMinutes(1)}
                className="w-8 h-8 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 flex items-center justify-center transition cursor-pointer active:scale-95"
                title="1분 늘리기"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* PROMINENT TIME PRESET PILLS */}
            <div className="flex items-center justify-center gap-1.5 my-2">
              {[1, 3, 5, 10].map(mins => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setPresetMinutes(mins)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    totalSeconds === mins * 60
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-xs'
                      : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                  }`}
                >
                  {mins}분
                </button>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden my-2">
              <div
                className={`h-full transition-all duration-300 ${mode === 'breathing' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <p className="text-[11px] text-stone-400 mb-1">
              {isRunning ? (
                <span className="text-emerald-400 font-bold">
                  {mode === 'breathing'
                    ? '자연의 숨결을 느끼며 몸의 긴장을 편안하게 풀어보세요'
                    : '현재의 고요한 싱잉볼 울림에 온전히 머물러 보세요'}
                </span>
              ) : (
                '시간을 설정한 뒤 [명상 시작]을 눌러주세요'
              )}
            </p>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="flex items-center justify-center gap-3 pt-3 border-t border-stone-800/80">
          {!isRunning ? (
            <button
              type="button"
              onClick={handleStart}
              className={`flex-1 py-3 px-6 rounded-2xl font-black text-sm shadow-lg transition transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'breathing'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-stone-950'
                  : 'bg-amber-500 hover:bg-amber-600 text-stone-950'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>명상 시작하기</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePause}
              className="flex-1 py-3 px-6 rounded-2xl bg-stone-700 hover:bg-stone-600 text-white font-black text-sm shadow-lg transition transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>잠시 멈춤</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="p-3 rounded-2xl bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-300 transition cursor-pointer"
            title="처음으로 리셋"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
