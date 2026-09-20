import React, { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { Quote, MoodType } from '../types';
import { QUOTES, MEDITATION_POOL, MeditationVideo } from '../data/mockData';
import { Calendar, BookOpen, Wind, Bell, Play, ExternalLink, X, RotateCw } from 'lucide-react';

interface QuoteFinishStepProps {
  moodType: MoodType;
  emotionWord: string;
  onGoToCalendar: () => void;
  onGoToStorage: () => void;
  onOpenBreathingModal: (title: string, durationMin: number, mode?: 'breathing' | 'singingBowl') => void;
}

export const QuoteFinishStep: React.FC<QuoteFinishStepProps> = ({
  moodType,
  emotionWord,
  onGoToCalendar,
  onGoToStorage,
  onOpenBreathingModal
}) => {
  // Fire confetti celebration on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // safe fallback
    }
  }, []);

  const quote: Quote = useMemo(() => {
    return QUOTES[Math.floor(Math.random() * QUOTES.length)];
  }, []);

  // Meditation video pool for this mood quadrant
  const pool = useMemo(() => {
    return MEDITATION_POOL[moodType] || MEDITATION_POOL['B형'];
  }, [moodType]);

  // Initial random video selection from pool
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number>(() => {
    return Math.floor(Math.random() * pool.length);
  });

  const activeVideo: MeditationVideo = pool[selectedVideoIndex] || pool[0];

  // State to toggle in-app YouTube iframe player
  const [isPlayingInApp, setIsPlayingInApp] = useState(false);

  const handleShuffleVideo = () => {
    setSelectedVideoIndex(prev => (prev + 1) % pool.length);
    setIsPlayingInApp(false);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200/80 space-y-6 text-center">
      {/* Celebration Header */}
      <div className="space-y-2">
        <div className="w-16 h-16 mx-auto rounded-full bg-rose-100 flex items-center justify-center text-3xl shadow-inner animate-bounce">
          🎉
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block">
          오늘의 기록 완료!
        </span>
        <h2 className="text-2xl font-black text-[#123b5d]">
          오늘도 수고했어, 참 잘했어! 🍓
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">
          마음을 온전히 들여다보고 감사한 일들을 적어낸 네 모습이 정말 자랑스러워.
        </p>
      </div>

      {/* Inspiring Quote Card */}
      <div className="p-6 sm:p-7 rounded-2xl bg-[#fff9e6] border border-amber-200 text-stone-800 space-y-3 relative overflow-hidden shadow-xs">
        <span className="text-3xl text-amber-400/80 font-serif leading-none block">“</span>
        <p className="text-sm sm:text-base font-bold leading-relaxed text-amber-950 font-serif">
          {quote.quote}
        </p>
        <div className="pt-2 text-xs font-semibold text-amber-800/80 flex items-center justify-center gap-1.5">
          <span>— {quote.author}</span>
          {quote.source && <span className="opacity-70">({quote.source})</span>}
        </div>
      </div>

      {/* Mind Care Section: 3 Distinct Pathways */}
      <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200/90 text-left space-y-4 shadow-xs">
        {/* Pathway 1: Recommended Video */}
        <div>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl p-1.5 rounded-xl bg-white shadow-2xs border border-stone-200/60">
                {activeVideo.emoji}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold text-emerald-700">
                    {moodType} 맞춤 마음 돌봄 영상
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                    {activeVideo.tag}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-black text-[#123b5d] leading-snug">
                  {activeVideo.title}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              {pool.length > 1 && (
                <button
                  type="button"
                  onClick={handleShuffleVideo}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-stone-100 text-stone-600 text-xs font-semibold border border-stone-200 shadow-2xs flex items-center gap-1 transition cursor-pointer"
                  title="다른 추천 영상 보기"
                >
                  <RotateCw className="w-3 h-3 text-stone-500" />
                  <span>다른 영상</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsPlayingInApp(!isPlayingInApp)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition cursor-pointer ${
                  isPlayingInApp
                    ? 'bg-stone-700 text-white hover:bg-stone-800'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                {isPlayingInApp ? (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span>영상 닫기</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>앱 내에서 바로 재생</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-xs text-stone-600 pl-1 mb-2">
            {activeVideo.desc} <span className="text-stone-400">({activeVideo.duration})</span>
          </p>

          {/* Embedded YouTube Iframe Player */}
          {isPlayingInApp && (
            <div className="pt-2">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-md bg-black border border-stone-800">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${activeVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                  title={activeVideo.title}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className="flex items-center justify-between pt-2 px-1 text-[11px] text-stone-500">
                <span>▶️ 화면 안에서 바로 시청할 수 있어요.</span>
                <a
                  href={activeVideo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-rose-600 hover:text-rose-700 font-bold inline-flex items-center gap-1 underline underline-offset-2"
                >
                  <span>유튜브 새 탭에서 크게 보기</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Pathways 2 & 3: Direct In-App Breathing & Singing Bowl Options */}
        <div className="pt-3 border-t border-stone-200/80">
          <span className="text-[11px] font-bold text-stone-500 block mb-2">
            🌿 또는 조용한 인앱 명상으로 마음을 편안하게 정돈해 보세요:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onOpenBreathingModal('4-4-4 카밍 호흡 가이드', 3, 'breathing')}
              className="p-2.5 rounded-xl bg-white hover:bg-emerald-50/50 border border-emerald-200 text-left flex items-center justify-between transition cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-emerald-100/70 text-emerald-800 text-sm">🌱</span>
                <div>
                  <span className="text-xs font-extrabold text-[#123b5d] block group-hover:text-emerald-700">
                    4-4-4 호흡 명상
                  </span>
                  <span className="text-[10px] text-stone-400">3분 시각 호흡 가이드</span>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600">시작 ▶</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenBreathingModal('싱잉볼 명상 & 마음 타이머', 3, 'singingBowl')}
              className="p-2.5 rounded-xl bg-white hover:bg-amber-50/50 border border-amber-200 text-left flex items-center justify-between transition cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-amber-100/70 text-amber-800 text-sm">🔔</span>
                <div>
                  <span className="text-xs font-extrabold text-[#123b5d] block group-hover:text-amber-700">
                    싱잉볼 명상 & 타이머
                  </span>
                  <span className="text-[10px] text-stone-400">맑은 종소리와 침묵</span>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-600">시작 ▶</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          onClick={onGoToStorage}
          className="py-3.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 bg-[#123b5d] hover:bg-[#1a4d77] text-white shadow-md transition cursor-pointer"
        >
          <BookOpen className="w-4 h-4" />
          <span>나의 마음 창고 확인하기</span>
        </button>

        <button
          onClick={onGoToCalendar}
          className="py-3.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 shadow-xs transition cursor-pointer"
        >
          <Calendar className="w-4 h-4" />
          <span>달력으로 돌아가기</span>
        </button>
      </div>
    </div>
  );
};
